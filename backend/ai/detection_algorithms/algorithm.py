import os
import pandas as pd
from ai.models import AutoDetection, AutoDetectionCheckpoint
from django.conf import settings
import cv2
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from ai.counter.model.main import line_points_to_xy, get_line_types
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
        self.line_types = self._get_line_types()
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
        return getattr(module, "counter")

    def _get_line_types(self, tolerance=0.1):
            self.line_types = {}
            for line_key, list_of_dicts in self.detection_lines.lines.items(): # type: ignore
                self.line_types[line_key] = []
                for line_dict in list_of_dicts:
                    points = line_dict.get('points', [])
                    if points:
                        points = line_points_to_xy(points, video_width=self.video_width, video_height=self.video_height)  # Normalized to [0,1]
                        line_type, geom = get_line_types(points, tolerance)
                        self.line_types[line_key].append((line_type, geom))
            return self.line_types
    
    def read(self):
        ret, frame = self.video.read()
        frame += 1
        if not ret:
            return None
        

        time = self.video.get(cv2.CAP_PROP_POS_MSEC) / 1000.0
        
        results = self.detect(frame)

            
        if self.last_detection is not None:
            results = self.modifier(self.last_detection, results)
        self.last_detection = results

        for index, detection in enumerate(results):
            in_area, final_line_key = self.counter(detection["x1"], detection["y1"], detection["x2"], detection["y2"], self.line_types)
            results[index]['time'] = time
            results[index]['in_area'] = in_area
            results[index]['line_index'] = final_line_key
        return results

    def run(self) -> pd.DataFrame:
        """
        Run the detection algorithm on the video frames.
        """
        frame_count = 0
        total_frames = int(self.video.get(cv2.CAP_PROP_FRAME_COUNT))
        
        while True:
            results = self.read()
            if results is None:
                break
            df = pd.DataFrame(results)
            file_exists = os.path.isfile(self.file_name)
            df.to_csv(self.file_name, mode='a', header=not file_exists, index=False)
            if frame_count % 200 == 0:
                self._send_ws_progress(frame_count, total_frames)
        
        self._send_ws_progress(frame_count, total_frames)
        
        AutoDetection.objects.update_or_create(
            record_id=self.record_id,
            version=self.version,
            divide_time=self.divide_time,
            file_name=self.file_name
        )
        
        self.df = pd.read_csv(self.file_name)
        return self.df
    
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
                divide_time=self.divide_time,
                last_frame_captured=frame_count,
                detection_lines=self.detection_lines
            )
            async_to_sync(channel_layer.group_send)(group, payload)
        except Exception as e:
            logger.error(f"[WebSocket] Error sending progress: {e}")
