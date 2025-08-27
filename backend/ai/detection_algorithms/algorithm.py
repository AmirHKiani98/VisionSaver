import os
import pandas as pd
from ai.models import AutoDetection
from django.conf import settings
from multiprocessing import Pool, cpu_count
import cv2
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from typing import Optional
logger = settings.APP_LOGGER
class DetectionAlgorithm:
    """
    High-level entrypoint:
     - If AutoDetection exists for (record_id, version, divide_time) and file is present → return cached DataFrame.
     - Else → instantiate model subclass and call .run() (MP owned by abstract).
             → store/refresh AutoDetection with produced CSV.
    """
    def __init__(self, record_id, divide_time, version: str = "v1", ):
        self.version = version
        self.record_id = record_id
        self.divide_time = divide_time
        self.file_name = f"{settings.MEDIA_ROOT}/{record_id}_{divide_time}_{version}.csv"
        if not os.path.exists(f"{settings.MEDIA_ROOT}/{self.record_id}.mp4"):
            if not os.path.exists(f"{settings.MEDIA_ROOT}/{self.record_id}.avi"):
                raise FileNotFoundError(f"Video file for record ID {self.record_id} not found.")
            else:
                self.video = cv2.VideoCapture(f"{settings.MEDIA_ROOT}/{self.record_id}.avi")
        else:
            self.video = cv2.VideoCapture(f"{settings.MEDIA_ROOT}/{self.record_id}.mp4")
        self.duration = self.video.get(cv2.CAP_PROP_FRAME_COUNT) / self.video.get(cv2.CAP_PROP_FPS)
        self.df = pd.DataFrame()
        self.detect = self._import_detect()
            
    def _import_detect(self):
        import importlib
        module = importlib.import_module(f"ai.detection_algorithms.{self.version}.model")
        return getattr(module, "detect")

    def run(self) -> pd.DataFrame:
        """
        Run the detection algorithm on the video frames.
        """
        # Use a list to collect results instead of repeatedly concatenating DataFrames
        all_results = []
        frame_count = 0
        total_frames = int(self.video.get(cv2.CAP_PROP_FRAME_COUNT))
        batch_size = 1000  # Save every 1000 frames to avoid memory issues
        
        while True:
            ret, frame = self.video.read()
            if not ret:
                break
            
            # Get the time into the video in seconds
            time = self.video.get(cv2.CAP_PROP_POS_MSEC) / 1000.0
            
            # Process the frame
            results = self.detect(frame)
            
            # Add time to each detection
            for detection in results:
                detection['time'] = time
            
            # Append results to our list
            all_results.extend(results)
            
            # Send progress update
            frame_count += 1
            progress = (frame_count / total_frames) * 100
            self._send_ws_progress(progress=progress)
            
            # Periodically save results to avoid memory issues with very large videos
            if frame_count % batch_size == 0:
                # Convert current batch to DataFrame and save
                if all_results:
                    temp_df = pd.DataFrame(all_results)
                    
                    # Append to existing file if it exists, otherwise create new
                    file_exists = os.path.isfile(self.file_name)
                    temp_df.to_csv(self.file_name, mode='a', header=not file_exists, index=False)
                    
                    # Clear the results list to free memory
                    all_results = []
        
        # Process any remaining results
        if all_results:
            final_df = pd.DataFrame(all_results)
            file_exists = os.path.isfile(self.file_name)
            final_df.to_csv(self.file_name, mode='a', header=not file_exists, index=False)
        
        # Update or create the AutoDetection record
        AutoDetection.objects.update_or_create(
            record_id=self.record_id,
            version=self.version,
            divide_time=self.divide_time,
            file_name=self.file_name
        )
        
        # Load the complete saved DataFrame to return
        self.df = pd.read_csv(self.file_name)
        return self.df
    
    def _send_ws_progress(self, progress: float, message: str | None = None) -> None:
        """
        Fire-and-forget. Safe if Channels/Redis isn't configured (no crash).
        Expects a consumer handler named `send_progress`.
        """
        try:
            channel_layer = get_channel_layer()
            if not channel_layer:
                return
            payload = {"type": "send.progress", "progress": float(progress)}
            if message is not None:
                payload["message"] = message
            group = f'detection_progress_{self.record_id}_{self.divide_time}_{self.version}'
            # Only log significant progress updates to avoid cluttering logs
            #logger.info(f"[WebSocket] Progress update {progress:.1f}% to {group}")
            # poke_detection_progress(self.record_id, self.divide_time, self.version, progress)
            async_to_sync(channel_layer.group_send)(group, payload)
        except Exception as e:
            # Log WebSocket errors to help with debugging
            logger.error(f"[WebSocket] Error sending progress: {e}")
            # Keep inference resilient; don't raise on websocket issues.
