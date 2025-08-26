import os
import cv2
import pandas as pd
import numpy as np
from abc import abstractmethod
from django.conf import settings
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from multiprocessing import cpu_count, Pool
from functools import partial
from multiprocessing import Pool, cpu_count
from typing import Optional, List, Dict, Any, Tuple
import numpy as np

# Worker-global state (lives in each child process)
_WORKER_MODEL = None
_WORKER_CLASSES = None

logger = settings.APP_LOGGER
_DETECT = None  # worker-global callable: (frame, t) -> list[dict]
def _init_worker(model_path: str, classes: tuple[int, ...]):
    """
    Runs once per worker.
    Builds YOLO (or any heavy model) inside the worker process and caches config.
    """
    from ultralytics import YOLO  # import here to avoid parent pickling issues
    global _WORKER_MODEL, _WORKER_CLASSES
    _WORKER_MODEL = YOLO(model_path)
    _WORKER_CLASSES = set(classes)

def _worker(frame: np.ndarray, t: float):
    """
    Runs per task inside workers. Uses only worker-global state.
    Returns (detections, time)
    """
    # Predict statelessly in workers; track in parent later.
    res = _WORKER_MODEL.predict(frame, verbose=False)[0]
    dets: List[Dict[str, Any]] = []
    if res.boxes is not None and len(res.boxes) > 0:
        xywh = res.boxes.xywh.cpu().numpy()
        cls  = res.boxes.cls.cpu().numpy().astype(int)
        conf = res.boxes.conf.cpu().numpy()
        track_id = res.boxes.id.cpu().numpy().astype(int)
        for (x, y, w, h), c, s in zip(xywh, cls, conf):
            if c in _WORKER_CLASSES:
                dets.append({
                    "x1": float(x - w/2),
                    "y1": float(y - h/2),
                    "x2": float(x + w/2),
                    "y2": float(y + h/2),
                    "track_id": ,         # parent will assign
                    "cls_id": int(c),
                    "confidence": float(s),
                })
    return dets, t

def final_method(func):
    func.__isfinal__ = True
    return func

def worker_detect(detect_fun, frame, time):
    """
    Worker function to call the detect method.
    """
    return detect_fun((frame, time)), time

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

    @abstractmethod
    def get_worker_init_args(self) -> tuple[str, tuple[int, ...]]:
        """
        Must return (model_path: str, classes: tuple[int, ...]) or whatever
        your _init_worker expects. Must be PICKLABLE simple data.
        """
        raise NotImplementedError

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
            maximum_batch_size=1500) -> pd.DataFrame:
        """
        Run the detection algorithm on the video frames with multiprocessing.
        """
        if num_workers is None:
            num_workers = max(1, int(cpu_count()/3))
        
        # Extract frames and times first
        frames_and_times = []

        while True:
            ret, frame = self.video.read()
            if not ret:
                break
            
            # Get the time into the video in seconds
            time = self.video.get(cv2.CAP_PROP_POS_MSEC) / 1000.0
            frames_and_times.append((frame, time))
                            
            if len(frames_and_times) == maximum_batch_size:
                batch_results = self._process_batch(num_workers, frames_and_times, time/self.duration*100)
                frames_and_times = []
        
        if len(frames_and_times) > 0:
            batch_results = self._process_batch(num_workers, frames_and_times, 100.0)
        
        # Final progress update
        return self.df
    
    def _process_batch(self, num_workers, args, progress):
        model_path, classes = self.get_worker_init_args()
        with Pool(processes=num_workers,
                initializer=_init_worker,
                initargs=(model_path, classes)) as pool:
            results = pool.starmap(_worker, args)   # args = [(frame, t), ...]
        logger.info(f"Progress: {progress:.2f}%")
        self._update_detection_progress(progress)
        for detections, t in results:
            if detections:
                for d in detections:
                    d['time'] = t
                self.df = pd.concat([self.df, pd.DataFrame(detections)], ignore_index=True)
        return results
