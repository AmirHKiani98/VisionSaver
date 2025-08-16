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
from typing import cast, Dict, List, Any
import numpy as np
import pandas as pd
from pandas.api.types import is_datetime64_any_dtype, is_numeric_dtype
from shapely.geometry import Point, Polygon, LineString, box
from shapely.geometry.base import BaseGeometry
from shapely.ops import nearest_points
from shapely.strtree import STRtree

logger = settings.APP_LOGGER



# ---------- time helpers ----------
def _round_to_decimals(step: float) -> int:
    s = str(step)
    return len(s.split(".")[1]) if "." in s else 0

def _full_time_grid(tmin: float, tmax: float, step: float, decimals: int) -> np.ndarray:
    n = int(round((tmax - tmin) / step)) + 1
    grid = tmin + np.arange(n) * step
    return np.round(grid, decimals)

# ---------- geometry helpers ----------
def _nearest_geom_from_tree(tree: STRtree, point: Point, segments: List[LineString]) -> BaseGeometry:
    # Shapely 2.x: prefer index API if present
    res = tree.nearest(point)  # -> geometry OR index depending on version
    if isinstance(res, (np.integer, int)):
        return cast(BaseGeometry, segments[int(res)])
    return cast(BaseGeometry, res)

def _compile_lines_for_worker(detection_line_types: Dict[str, List[List[Any]]]):
    """
    Build a per-worker structure with STRtrees precomputed for 'straight' entries.
    Returns: { key: [ ('closed', Polygon) or ('straight', {'segments': list[LineString], 'tree': STRtree}) ] }
    """
    compiled: Dict[str, List[Any]] = {}
    for line_key, entries in detection_line_types.items():
        lst = []
        for tag, payload in entries:
            if tag == "closed":
                lst.append(("closed", cast(Polygon, payload)))
            else:
                segments: List[LineString] = cast(List[LineString], payload)
                tree = STRtree(segments)
                lst.append(("straight", {"segments": segments, "tree": tree}))
        compiled[line_key] = lst
    return compiled

# ---------- interpolation helper (standalone; picklable) ----------
def _fill_piecewise_linear_series(s: pd.Series) -> pd.Series:
    s = s.copy()
    y = s.to_numpy(dtype="float64")
    n = y.size

    if is_datetime64_any_dtype(s.index):
        x = s.index.astype("int64", copy=False).to_numpy(dtype="float64")
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
            R = j
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

# ---------- per-track worker ----------
def _process_track_task(args):
    """
    args = (track_id, group_df, divide_time, decimals, detection_line_types, video_w, video_h, line_threshold)
    Returns processed DataFrame for that track (regular grid, interpolated, features, zone).
    """
    (track_id, group, divide_time, decimals,
     detection_line_types, video_w, video_h, line_threshold) = args

    g = group.copy()
    if g.empty:
        g["track_id"] = track_id
        return g

    g = g.sort_values("time")
    g = g.drop_duplicates(subset="time", keep="first")
    g["time"] = g["time"].round(decimals)

    tmin, tmax = g["time"].min(), g["time"].max()
    full_t = _full_time_grid(tmin, tmax, float(divide_time), decimals)

    # reindex to full grid
    g = g.set_index("time").reindex(full_t)

    # piecewise (between consecutive valid points only)
    for c in ("x1", "y1", "x2", "y2"):
        g[c] = _fill_piecewise_linear_series(g[c])
        # (Alternatively: g[c] = g[c].interpolate(method="index", limit_area="inside"))

    # centers and next centers
    g["x_center"] = (g["x1"] + g["x2"]) * 0.5
    g["y_center"] = (g["y1"] + g["y2"]) * 0.5
    g["next_x_center"] = g["x_center"].shift(-1).ffill()
    g["next_y_center"] = g["y_center"].shift(-1).ffill()

    dx = g["next_x_center"] - g["x_center"]
    dy = g["next_y_center"] - g["y_center"]
    g["x_direction"] = dx
    g["y_direction"] = dy

    # unit vector + heading
    norm = np.hypot(dx, dy)
    norm = norm.replace(0, np.nan) if isinstance(norm, pd.Series) else np.where(norm == 0, np.nan, norm)
    g["x_direction_unit"] = dx / norm
    g["y_direction_unit"] = dy / norm
    ang = np.degrees(np.arctan2(g["y_direction_unit"], g["x_direction_unit"]))
    g["angle"] = (ang + 360.0) % 360.0

    # zone (build STRtrees once per worker)
    compiled = _compile_lines_for_worker(detection_line_types)

    def _zone_for_point(xc, yc):
        pt = Point(xc / video_w, yc / video_h)
        for line_key, items in compiled.items():
            for tag, payload in items:
                if tag == "closed":
                    poly: Polygon = cast(Polygon, payload)
                    if poly.contains(pt):
                        return line_key
                else:
                    entry = cast(dict, payload)
                    segments: List[LineString] = cast(List[LineString], entry["segments"])
                    tree: STRtree = cast(STRtree, entry["tree"])
                    ngeom = _nearest_geom_from_tree(tree, pt, segments)
                    p_query, p_on = nearest_points(pt, ngeom)
                    if p_query.distance(p_on) < line_threshold:
                        return line_key
        return None

    g["zone"] = [ _zone_for_point(xc, yc) for xc, yc in zip(g["x_center"], g["y_center"]) ]

    g["track_id"] = track_id
    g = g.reset_index().rename(columns={"index": "time"})
    return g

# ---------- per-time merge worker (your function, signature-preserving) ----------
def merge_group(group_tuple, area_threshold=0.7):
    time_val, group = group_tuple
    if group.empty:
        return pd.DataFrame()

    group = group.sort_values(by="track_id")
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
    def __init__(self, auto_detection_csv_path, detection_lines, video_width, video_height, divide_time, record_id, area_threshold=0.9):
        self.auto_detection_csv_path = auto_detection_csv_path
        self.area_threshold = area_threshold
        self.record_id = record_id
        self.version = "v1"
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

    def cleaner(self, use_mp_interpolate: bool = True, use_mp_merge: bool = True, line_threshold: float = 0.05):
        """
        Parallel:
        1) per-track interpolation + feature/zone calc
        2) per-time merge of overlapping rectangles
        """
        required = {"track_id", "time", "x1", "y1", "x2", "y2"}
        missing = required - set(self.auto_detection_df.columns)
        if missing:
            logger.error(f"Missing required columns: {sorted(missing)}")
            raise ValueError(f"Missing required columns: {sorted(missing)}")

        path = os.path.splitext(self.auto_detection_csv_path)[0]
        cleaned_path = f"{path}_cleaned_v1.csv"

        # dtypes
        for c in ("x1", "y1", "x2", "y2"):
            self.auto_detection_df[c] = self.auto_detection_df[c].astype("float64")
        self.auto_detection_df["time"] = self.auto_detection_df["time"].astype("float64")

        groups_by_track = self.auto_detection_df.groupby("track_id", sort=False)
        ng = groups_by_track.ngroups
        if ng == 0:
            raise ValueError("No tracks found in the auto detection dataframe")

        decimals = _round_to_decimals(float(self.divide_time))

        # -------- 1) PER-TRACK PARALLEL INTERPOLATION --------
        track_tasks = (
            (track_id, group.copy(), self.divide_time, decimals,
            self.detection_line_types, self.video_width, self.video_height, line_threshold)
            for track_id, group in groups_by_track
        )

        if use_mp_interpolate and ng >= 2:
            # small chunks keep memory bounded; tune if tracks are tiny/huge
            chunksize = max(1, ng // (cpu_count() * 4) or 1)
            with Pool(min(cpu_count(), 8)) as pool:

                processed_groups = []
                for idx, result in enumerate(
                    tqdm(
                        pool.imap_unordered(_process_track_task, track_tasks, chunksize=chunksize),
                        total=ng,
                        desc="Interpolating tracks (multiprocessing)"
                    )
                ):
                    processed_groups.append(result)
                    channel_layer = get_channel_layer()
                    group_name = f"counter_modified_progress_{self.record_id}_{self.divide_time}_{self.version}"
                    try:
                        if channel_layer is not None:
                            async_to_sync(channel_layer.group_send)(
                                group_name,
                                {
                                    "type": "send.progress",
                                    "progress": (idx + 1) / ng
                                }
                            )
                    except Exception as e:
                        logger.error(f"Error sending interpolation progress via ws: {e}")

            try:
                if channel_layer is not None:
                    async_to_sync(channel_layer.group_send)(
                        group_name,
                        {
                            "type": "send.progress",
                            "progress": 1,
                            "message": "Interpolation complete"
                        }
                    )
            except Exception as e:
                logger.error(f"Error sending interpolation complete via ws: {e}")
        else:
            processed_groups = []
            for args in tqdm(track_tasks, total=ng, desc="Interpolating tracks"):
                processed_groups.append(_process_track_task(args))

        df = pd.concat(processed_groups, ignore_index=True)

        # -------- 2) PER-TIME PARALLEL MERGE --------
        groups_by_time = df.groupby("time", sort=False)
        time_tasks = list(groups_by_time)  # each item is (time_value, df_time)
        total = len(time_tasks)

        if use_mp_merge and total >= 2:
            chunksize = max(1, total // (cpu_count() * 4) or 1)
            with Pool(min(cpu_count(), 8)) as pool:
                func = partial(merge_group, area_threshold=self.area_threshold)
                results = []
                for idx, result in enumerate(
                    tqdm(
                        pool.imap_unordered(func, time_tasks, chunksize=chunksize),
                        total=total,
                        desc="Merging overlapping rectangles (multiprocessing)"
                    )
                ):
                    results.append(result)
                    channel_layer = get_channel_layer()
                    group_name = f"counter_modified_progress_{self.record_id}_{self.divide_time}_{self.version}"
                    try:
                        if channel_layer is not None:
                            async_to_sync(channel_layer.group_send)(
                                group_name,
                                {
                                    "type": "send.progress",
                                    "progress": (idx + 1) / total
                                }
                            )
                    except Exception as e:
                        logger.error(f"Error sending merge progress via ws: {e}")
                try:
                    if channel_layer is not None:
                        async_to_sync(channel_layer.group_send)(
                            group_name,
                            {
                                "type": "send.progress",
                                "progress": 1,
                                "message": "Merging complete"
                            }
                        )
                except Exception as e:
                    logger.error(f"Error sending merge complete via ws: {e}")
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
