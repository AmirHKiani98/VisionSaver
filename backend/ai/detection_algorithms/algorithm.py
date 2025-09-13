import os
import pandas as pd
from ai.models import AutoDetection, AutoDetectionCheckpoint, DetectionProcess
from django.conf import settings
import cv2
import threading
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from ai.counter.model.main import line_points_to_xy, get_line_types
from copy import deepcopy
import dotenv
from django.utils import timezone
dotenv.load_dotenv(settings.ENV_PATH)
logger = settings.APP_LOGGER
class DetectionAlgorithm:
    """
    High-level entrypoint:
     - If AutoDetection exists for (record_id, version, divide_time) and file is present → return cached DataFrame.
     - Else → instantiate model subclass and call .run() (MP owned by abstract).
             → store/refresh AutoDetection with produced CSV.
    """
    def __init__(self, record_id, divide_time, version: str = "v1", lines=None):
        self.version = version
        self.record_id = record_id
        self.divide_time = divide_time
        self.detection_lines = lines
        self.file_name = f"{settings.MEDIA_ROOT}/{record_id}_{divide_time}_{version}.csv"
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
        if self.detection_lines is None:
            raise ValueError("Detection lines must be provided.")
        self.zones, self.directions = self._get_line_types()
        self.df = pd.DataFrame()
        self.detect = self._import_detect()
        self.last_detection = None
        self.modifier = self._import_modifier()
        self.counter = self._import_counter()
            
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
            zones = {}
            directions = {}
            for line_key, list_of_dicts in self.detection_lines.lines.items(): # type: ignore
                
                for line_dict in list_of_dicts:
                    points = line_dict.get('points', [])
                    if line_dict["tool"] == "direction":
                        directions[line_key] = points
                    if line_dict["tool"] == "zone":
                        zones[line_key] = points
                        

            return zones, directions
    
    def read(self):
        ret, frame = self.video.read()
        
        if not ret:
            return None
        
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
            in_area, final_line_key = self.counter.count_zones(detection["x1"], detection["y1"], 
                                                detection["x2"], detection["y2"], self.zones)
            current_results[index]['time'] = time
            current_results[index]['in_area'] = in_area
            current_results[index]['line_index'] = final_line_key
            
        return current_results

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
                'pid': f"{process_id}:{thread_id}",
            }
        )
        frame_count = 0
        if checkpoint:
            frame_count = checkpoint.last_frame_captured
            # Seek to the right position
            self.video.set(cv2.CAP_PROP_POS_FRAMES, frame_count)
            print(f"Resuming from frame {frame_count}")
        total_frames = int(self.video.get(cv2.CAP_PROP_FRAME_COUNT))
        # TODO: Check if there is frame done in AutoDetectionCheckpoint and resume from there
        batch_size = 200
        df = pd.DataFrame()
        self._send_ws_progress(0, total_frames, message=os.getenv("COMMAND_DETECTION_STARTED"))
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
            results = self.read()
        
            if results is None:
                break
            frame_count += 1
            df = pd.concat([df, pd.DataFrame(results)], ignore_index=True)
            
            if frame_count % batch_size == 0:
                file_exists = os.path.isfile(self.file_name)
                with open(self.file_name, 'a') as f:
                    print(f"Writing to {self.file_name}, frame {frame_count}")
                    df.to_csv(f, mode='a', header=not file_exists, index=False, lineterminator='\n')
                    df = pd.DataFrame()  # Clear the DataFrame after writing
                    f.flush()
                self._send_ws_progress(frame_count, total_frames, message=os.getenv("COMMAND_DETECTION_AVAILABLE"))
        if frame_count % batch_size != 0:
            file_exists = os.path.isfile(self.file_name)
            
            with open(self.file_name, 'a') as f:
                df.to_csv(f, mode='a', header=not file_exists, index=False, lineterminator='\n')
                f.flush()
        self._send_ws_progress(total_frames, total_frames, message=os.getenv("COMMAND_DETECTION_COMPLETED"))
        self.video.release()
        
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
        
        self.df = pd.read_csv(self.file_name)
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
