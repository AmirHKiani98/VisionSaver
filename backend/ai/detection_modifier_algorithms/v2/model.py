from __future__ import annotations
import os
import numpy as np
from multiprocessing import Pool, cpu_count
from django.conf import settings
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
logger = settings.APP_LOGGER
import pandas as pd
import polars as pl
from shapely.geometry import Polygon
def process_arg(arg):
    track_id, group, divide_time = arg
    group = group.sort_values(by='time')
    group["time"] = group["time"].round(2)
    min_time = group['time'].min()
    max_time = group['time'].max()
    group["x1"] = group["x1"].astype(float)
    group["y1"] = group["y1"].astype(float)
    group["x2"] = group["x2"].astype(float)
    group["y2"] = group["y2"].astype(float)
    time_range = pd.DataFrame({'time': np.arange(min_time, max_time + divide_time, divide_time/10)})
    time_range['time'] = time_range['time'].round(2)
    merged = pd.merge(time_range, group, on='time', how='left')
    merged = merged.sort_values(by='time').reset_index(drop=True)
    merged['x1'] = merged['x1'].interpolate()
    merged['y1'] = merged['y1'].interpolate()
    merged['x2'] = merged['x2'].interpolate()
    merged['y2'] = merged['y2'].interpolate()
    merged['track_id'] = track_id
    merged['cls_id'] = group['cls_id'].iloc[0]
    merged['confidence'] = group['confidence'].interpolate()
    return merged





class Model:
    """
    Base class for counter algorithms.
    """
    def __init__(self, auto_detection_csv_path, detection_lines, video_width, video_height, divide_time, record_id, area_threshold=0.9):
        self.auto_detection_csv_path = auto_detection_csv_path
        self.area_threshold = area_threshold
        self.record_id = record_id
        self.version = "v2"
        if os.path.exists(self.auto_detection_csv_path):
            self.auto_detection_df = pd.read_csv(self.auto_detection_csv_path)
        else:
            raise FileNotFoundError(f"The file {self.auto_detection_csv_path} does not exist.")
        self.divide_time = divide_time
        self.detection_lines = detection_lines
        self.video_width = video_width
        self.video_height = video_height

    def update_modificed_progress(self, progress):
        """
        Update the progress of the modification process via WebSocket.
        """
        group_name = f"detection_modifier_progress_{self.record_id}_{self.divide_time}_{self.version}"
        channel_layer = get_channel_layer()
        if channel_layer is not None:
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    "type": "modification.progress",
                    "progress": progress,
                }
            )

    def cleaner(self):
        """
        Clean up resources if needed.
        """
        groups_by_track = self.auto_detection_df.groupby('track_id')
        args = []
        for track_id, group in groups_by_track:
            args.append((
                track_id, group.copy(), self.divide_time
            ))
        num_processes = max(1, cpu_count() // 2)  # Use half of available CPUs
        results = []
        total_items = len(args)
        processed_items = 0
        with Pool(processes=num_processes) as pool:
            async_results = [pool.apply_async(process_arg, (arg,)) for arg in args]
            for async_result in async_results:
                result = async_result.get()  # This blocks until the result is ready
                results.append(result)
                
                # Update progress after each result
                processed_items += 1
                progress = (processed_items / total_items) * 100
                print(f"Progress: {progress:.2f}%, vesion: {self.version}")
                self.update_modificed_progress(progress)
        
        df = pd.concat(results, ignore_index=True) if results else pd.DataFrame()
        df = df.sort_values(by=['track_id', 'time']).reset_index(drop=True)
        output_csv_path = self.auto_detection_csv_path.replace('.csv', f'_modified.csv')
        df.to_csv(output_csv_path, index=False)
        from ai.models import ModifiedAutoDetection
        ModifiedAutoDetection.objects.update_or_create(
            record_id=self.record_id,
            version=self.version,
            defaults={'file_name': output_csv_path}
        )
        return output_csv_path

def modifier(results, previous_results, iou_threshold=0.8):
    """
    Modify detection results based on previous frame's results.
    """
    
    results_df = pl.DataFrame(results)
    if results_df.is_empty() or len(previous_results) == 0:
        return results
    results_df = results_df.with_columns([
        pl.struct(pl.col(['x1', 'y1', 'x2', 'y2'])).map_elements(lambda row: Polygon([(row['x1'], row['y1']), (row['x2'], row['y1']), (row['x2'], row['y2']), (row['x1'], row['y2'])])).alias('bbox')
    ])
    previous_results_df = pl.DataFrame(previous_results)
    if previous_results_df.is_empty():
        return results
    previous_results_df = previous_results_df.with_columns([
        pl.struct(pl.col(['x1', 'y1', 'x2', 'y2'])).map_elements(lambda row: Polygon([(row['x1'], row['y1']), (row['x2'], row['y1']), (row['x2'], row['y2']), (row['x1'], row['y2'])])).alias('bbox')
    ])


    # get the rows in the results_df with track_id not in previous_results_df
    new_detections = results_df.filter(~results_df['track_id'].is_in(previous_results_df['track_id']))
    rest_detections = results_df.filter(results_df['track_id'].is_in(previous_results_df['track_id']))
    if not new_detections.is_empty():
        # Check if the iou of the new detection with any previous detection is > iou_threshold
        new_rows = []
        for row in new_detections.iter_rows(named=True):
            found_match = False
            for prev_row in previous_results_df.iter_rows(named=True):
                iou = row['bbox'].intersection(prev_row['bbox']).area / row['bbox'].union(prev_row['bbox']).area
                if iou > iou_threshold:
                    row["track_id"] = prev_row["track_id"]
                    found_match = True
                    new_rows.append(row)
                    break
            if not found_match:
                new_rows.append(row)
        new_detections = pl.DataFrame(new_rows)
    combined_df = pl.concat([rest_detections, new_detections])
    combined_df = combined_df.drop('bbox')
    return combined_df.to_dicts()
        

