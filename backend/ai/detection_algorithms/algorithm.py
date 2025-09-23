from collections import defaultdict
import os
import pandas as pd
from ai.models import AutoDetection, AutoDetectionCheckpoint, DetectionProcess
from django.conf import settings
import cv2
import threading
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from shapely.geometry import Polygon
from ai.utils import resample_curve, parallelism_score
from copy import deepcopy
import dotenv
from django.utils import timezone
from ai.car import Car
import numpy as np
dotenv.load_dotenv(settings.ENV_PATH)
logger = settings.APP_LOGGER
class DetectionAlgorithm:
    """
    High-level entrypoint:
     - If AutoDetection exists for (record_id, version, divide_time) and file is present → return cached DataFrame.
     - Else → instantiate model subclass and call .run() (MP owned by abstract).
             → store/refresh AutoDetection with produced CSV.
    """
    def __init__(self, record_id, divide_time, version: str = "v1", lines=None, detection_time= None, debug: bool = False):
        self.version = version
        self.record_id = record_id
        self.divide_time = divide_time
        self.detection_lines = lines
        self.debug = debug
        
        self.file_name = f"{settings.MEDIA_ROOT}/{record_id}_{divide_time}_{version}.csv"
        self.detection_time = detection_time
        self.cars = {}
        if not os.path.exists(f"{settings.MEDIA_ROOT}/{self.record_id}.mp4"):
            if not os.path.exists(f"{settings.MEDIA_ROOT}/{self.record_id}.avi"):
                raise FileNotFoundError(f"Video file for record ID {self.record_id} not found.")
            else:
                self.video = cv2.VideoCapture(f"{settings.MEDIA_ROOT}/{self.record_id}.avi")
        else:
            self.video = cv2.VideoCapture(f"{settings.MEDIA_ROOT}/{self.record_id}.mp4")
        self.duration = self.video.get(cv2.CAP_PROP_FRAME_COUNT) / self.video.get(cv2.CAP_PROP_FPS)
        self.video_width = int(self.video.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.video_height = int(self.video.get(cv2.CAP_PROP_FRAME_HEIGHT))
        self.detection_results = pd.DataFrame(columns=['car_id', 'last_time_in_zone', 'line_index'])
        if self.detection_lines is None:
            raise ValueError("Detection lines must be provided.")
        self.cut_zones = self.detection_lines.cut_zones
        self.zones, self.directions, self.cut_zones_geom = self._get_line_types()
        self.df = pd.DataFrame()
        self.detect = self._import_detect()
        self.last_detection = None
        self.modifier = self._import_modifier()
        self.counter = self._import_counter()
        self.frame = None
    

    def _has_header(self, path):
        """
        Checks if the file exists and has content with headers already
        """
        if not os.path.exists(path) or os.path.getsize(path) == 0:
            return False
            
        with open(path, "r") as f:
            # Read the first line and check if it looks like a header
            first_line = f.readline().strip()
            return first_line != "" and "," in first_line and not all(c.isdigit() or c in ".,- " for c in first_line)
    def _import_detect(self):
        import importlib
        module = importlib.import_module(f"ai.detection_algorithms.{self.version}.model")
        return getattr(module, "detect")

    def _import_modifier(self):
        import importlib
        module = importlib.import_module(f"ai.detection_modifier_algorithms.{self.version}.model")
        return getattr(module, "modifier")
    
    def _import_counter(self):
        import importlib
        module = importlib.import_module(f"ai.counter.{self.version}.main")
        return getattr(module, "Counter")

    def _get_line_types(self):
            zones = defaultdict(list)
            directions = defaultdict(list)
            cut_zones = []
            for line_key, list_of_dicts in self.detection_lines.lines.items(): # type: ignore
                for line_dict in list_of_dicts:
                    points = line_dict.get('points', [])
                    if line_dict["tool"] == "direction":
                        points = np.asarray(points, dtype=np.float32).reshape(-1, 2)
                        x = points[:, 0]
                        y = points[:, 1]
                        resampled_points = resample_curve(x, y)
                        directions[line_key].append(resampled_points)
                    if line_dict["tool"] == "zone":
                        points = np.asarray(points, dtype=np.float32).reshape(-1, 2)
                        if not np.array_equal(points[0], points[-1]):
                            points = np.vstack([points, points[0]])
                        geom = Polygon(points)
                        zones[line_key].append(geom)

            for points_array in self.cut_zones:
                points = np.asarray(points_array, dtype=np.float32).reshape(-1, 2)
                if not np.array_equal(points[0], points[-1]):
                    points = np.vstack([points, points[0]])
                # Multiply all x points by video width and y points by video height
                points[:, 0] = points[:, 0] * self.video_width
                points[:, 1] = points[:, 1] * self.video_height
                geom = Polygon(points)
                cut_zones.append(geom)
            return zones, directions, cut_zones
    
    def remove_cut_zones_from_frame(self, frame):
        if not self.cut_zones_geom:
            return frame
        mask = np.ones(frame.shape[:2], dtype="uint8") * 255  # Start with a white mask
        for polygon in self.cut_zones_geom:
            pts = np.array(polygon.exterior.coords, dtype=np.int32)
            cv2.fillPoly(mask, [pts], (0, 0, 0))  # Fill the polygon area with black
        masked_frame = cv2.bitwise_and(frame, frame, mask=mask)
        return masked_frame

    def read(self):
        if self.detection_time is not None:
            current_frame = int(self.video.get(cv2.CAP_PROP_POS_FRAMES))
            fps = self.video.get(cv2.CAP_PROP_FPS)
            target_frame = int(self.detection_time * fps)
            if current_frame < target_frame:
                self.video.set(cv2.CAP_PROP_POS_FRAMES, target_frame)
            else:
                return None, []
        ret, frame = self.video.read()
        
        if not ret:
            return None, []
        
        frame = self.remove_cut_zones_from_frame(frame)
        self.frame = frame
        if self.debug:
            cv2.imshow('Frame', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                self.video.release()
                cv2.destroyAllWindows()
                return None, []
        
        
        time = self.video.get(cv2.CAP_PROP_POS_MSEC) / 1000.0
        
        # Get detections from current frame
        current_results = self.detect(frame)
        
        # Make a copy for tracking
        raw_current_results = deepcopy(current_results)
        
        # Use modifier if we have previous detections - FIX ORDER HERE
        # if self.last_detection is not None:
        #     # Change order - pass current results first, then previous
        #     current_results = self.modifier(current_results, self.last_detection)
        
        # Update last_detection for next frame
        self.last_detection = raw_current_results
        
        # Add time and other information
        for index, detection in enumerate(current_results):
            detection["x1"] = detection["x1"] / self.video_width
            detection["y1"] = detection["y1"] / self.video_height
            detection["x2"] = detection["x2"] / self.video_width
            detection["y2"] = detection["y2"] / self.video_height
            in_area, final_line_key, geom_index = self.counter.count_zones(detection["x1"], detection["y1"], 
                                                detection["x2"], detection["y2"], self.zones)
            current_results[index]['time'] = time
            current_results[index]['in_area'] = in_area
            current_results[index]['line_index'] = final_line_key
            current_results[index]['zone_index'] = geom_index
            track_id = detection.get("track_id")
            # if track_id not in self.cars:
            #     self.cars[track_id] = Car(track_id)
            # self.cars[track_id].add_coordinates(detection["x1"], detection["y1"], detection["x2"], detection["y2"])
            # self.cars[track_id].add_confidence(detection.get("confidence"))
            # self.cars[track_id].add_time(time)
            # self.cars[track_id].add_class_id(detection.get("cls_id"))
            # self.cars[track_id].add_in_area(in_area)
            # self.cars[track_id].add_line_index(final_line_key)
            # self.cars[track_id].add_zone_index(geom_index)
        df_to_be_saved = []
        cars_to_remove = []
        
        for car in self.cars.values():
            if car.times[-1] < time - 5:
                car_df = car.get_df()
                # direction = self.counter.find_direction(car_df, self.directions)
                # car_df['direction'] = direction
                detected_zone_car = car_df[car_df['in_area'] == True]
                valid_detections = detected_zone_car.dropna(subset=['line_index', 'zone_index'])
                if not valid_detections.empty:
                    unique_zone_counts = valid_detections.groupby('line_index')['zone_index'].nunique()
                    for line_index, actual_zone_count in unique_zone_counts.items():
                        expected_zone_count = len(self.zones.get(line_index, []))
                        if actual_zone_count == expected_zone_count and expected_zone_count > 0:
                            # Find the last time the car was in this zone
                            last_time_in_zone = valid_detections[valid_detections['line_index'] == line_index]['time'].max()
                            self.detection_results = pd.concat([self.detection_results, pd.DataFrame([[car.id, last_time_in_zone, line_index, car.class_id]], columns=['car_id', 'last_time_in_zone', 'line_index', 'class_id'])], ignore_index=True)
                df_to_be_saved.append(car_df)
                # Mark car for removal
                cars_to_remove.append(car.id)
        
        # Remove cars after iteration
        for car_id in cars_to_remove:
            del self.cars[car_id]
                
        return current_results, df_to_be_saved

    def run(self) -> pd.DataFrame:
        """
        Run the detection algorithm on the video frames.
        """
        checkpoint = AutoDetectionCheckpoint.objects.filter(
            record_id=self.record_id,
            version=self.version,
            divide_time=self.divide_time
        ).first()
        # Store the current thread ID and process ID
        thread_id = threading.get_ident()
        process_id = os.getpid()
        
        # Create or update the DetectionProcess record
        self.process_model, created = DetectionProcess.objects.update_or_create(
            record_id=self.record_id,
            version=self.version,
            divide_time=self.divide_time,
            autodetection_checkpoint= checkpoint,
            defaults={
                'done': False,
                'terminated': False,
                "terminate_requested": False,
                'created_at': timezone.now(),
                'pid': f"{process_id}:{thread_id}",
            }
        )
        frame_count = 0
        if checkpoint:
            frame_count = checkpoint.last_frame_captured
            self.video.set(cv2.CAP_PROP_POS_FRAMES, frame_count)
            print(f"Resuming from frame {frame_count}")
        total_frames = int(self.video.get(cv2.CAP_PROP_FRAME_COUNT))
        logger.info(f"Starting detection process for record {self.record_id}, version {self.version}, divide_time {self.divide_time}")
        self._send_ws_progress(0, total_frames, message=os.getenv("COMMAND_DETECTION_STARTED"))
        
        # IMPORTANT: Check if files already exist BEFORE trying to write anything
        main_file_exists = os.path.exists(self.file_name) and os.path.getsize(self.file_name) > 0
        count_file = self.file_name.replace('.csv', '_count.csv')
        count_file_exists = os.path.exists(count_file) and os.path.getsize(count_file) > 0
        
        # Keep track if we've written headers yet in this run
        headers_written = main_file_exists
        count_headers_written = count_file_exists
        
        while True:
            print(f"Processing frame {frame_count}/{total_frames}")
            if frame_count % 50 == 0:
                self.process_model.refresh_from_db()
                if self.process_model.terminate_requested:
                    self.process_model.terminated = True
                    self.process_model.terminated_at =  timezone.now()
                    self.process_model.done = False
                    self.process_model.save()
                    logger.info(f"Detection process for record {self.record_id}, version {self.version}, divide_time {self.divide_time} terminated as requested.")
                    break
            results, to_save_df = self.read()
        
            if results is None:
                break
                
            frame_count += 1
            
            # Write results if not empty
            if results:
                # The key fix: Only write headers if they haven't been written yet
                pd.DataFrame(results).to_csv(
                    self.file_name, 
                    mode='a',
                    header=not headers_written,  # Only write headers if they haven't been written
                    index=False
                )
                # After writing, mark headers as written
                headers_written = True
            
            # Process count data if available
            if len(to_save_df) > 0 and not self.detection_results.empty:
                # Same logic for count file
                self.detection_results.to_csv(
                    count_file,
                    mode='a',
                    header=not count_headers_written,  # Only write headers if they haven't been written
                    index=False
                )
                # After writing, mark count headers as written
                count_headers_written = True
                # Reset the detection results
                self.detection_results = pd.DataFrame(columns=['car_id', 'last_time_in_zone', 'line_index', 'class_id'])
        
            # ... rest of the code ...
        
        # After the loop, finalize everything
        self._send_ws_progress(total_frames, total_frames, message=os.getenv("COMMAND_DETECTION_COMPLETED"))
        self.video.release()
        
        # Create or update records
        AutoDetection.objects.update_or_create(
            record_id=self.record_id,
            version=self.version,
            divide_time=self.divide_time,
            file_name=self.file_name
        )
        
        DetectionProcess.objects.filter(
            record_id=self.record_id,
            version=self.version,
            divide_time=self.divide_time
        ).update(done=True)
        
        # Read back the data
        if os.path.exists(self.file_name):
            self.df = pd.read_csv(self.file_name)
        else:
            self.df = pd.DataFrame()
        
        return self.df
    
 
    def run_counter(self, df) -> pd.DataFrame:
        if df.empty:
            if os.path.isfile(self.file_name):
                df = pd.read_csv(self.file_name)
            else:
                raise ValueError("DataFrame is empty and no file found to read from.")
        df = self.counter.count_directions(df, self.directions)
        # Save the updated DataFrame back to CSV
        df.to_csv(self.file_name, index=False, lineterminator='\n')
        self.df = df
        return df

    def _send_ws_progress(self, frame_count: int, total_frame: int, message: str | None = None) -> None:
        """
        Fire-and-forget. Safe if Channels/Redis isn't configured (no crash).
        Expects a consumer handler named `send_progress`.
        """
        progress = (frame_count / total_frame) * 100
        try:
            channel_layer = get_channel_layer()
            if not channel_layer:
                return
            payload = {"type": "send.progress", "progress": float(progress)}
            if message is not None:
                payload["message"] = message
            group = f'detection_progress_{self.record_id}_{self.divide_time}_{self.version}'
            AutoDetectionCheckpoint.objects.update_or_create(
                record_id=self.record_id,
                version=self.version,
                total_frames=total_frame,
                divide_time=self.divide_time,
                detection_lines= self.detection_lines,
                defaults={
                    'last_frame_captured': frame_count
                }
            )
            async_to_sync(channel_layer.group_send)(group, payload)
        except Exception as e:
            logger.error(f"[WebSocket] Error sending progress: {e}")
