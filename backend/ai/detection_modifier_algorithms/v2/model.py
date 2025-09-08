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

def modifier(results, previous_results, iou_threshold=0.5):  # Lower threshold for better matching
    """
    Modify detection results based on previous frame's results.
    """
    
    # Safety check - if either input is empty, no need for complex logic
    if not results:
        return []
    
    if not previous_results:
        return results
    
    # Check if required keys exist in dictionaries
    required_keys = ['x1', 'y1', 'x2', 'y2', 'track_id']
    
    # Validate results
    valid_results = []
    for item in results:
        if all(key in item for key in required_keys):
            # Ensure all bounding box coordinates are valid numbers
            if (isinstance(item['x1'], (int, float)) and 
                isinstance(item['y1'], (int, float)) and
                isinstance(item['x2'], (int, float)) and
                isinstance(item['y2'], (int, float))):
                valid_results.append(item)
    
    # Validate previous results
    valid_previous = []
    for item in previous_results:
        if all(key in item for key in required_keys):
            # Ensure all bounding box coordinates are valid numbers
            if (isinstance(item['x1'], (int, float)) and 
                isinstance(item['y1'], (int, float)) and
                isinstance(item['x2'], (int, float)) and
                isinstance(item['y2'], (int, float))):
                valid_previous.append(item)
    
    
    if not valid_results:
        return []
    
    if not valid_previous:
        return valid_results
    
    try:
        # Create DataFrames with validated data
        results_df = pl.DataFrame(valid_results)
        previous_results_df = pl.DataFrame(valid_previous)
        
        
        # Safely add bbox column with error handling
        def safe_bbox_creation(row):
            try:
                return Polygon([
                    (float(row['x1']), float(row['y1'])), 
                    (float(row['x2']), float(row['y1'])), 
                    (float(row['x2']), float(row['y2'])), 
                    (float(row['x1']), float(row['y2']))
                ])
            except Exception as e:
                print(f"Error creating bbox: {e}")
                # Return a tiny valid polygon
                return Polygon([(0, 0), (0, 1), (1, 1), (1, 0)])
        
        # Add bbox columns
        results_df = results_df.with_columns([
            pl.struct(pl.col(['x1', 'y1', 'x2', 'y2'])).map_elements(safe_bbox_creation).alias('bbox')
        ])
        
        previous_results_df = previous_results_df.with_columns([
            pl.struct(pl.col(['x1', 'y1', 'x2', 'y2'])).map_elements(safe_bbox_creation).alias('bbox')
        ])
        
        # Get track IDs from previous frame
        existing_track_ids = previous_results_df['track_id'].to_list()
        
        # Split into continuing and new detections
        continuing_detections = results_df.filter(pl.col('track_id').is_in(existing_track_ids))
        new_detections = results_df.filter(~pl.col('track_id').is_in(existing_track_ids))
        
        
        # Process new detections to match with previous detections
        if new_detections.shape[0] > 0:
            new_rows = []
            for row in new_detections.iter_rows(named=True):
                best_iou = 0
                best_match = None
                
                for prev_row in previous_results_df.iter_rows(named=True):
                    try:
                        current_bbox = row['bbox']
                        prev_bbox = prev_row['bbox']
                        
                        # Calculate intersection over union
                        intersection = current_bbox.intersection(prev_bbox).area
                        union = current_bbox.area + prev_bbox.area - intersection
                        
                        if union > 0:
                            iou = intersection / union
                            if iou > best_iou:
                                best_iou = iou
                                best_match = prev_row
                    except Exception as e:
                        print(f"Error calculating IOU: {e}")
                        continue
                
                # If we found a good match, use its track_id
                if best_match is not None and best_iou > iou_threshold:
                    row_dict = {k: v for k, v in row.items()}
                    row_dict["track_id"] = best_match["track_id"]
                    new_rows.append(row_dict)
                else:
                    new_rows.append({k: v for k, v in row.items()})
            
            if new_rows:
                new_detections_df = pl.DataFrame(new_rows)
            else:
                new_detections_df = new_detections
        else:
            new_detections_df = new_detections
        
        # Combine continuing and newly matched detections
        if continuing_detections.shape[0] > 0:
            if new_detections_df.shape[0] > 0:
                combined_df = pl.concat([continuing_detections, new_detections_df])
            else:
                combined_df = continuing_detections
        else:
            combined_df = new_detections_df
        
        # Remove the bbox column before returning
        if combined_df.shape[0] > 0:
            combined_df = combined_df.drop('bbox')
            result_dicts = combined_df.to_dicts()
            return result_dicts
        else:
            print("No results after processing")
            return []
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        # On error, return the original results
        return results
        

