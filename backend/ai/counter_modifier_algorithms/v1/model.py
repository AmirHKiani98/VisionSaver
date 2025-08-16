import json
import pandas as pd
import os
import math
from django.conf import settings
import numpy as np
from shapely.strtree import STRtree
from shapely.ops import nearest_points
from shapely.geometry import Point, Polygon, LineString, box
from tqdm import tqdm
from multiprocessing import Pool, cpu_count
from ai.models import ModifiedAutoCounter

logger = settings.APP_LOGGER
class Model():
    """
    Base class for counter algorithms.
    """
    def __init__(self, auto_detection_csv_path, detection_lines, video_width, video_height, area_threshold=0.9):
        self.auto_detection_csv_path = auto_detection_csv_path
        self.area_threshold = area_threshold
        if os.path.exists(self.auto_detection_csv_path):
            self.auto_detection_df = pd.read_csv(self.auto_detection_csv_path)
        else:
            raise FileNotFoundError(f"The file {self.auto_detection_csv_path} does not exist.")
        
        self.detection_lines = detection_lines
        self.video_width = video_width
        self.video_height = video_height
        self.detection_line_types = self._get_line_types()
    
    def cleaner(self):
        """
        cleans the auto detection dataframe
        track id should exist in the dataframe
        """
        if "track_id" not in self.auto_detection_df.columns:
            logger.error("The DataFrame must contain a 'track_id' column.")
            raise ValueError("The DataFrame must contain a 'track_id' column.")
        path = os.path.splitext(self.auto_detection_csv_path)[0]
        cleaned_path = f"{path}_cleaned_v1.csv"
        
        self.auto_detection_df["x1"] = self.auto_detection_df["x1"].astype("float64")
        self.auto_detection_df["y1"] = self.auto_detection_df["y1"].astype("float64")
        self.auto_detection_df["x2"] = self.auto_detection_df["x2"].astype("float64")
        self.auto_detection_df["y2"] = self.auto_detection_df["y2"].astype("float64")
        groups_by_track = self.auto_detection_df.groupby("track_id")
        if len(groups_by_track) == 0:
            raise ValueError("No tracks found in the auto detection dataframe")
        
        # df = pd.DataFrame()

        # for track_id, group in tqdm(groups_by_track, total=len(groups_by_track), desc="Cleaning tracks"):
        #     if group.empty:
        #         continue
            
        #     group = group.astype({"time": "float64"})
        #     group = group.sort_values(by="time")
        #     group["x_center"] = (group["x1"] + group["x2"]) / 2
        #     group["y_center"] = (group["y1"] + group["y2"]) / 2
        #     group["next_x_center"] = group["x_center"].shift(-1)
        #     group["next_y_center"] = group["y_center"].shift(-1)
        #     group["next_x_center"] = group["next_x_center"].ffill()
        #     group["next_y_center"] = group["next_y_center"].ffill()
        #     group["x_direction"] = group["next_x_center"] - group["x_center"]
            
        #     group["y_direction"] = group["next_y_center"] - group["y_center"]
        #     group["x_direction_unit"] = (group["x_direction"]) / ((group["x_direction"]**2) + (group["y_direction"]**2))
        #     group["y_direction_unit"] = (group["y_direction"]) / ((group["x_direction"]**2) + (group["y_direction"]**2))
        #     tang = group["y_direction_unit"] / group["x_direction_unit"]
        #     group["angle"] = tang.apply(lambda x: math.degrees(math.atan(x)) if x != 0 else 0)
        #     group["angle"] = group["angle"].apply(lambda x: x + 360 if x < 0 else x)
        #     group["zone"] = pd.Series([self._counter(row["x_center"], row["y_center"]) for _, row in group.iterrows()], index=group.index)
        #     df = pd.concat([df, group], ignore_index=True)
        df = self.auto_detection_df.copy()
        df = df.astype({"time": "float64"})
        groups_by_time = df.groupby("time")
        df2 = pd.DataFrame()
        with Pool(cpu_count()) as pool:
            results = list(tqdm(pool.imap(merge_group, groups_by_time), total=len(groups_by_time), desc="Merging overlapping rectangles (multiprocessing)"))
        df2 = pd.concat(results, ignore_index=True)
        df2.to_csv(cleaned_path, index=False)
        return df2, cleaned_path
    
    def _counter(self, center_x, center_y, line_threshold=0.05):
        """
        Get the detections from the auto detection dataframe.
        """
        point = Point(center_x / self.video_width, center_y / self.video_height)
        for line_key, lines in self.detection_line_types.items():
            for line in lines:
                if line[0] == 'closed':
                    poly = line[1]
                    if poly.contains(point):
                        return line_key
                    
                elif line[0] == 'straight':
                    line_points = line[1]
                    tree = STRtree(line_points)
                    nearest_idx = tree.nearest(point)
                    nearest_line = line_points[nearest_idx]
                    p_query, p_on_nearest = nearest_points(point, nearest_line)
                    dist = p_query.distance(p_on_nearest)
                    if dist < line_threshold:
                        return line_key
        return None
    def _get_line_types(self, tolerance=0.1):
        """
        Determine the type of detection line based on the detection lines provided.
        """
        line_types = {}
        if not self.detection_lines:
            #logger.warning("No detection lines provided, returning empty line types")
            return line_types
        for line_key, lines in self.detection_lines.items():
            line_types[line_key] = []
            for line in lines:
                points = line['points']
                points = np.array(points, dtype=np.float32).reshape(-1, 2)
                first_point = points[0]
                last_point = points[-1]
                # Distance
                distance_vector = last_point - first_point
                distance = np.sqrt(np.sum(distance_vector**2))
                if distance < tolerance:
                    poly = Polygon(points)
                    
                    line_types[line_key].append(['closed', poly])
                else:
                    line_strings = [LineString([point, next_point]) for point, next_point in zip(points[:-1], points[1:])]
                    line_types[line_key].append(['straight', line_strings])
        self.line_types = line_types
        return self.line_types

def merge_group(group_tuple, area_threshold=0.7):
    """
    Merge overlapping rectangles in a group of detections.
    This function is for multiprocessing to handle large datasets efficiently.
    """
    time, group = group_tuple
    if group.empty:
        return pd.DataFrame()
    group = group.sort_values(by="track_id")
    for index, row in group.iterrows():
        row_polygon = box(row["x1"], row["y1"], row["x2"], row["y2"])
        for jndex, jow in group.iterrows():
            if index == jndex:
                continue
            jow_polygon = box(jow["x1"], jow["y1"], jow["x2"], jow["y2"])
            union = row_polygon.union(jow_polygon)
            intersection = row_polygon.intersection(jow_polygon)
            if not intersection.is_empty:
                intersection_area = intersection.area
                union_area = union.area
                if intersection_area / union_area > area_threshold:  # self.area_threshold
                    group.at[index, "track_id"] = min(row["track_id"], jow["track_id"])
    return group






