import os
import cv2
import pandas as pd
import numpy as np
from abc import abstractmethod
from typing import Optional, List, Dict, Any, Tuple
from django.conf import settings
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from multiprocessing import cpu_count, Pool

logger = settings.APP_LOGGER

def final_method(func):
    func.__isfinal__ = True
    return func

class FinalMeta(type):
    def __new__(cls, name, bases, attrs):
        for base in bases:
            for attr_name, attr_value in base.__dict__.items():
                if getattr(attr_value, "__isfinal__", False) and attr_name in attrs:
                    raise TypeError(f"Cannot override final method '{attr_name}' in class '{name}'")
        return super().__new__(cls, name, bases, attrs)

class DetectionAlgorithmAbstract(metaclass=FinalMeta):
    """
    Subclass must implement (worker side):
      - worker_init(self, **kwargs)      [optional, NO ORM/VideoCapture]
      - build_detector(self)             [required]
      - detect_batch(self, frames)       [required, returns one list-of-dicts per input frame]

    Parent side (optional):
      - on_frame_detections(self, fid, detections_for_frame) -> list[dict]  (e.g., tracking)
    """

    def __init__(self, record_id: int, divide_time: float, version: str):
        #logger.info(f"Initializing DetectionAlgorithmAbstract for record {record_id}, version {version}, divide_time {divide_time}")
        self.record_id = record_id
        self.divide_time = float(divide_time)
        self.version = version
        self.video, self.duration, self.width, self.height, self.fps = self._load_video()
        self._frame_count = int(self.video.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        self._last_progress_sent = -1.0
        self.df = pd.DataFrame()


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

    # ---------------- Parent: video open ----------------
    def _load_video(self) -> Tuple[cv2.VideoCapture, int, int, int, float]:
        base = os.path.join(settings.MEDIA_ROOT, str(self.record_id))
        video_path = None
        for ext in (".mp4", ".mkv", ".avi"):
            p = base + ext
            if os.path.exists(p):
                video_path = p
                break
        if video_path is None:
            raise FileNotFoundError(f"Video file for record {self.record_id} not found in MEDIA_ROOT")

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise RuntimeError(f"Failed to open: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS)
        fps = float(fps) if fps and fps > 0 else 30.0
        frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        duration = int(round(frames / fps)) if frames and fps else 0
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        return cap, duration, width, height, fps

    def _update_detection_progress(self, progress: float):
        self._send_ws_progress(progress)

    @abstractmethod
    def detect(self, frame: np.ndarray, time: float) -> List[Dict[str, Any]]:
        pass

    @final_method
    def run(self,
            num_workers: Optional[int] = None,
            maximum_batch_size=500) -> pd.DataFrame:
        """
        Run the detection algorithm on the video frames.
        """
        if num_workers is None:
            num_workers = int(cpu_count()/3)
        args = []

        def detect_wrapper(arg):
            frame, time = arg
            return self.detect(frame, time)

        while True:
            ret, frame = self.video.read()
            if not ret:
                break
            # get the time into the video in seconds
            time = self.video.get(cv2.CAP_PROP_POS_MSEC) / 1000.0
            args.append((frame, time))
            if len(args) == maximum_batch_size:
                with Pool(processes=num_workers) as pool:
                    for i, detections in enumerate(pool.imap(detect_wrapper, args)):
                        time = args[i][1]
                        self._update_detection_progress((time / self.duration) * 100.0)
                        self.df = pd.concat([self.df, pd.DataFrame(detections)], ignore_index=True)
        
                args = []
        if len(args) > 0:
            with Pool(processes=num_workers) as pool:
                for i, detections in enumerate(pool.imap(detect_wrapper, args)):
                    time = args[i][1]
                    self._update_detection_progress((time / self.duration) * 100.0)
                    self.df = pd.concat([self.df, pd.DataFrame(detections)], ignore_index=True)
        return self.df
