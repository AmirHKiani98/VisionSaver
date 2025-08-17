import os
import cv2
import pandas as pd
import numpy as np
import importlib
from abc import abstractmethod
from typing import Optional, List, Dict, Any, Tuple
from multiprocessing import get_context, Queue
from threading import Thread
from django.conf import settings

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
    Implement in subclass:
      - worker_init(self, **kwargs)      # (optional) configure detector in worker (NO ORM/VideoCapture)
      - build_detector(self)             # load heavy model (runs INSIDE worker)
      - detect_batch(self, frames)       # runs INSIDE worker; returns one result (list[dict]) per input frame

    Optionally override in parent:
      - on_frame_detections(self, fid, detections_for_frame) -> list[dict]
        default: pass-through; override to run tracker in parent and return rows for DataFrame.
    """

    def __init__(self, record_id: int, divide_time: float):
        self.record_id = record_id
        self.divide_time = float(divide_time)
        self.video, self.duration, self.width, self.height, self.fps = self.load_video()
        self.df = pd.DataFrame()

    def load_video(self) -> Tuple[cv2.VideoCapture, int, int, int, float]:
        # Resolve video path without touching ORM in worker; __init__ only runs in parent.
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

    # --------- Subclass hooks (worker side) ---------
    def worker_init(self, **kwargs):
        """Optional: set detector params in worker without calling __init__."""
        pass

    @abstractmethod
    def build_detector(self):
        """Initialize heavy models/resources. Runs INSIDE worker process."""
        raise NotImplementedError

    @abstractmethod
    def detect_batch(self, frames: List[np.ndarray]) -> List[List[Dict[str, Any]]]:
        """
        frames: list[np.ndarray (H,W,3) BGR]
        returns: list (len == len(frames)), where each element is a list[dict] for that frame.
        """
        raise NotImplementedError

    # --------- Subclass hook (parent side) ---------
    def on_frame_detections(self, fid: int, detections_for_frame: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Parent-side hook. Override to run tracking and return rows for df.
        Default: pass-through (no tracking).
        """
        return detections_for_frame

    # --------- Worker process loop ---------
    @staticmethod
    def _worker_loop(cls_path: str, init_kwargs: Dict[str, Any], in_q: Queue, out_q: Queue, batch_size: int):
        """
        cls_path: 'package.module.ClassName' of the subclass
        init_kwargs: picklable kwargs to configure detector in worker (NO ORM/VideoCapture)
        """
        mod_name, _, cls_name = cls_path.rpartition(".")
        mod = importlib.import_module(mod_name)
        SubCls = getattr(mod, cls_name)

        # Bypass __init__ (avoids ORM/VideoCapture). Configure via worker_init().
        obj = SubCls.__new__(SubCls)
        if hasattr(obj, "worker_init"):
            obj.worker_init(**(init_kwargs or {}))
        obj.build_detector()

        pending: List[Tuple[int, np.ndarray]] = []
        alive = True
        while alive:
            # Fill batch with short timeout to reduce latency
            try:
                while len(pending) < batch_size:
                    item = in_q.get(timeout=0.03)
                    if item is None:
                        alive = False
                        break
                    pending.append(item)  # (fid, frame)
            except Exception:
                pass

            if not pending:
                continue

            fids, frames = zip(*pending)
            pending.clear()

            try:
                results = obj.detect_batch(list(frames))
                if not isinstance(results, list) or len(results) != len(fids):
                    raise RuntimeError("detect_batch must return a list with one element per input frame")
            except Exception as e:
                # send per-frame error so parent can fail fast
                for fid in fids:
                    out_q.put((fid, {"__error__": str(e)}))
                continue

            for fid, det_list in zip(fids, results):
                out_q.put((fid, det_list))

        out_q.put(None)  # sentinel to parent

    # --------- Capture thread ---------
    @staticmethod
    def _capture_thread(cap: cv2.VideoCapture, frame_interval: int, out_q: Queue, stop_flag: dict):
        fid = 0
        grabbed = True
        while grabbed and not stop_flag.get("stop", False):
            grabbed, frame = cap.read()
            if not grabbed:
                break
            out_q.put((fid, np.ascontiguousarray(frame)))
            fid += 1
            # Skip frames according to divide_time
            for _ in range(max(0, frame_interval - 1)):
                if not cap.grab():
                    grabbed = False
                    break
        stop_flag["stop"] = True
        cap.release()
        # Signal end-of-stream to worker
        try:
            out_q.put(None)
        except Exception:
            pass

    @final_method
    def run(self,
            cls_path: str,
            batch_size: int = 8,
            queue_size: int = 32,
            detector_init: Optional[Dict[str, Any]] = None) -> pd.DataFrame:
        """
        Start capture thread + one detector worker process.
        - cls_path: dotted import path to *this* subclass (so the worker can import it)
        - batch_size: frames per detect call in worker
        - detector_init: kwargs for worker_init (e.g., model_path='yolov8m.pt', conf=0.25)
        """
        if not self.video.isOpened():
            raise RuntimeError(f"Failed to open video for record ID {self.record_id}")

        detector_init = detector_init or {}
        frame_interval = max(1, int(round(self.divide_time * self.fps)))

        ctx = get_context("spawn")  # safest for CUDA & Django
        frame_q: Queue = ctx.Queue(maxsize=queue_size)
        result_q: Queue = ctx.Queue(maxsize=queue_size)

        stop_flag = {"stop": False}
        t = Thread(target=self._capture_thread, args=(self.video, frame_interval, frame_q, stop_flag), daemon=True)
        t.start()

        p = ctx.Process(target=self._worker_loop,
                        args=(cls_path, detector_init, frame_q, result_q, batch_size),
                        daemon=True)
        p.start()

        next_fid = 0
        stash: Dict[int, Any] = {}
        buffer_rows: List[Dict[str, Any]] = []

        try:
            while True:
                item = result_q.get()
                if item is None:
                    break
                fid, dets_for_frame = item
                stash[fid] = dets_for_frame

                # Drain in-order frames
                while next_fid in stash:
                    det_list = stash.pop(next_fid)
                    if isinstance(det_list, dict) and "__error__" in det_list:
                        raise RuntimeError(f"Detection failed at frame {next_fid}: {det_list['__error__']}")
                    # Parent-side hook (e.g., tracking)
                    if isinstance(det_list, list):
                        rows = self.on_frame_detections(next_fid, det_list)
                        if rows:
                            if isinstance(rows, list):
                                buffer_rows.extend(rows)
                            else:
                                buffer_rows.append(rows)
                    next_fid += 1
        finally:
            # Flush buffered rows once
            if buffer_rows:
                self.df = pd.concat([self.df, pd.DataFrame(buffer_rows)], ignore_index=True)

            # Cleanup
            try:
                frame_q.put_nowait(None)
            except Exception:
                pass
            stop_flag["stop"] = True
            t.join()
            p.join(timeout=5)
            if p.is_alive():
                p.terminate()

        return self.df
