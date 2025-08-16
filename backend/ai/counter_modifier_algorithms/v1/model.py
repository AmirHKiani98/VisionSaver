from __future__ import annotations
import os
from typing import cast
import numpy as np
import pandas as pd
from pandas.api.types import is_datetime64_any_dtype, is_numeric_dtype
from shapely.strtree import STRtree
from shapely.ops import nearest_points
from shapely.geometry import Point, Polygon, LineString, box
from shapely.geometry.base import BaseGeometry
from shapely.ops import nearest_points
from multiprocessing import Pool, cpu_count
from functools import partial
from tqdm import tqdm
from django.conf import settings
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

logger = settings.APP_LOGGER


def _round_to_decimals(step: float) -> int:
    s = str(step)
    return len(s.split(".")[1]) if "." in s else 0


def _full_time_grid(tmin: float, tmax: float, step: float, decimals: int) -> np.ndarray:
    # robust grid: include right endpoint; avoid drift; keep consistent rounding
    n = int(round((tmax - tmin) / step)) + 1
    grid = tmin + np.arange(n) * step
    return np.round(grid, decimals)


def merge_group(group_tuple, area_threshold=0.7):
    """
    Merge overlapping rectangles in a group of detections.
    Expects (time_value, group_df). Returns a DataFrame for that time.
    """
    time_val, group = group_tuple
    if group.empty:
        return pd.DataFrame()

    group = group.sort_values(by="track_id")
    # O(n^2); OK for small n. For speed, prefilter with bbox overlap or STRtree.
    for i, row in group.iterrows():
        row_polygon = box(row["x1"], row["y1"], row["x2"], row["y2"])
        for j, other in group.iterrows():
            if i == j:
                continue
            other_polygon = box(other["x1"], other["y1"], other["x2"], other["y2"])
            inter = row_polygon.intersection(other_polygon)
            if inter.is_empty:
                continue
            union_area = row_polygon.union(other_polygon).area
            if union_area <= 0:
                continue
            if inter.area / union_area > area_threshold:
                group.at[i, "track_id"] = min(row["track_id"], other["track_id"])
    return group


class Model:
    """
    Base class for counter algorithms.
    """
    def __init__(self, auto_detection_csv_path, detection_lines, video_width, video_height, divide_time, area_threshold=0.9):
        self.auto_detection_csv_path = auto_detection_csv_path
        self.area_threshold = area_threshold
        if os.path.exists(self.auto_detection_csv_path):
            self.auto_detection_df = pd.read_csv(self.auto_detection_csv_path)
        else:
            raise FileNotFoundError(f"The file {self.auto_detection_csv_path} does not exist.")
        self.divide_time = divide_time
        self.detection_lines = detection_lines
        self.video_width = video_width
        self.video_height = video_height
        self.detection_line_types = self._get_line_types()

    # ---------- PUBLIC ----------

    def cleaner(self, use_mp_merge: bool = True):
        """
        Cleans the auto detection dataframe (per track regularization + interpolation),
        derives direction/angle/zone, then merges overlapping rectangles per time.
        """
        required = {"track_id", "time", "x1", "y1", "x2", "y2"}
        missing = required - set(self.auto_detection_df.columns)
        if missing:
            logger.error(f"Missing required columns: {sorted(missing)}")
            raise ValueError(f"Missing required columns: {sorted(missing)}")

        path = os.path.splitext(self.auto_detection_csv_path)[0]
        cleaned_path = f"{path}_cleaned_v1.csv"

        # enforce dtypes once
        for c in ("x1", "y1", "x2", "y2"):
            self.auto_detection_df[c] = self.auto_detection_df[c].astype("float64")
        self.auto_detection_df["time"] = self.auto_detection_df["time"].astype("float64")

        groups_by_track = self.auto_detection_df.groupby("track_id", sort=False)
        ng = groups_by_track.ngroups
        if ng == 0:
            raise ValueError("No tracks found in the auto detection dataframe")

        processed_groups = []
        decimals = _round_to_decimals(float(self.divide_time))

        # ---- per track processing (vectorized; no slow row concatenation) ----
        index = 0
        for track_id, group in groups_by_track:
            progress = index / ng
            index += 1
            if group.empty:
                continue

            g = group.copy()
            g = g.sort_values("time")
            # Prevent duplicate times causing interpolation issues
            g = g.drop_duplicates(subset="time", keep="first")
            g["time"] = g["time"].round(decimals)

            tmin, tmax = g["time"].min(), g["time"].max()
            full_t = _full_time_grid(tmin, tmax, float(self.divide_time), decimals)

            # Reindex to full timeline
            g = (g.set_index("time")
                   .reindex(full_t))

            # Interpolate between consecutive valid points only
            for c in ("x1", "y1", "x2", "y2"):
                # Either use your explicit function:
                g[c] = self.fill_piecewise_linear(g[c])
                # Or faster built-in equivalent:
                # g[c] = g[c].interpolate(method="index", limit_area="inside")

            # centers
            g["x_center"] = (g["x1"] + g["x2"]) * 0.5
            g["y_center"] = (g["y1"] + g["y2"]) * 0.5

            # next centers (same track, next frame)
            g["next_x_center"] = g["x_center"].shift(-1).ffill()
            g["next_y_center"] = g["y_center"].shift(-1).ffill()

            dx = g["next_x_center"] - g["x_center"]
            dy = g["next_y_center"] - g["y_center"]

            g["x_direction"] = dx
            g["y_direction"] = dy

            # Proper unit vector
            norm = np.hypot(dx, dy)
            norm = norm.replace(0, np.nan) if isinstance(norm, pd.Series) else np.where(norm == 0, np.nan, norm)
            g["x_direction_unit"] = dx / norm
            g["y_direction_unit"] = dy / norm

            # Proper angle in degrees [0, 360)
            ang = np.degrees(np.arctan2(g["y_direction_unit"], g["x_direction_unit"]))
            g["angle"] = (ang + 360.0) % 360.0

            # zone via your counter (point normalized by video dims)
            g["zone"] = [self._counter(xc, yc) for xc, yc in zip(g["x_center"], g["y_center"])]

            g["track_id"] = track_id
            g = g.reset_index().rename(columns={"index": "time"})
            processed_groups.append(g)

        df = pd.concat(processed_groups, ignore_index=True)

        # ---- Merge overlapping rectangles per time (correct MP usage) ----
        groups_by_time = df.groupby("time", sort=False)
        time_tasks = list(groups_by_time)  # list of (time, df_time)
        total = len(time_tasks)

        if use_mp_merge and total >= 4:
            with Pool(min(cpu_count(), 8)) as pool:
                func = partial(merge_group, area_threshold=self.area_threshold)
                results = list(tqdm(pool.imap(func, time_tasks),
                                    total=total,
                                    desc="Merging overlapping rectangles (multiprocessing)"))
        else:
            func = partial(merge_group, area_threshold=self.area_threshold)
            results = [func(t) for t in tqdm(time_tasks, total=total, desc="Merging overlapping rectangles")]

        df2 = pd.concat(results, ignore_index=True)
        df2.to_csv(cleaned_path, index=False)
        return df2, cleaned_path

    def fill_piecewise_linear(self, s: pd.Series) -> pd.Series:
        s = s.copy()
        y = s.to_numpy(dtype="float64")
        n = y.size

        # x-axis: prefer real index values to preserve time scaling
        if is_datetime64_any_dtype(s.index):
            x = s.index.astype("int64", copy=False).to_numpy(dtype="float64")  # ns
        elif is_numeric_dtype(s.index):
            x = pd.Index(s.index).to_numpy(dtype="float64")
        else:
            x = np.arange(n, dtype="float64")

        i = 0
        while i < n:
            if np.isnan(y[i]):
                L = i - 1
                j = i
                while j < n and np.isnan(y[j]):
                    j += 1
                R = j  # first valid right (or n)

                if L >= 0 and R < n:
                    denom = (x[R] - x[L])
                    if denom != 0:
                        m = (y[R] - y[L]) / denom
                        y[L+1:R] = y[L] + m * (x[L+1:R] - x[L])
                i = R
            else:
                i += 1

        s.iloc[:] = y
        return s

    # ---------- PRIVATE ----------

    def _counter(self, center_x, center_y, line_threshold=0.05):
        """
        Return the key of the first detection line matched by the point.
        For 'closed' polygons: point-inside.
        For 'straight' polylines: distance < threshold to any segment.
        """
        point = Point(center_x / self.video_width, center_y / self.video_height)

        for line_key, lines in self.detection_line_types.items():
            for line in lines:
                if line[0] == "closed":
                    poly: Polygon = cast(Polygon, line[1])
                    if poly.contains(point):
                        return line_key

                elif line[0] == "straight":
                    segments: list[LineString] = cast(list[LineString], line[1])
                    if not segments:
                        continue

                    tree = STRtree(segments)

                    # Use the nearest() method to find the closest geometry
                    nearest_geom: BaseGeometry
                    res = tree.nearest(point)
                    if isinstance(res, (np.integer, int)):
                        nearest_geom = cast(BaseGeometry, segments[int(res)])
                    else:
                        nearest_geom = cast(BaseGeometry, res)

                    p_query, p_on = nearest_points(point, nearest_geom)
                    dist = p_query.distance(p_on)
                    if dist < line_threshold:
                        return line_key

        return None

    def _get_line_types(self, tolerance=0.1):
        """
        Determine the type of detection line based on the detection lines provided.
        Returns a dict: { key: [ ['closed', Polygon] or ['straight', [LineString,...]] ] }
        """
        line_types: dict[str, list] = {}
        if not self.detection_lines:
            return line_types

        for line_key, lines in self.detection_lines.items():
            line_types[line_key] = []
            for line in lines:
                points = np.asarray(line["points"], dtype=np.float32).reshape(-1, 2)
                first_point = points[0]
                last_point = points[-1]
                dist = float(np.linalg.norm(last_point - first_point))
                if dist < tolerance:
                    poly = Polygon(points)
                    line_types[line_key].append(["closed", poly])
                else:
                    segs = [LineString([p, q]) for p, q in zip(points[:-1], points[1:])]
                    line_types[line_key].append(["straight", segs])
        self.line_types = line_types
        return self.line_types
