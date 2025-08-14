
import pandas as pd
import os
import math
from django.conf import settings
class Model():
    """
    Base class for counter algorithms.
    """
    def __init__(self, auto_detection_csv_path, detection_lines):
        self.auto_detection_csv_path = auto_detection_csv_path
        if os.path.exists(self.auto_detection_csv_path):
            self.auto_detection_df = pd.read_csv(self.auto_detection_csv_path)
        else:
            raise FileNotFoundError(f"The file {self.auto_detection_csv_path} does not exist.")
        
        self.detection_lines = detection_lines
        
    def counter(self):
        pass
    
    
    def _cleaner(self):
        """
        cleans the auto detection dataframe
        track id should exist in the dataframe
        """
        if "track_id" not in self.auto_detection_df.columns:
            raise ValueError("The DataFrame must contain a 'track_id' column.")
        groups_by_track = self.auto_detection_df.groupby("track_id")
        path = os.path.splitext(self.auto_detection_csv_path)[0]
        cleaned_path = f"{path}_cleaned.csv"
        if os.path.exists(cleaned_path):
            return pd.read_csv(cleaned_path)
        df = pd.DataFrame()
        for track_id, group in groups_by_track:
            if group.empty:
                continue
            group = group.astype({"time": "float64"})
            group = group.sort_values(by="time")
            group["x_center"] = (group["x1"] + group["x2"]) / 2
            group["y_center"] = (group["y1"] + group["y2"]) / 2
            group["next_x_center"] = group["x_center"].shift(-1)
            group["next_y_center"] = group["y_center"].shift(-1)
            group["next_x_center"].fillna('ffill', inplace=True)
            group["next_y_center"].fillna('ffill', inplace=True)
            group["x_direction"] = group["next_x_center"] - group["x_center"]
            group["y_direction"] = group["next_y_center"] - group["y_center"]
            group["x_direction_unit"] = (group["x_direction"]) / ((group["x_direction"]**2) + (group["y_direction"]**2))
            group["y_direction_unit"] = (group["y_direction"]) / ((group["x_direction"]**2) + (group["y_direction"]**2))
            tang = group["y_direction_unit"] / group["x_direction_unit"]
            group["angle"] = tang.apply(lambda x: math.degrees(math.atan(x)) if x != 0 else 0)
            group["angle"] = group["angle"].apply(lambda x: x + 360 if x < 0 else x)
            df = pd.concat([df, group], ignore_index=True)
        
        df.to_csv(cleaned_path, index=False)
        return df
            
            
        