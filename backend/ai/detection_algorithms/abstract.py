import os
import cv2
import pandas as pd
import numpy as np
import importlib
import math
from abc import abstractmethod
from typing import Optional, List, Dict, Any, Tuple
from multiprocessing import get_context, Queue
from threading import Thread
from django.conf import settings
from channels.layers import get_channel_layer
from multiprocessing import cpu_count
from ai.utils import poke_detection_progress

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

    def _norm_divide_time(self) -> str:
        # canonical, drops trailing zeros; adjust precision as you like
        return f"{self.divide_time:.6g}"

    def _ws_group_name_counter(self) -> str:
        # Matches CounterProgressConsumer: f"detection_progress_{record_id}_{divide_time}"
        return f"detection_progress_{self.record_id}_{self._norm_divide_time()}_{self.version}"

    def _send_ws_progress(self, group: str, progress: float, message: str | None = None) -> None:
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
            # Only log significant progress updates to avoid cluttering logs
            #logger.info(f"[WebSocket] Progress update {progress:.1f}% to {group}")
            poke_detection_progress(self.record_id, self.divide_time, self.version, progress)
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

    # ---------------- Worker hooks (to implement in subclass) ----------------
    def worker_init(self, **kwargs):
        """Optional: set detector params in worker without calling __init__."""
        pass

    @abstractmethod
    def build_detector(self):
        """Load heavy model/resources. Runs INSIDE the worker process."""
        raise NotImplementedError

    @abstractmethod
    def detect_batch(self, frames: List[np.ndarray]) -> List[List[Dict[str, Any]]]:
        """
        frames: list[np.ndarray BGR]
        returns: list (len == len(frames)); each element is a list[dict] for that frame.
        """
        raise NotImplementedError

    # ---------------- Parent hook (tracking etc.) ----------------
    def on_frame_detections(self, fid: int, detections_for_frame: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Default pass-through; override in subclass to run tracking in parent."""
        return detections_for_frame

    # ---------------- Worker loop ----------------
    @staticmethod
    def _worker_loop(cls_path: str, init_kwargs: Dict[str, Any], in_q: Queue, out_q: Queue, batch_size: int):
        import traceback
        mod_name, _, cls_name = cls_path.rpartition(".")
        #logger.info(f"[Worker] Importing {mod_name}.{cls_name}")
        try:
            mod = importlib.import_module(mod_name)
            SubCls = getattr(mod, cls_name)
            obj = SubCls.__new__(SubCls)
            if hasattr(obj, "worker_init"):
                #logger.info(f"[Worker] Initializing {cls_path} with {init_kwargs}")
                obj.worker_init(**(init_kwargs or {}))
            obj.build_detector()
        except Exception as e:
            logger.error(f"[Worker] Initialization failed: {e}\n{traceback.format_exc()}")
            out_q.put(None)
            return

        pending: List[Tuple[int, np.ndarray]] = []
        alive = True
        #logger.info("[Worker] Entering main loop")
        while alive:
            try:
                while len(pending) < batch_size:
                    item = in_q.get(timeout=0.03)
                    if item is None:
                        alive = False
                        #logger.info("[Worker] Received EOS sentinel, shutting down.")
                        break
                    pending.append(item)
            except Exception as e:
                # Only log real exceptions, not queue.Empty timeouts
                if not (hasattr(e, '__class__') and e.__class__.__name__ == 'Empty'):
                    logger.error(f"[Worker] Exception while getting from in_q: {e}")
                    

            if not pending:
                continue

            fids, frames = zip(*pending)
            pending.clear()

            try:
                #logger.debug(f"[Worker] Running detect_batch on {len(frames)} frames")
                results = obj.detect_batch(list(frames))
                #logger.debug(f"[Worker] detect_batch returned {len(results)} results")
                if not isinstance(results, list) or len(results) != len(fids):
                    raise RuntimeError("detect_batch must return a list with one element per input frame")
            except Exception as e:
                logger.error(f"[Worker] Exception in detect_batch: {e}\n{traceback.format_exc()}")
                for fid in fids:
                    out_q.put((fid, {"__error__": str(e)}))
                continue

            for fid, det_list in zip(fids, results):
                out_q.put((fid, det_list))

        out_q.put(None)  # sentinel to parent
        #logger.info("[Worker] Exiting.")

    @staticmethod
    def _capture_thread(cap: cv2.VideoCapture, frame_interval: int, out_q: Queue, stop_flag: dict):
        fid = 0
        grabbed = True
        #logger.info("[Capture] Starting capture thread.")
        while grabbed and not stop_flag.get("stop", False):
            grabbed, frame = cap.read()
            if not grabbed:
                #logger.info(f"[Capture] Frame {fid} not grabbed, ending capture.")
                break
            try:
                out_q.put((fid, np.ascontiguousarray(frame)))
                # #logger.debug(f"[Capture] Put frame {fid} in queue.")
            except Exception as e:
                logger.error(f"[Capture] Failed to put frame {fid} in queue: {e}")
            fid += 1
            for _ in range(max(0, frame_interval - 1)):
                if not cap.grab():
                    grabbed = False
                    #logger.info(f"[Capture] Failed to grab frame for skipping at {fid}.")
                    break
        stop_flag["stop"] = True
        cap.release()
        try:
            out_q.put(None)  # EOS sentinel to worker
            #logger.info("[Capture] Sent EOS sentinel to worker.")
        except Exception as e:
            logger.error(f"[Capture] Failed to send EOS sentinel: {e}")

    @final_method
    def run(self,
            cls_path: str,
            batch_size: int = 8,
            queue_size: int = 32,
            detector_init: Optional[Dict[str, Any]] = None,
            num_workers: Optional[int] = None) -> Tuple[pd.DataFrame, str]:
        #logger.info("[Parent] Starting detection run.")
        if not self.video.isOpened():
            logger.error("[Parent] Video not opened!")
            raise RuntimeError(f"Failed to open video for record ID {self.record_id}")

        detector_init = detector_init or {}
        frame_interval = max(1, int(round(self.divide_time * self.fps)))
        sample_stride = frame_interval
        total_samples = (
            math.ceil(self._frame_count / sample_stride) if self._frame_count > 0 else 0
        )
        group = self._ws_group_name_counter()
        # Log initial WebSocket communication
        #logger.info(f"[WebSocket] Starting detection for group: {group}")
        self._send_ws_progress(group, 0.0)
        ctx = get_context("spawn")
        frame_q: Queue = ctx.Queue(maxsize=8)
        result_q: Queue = ctx.Queue(maxsize=8)

        stop_flag = {"stop": False}
        t = Thread(target=self._capture_thread, args=(self.video, frame_interval, frame_q, stop_flag), daemon=True)
        t.start()
        #logger.info("[Parent] Capture thread started.")

        if num_workers is None:
            try:
                import torch
                if torch.cuda.is_available():
                    logger.info("CUDA is available. Setting num_workers to min(6, cpu_count())")
                    num_workers = int(cpu_count()/4)
                else:
                    from multiprocessing import cpu_count
                    num_workers = min(6, cpu_count())
            except Exception:
                from multiprocessing import cpu_count
                num_workers = min(6, cpu_count())

        workers = []
        for i in range(num_workers):
            p = ctx.Process(target=self._worker_loop,
                            args=(cls_path, detector_init, frame_q, result_q, batch_size),
                            daemon=True)
            p.start()
            #logger.info(f"[Parent] Worker process {i} started with PID {p.pid}")
            workers.append(p)

        next_fid = 0
        stash: Dict[int, Any] = {}
        buffer_rows: List[Dict[str, Any]] = []
        active_workers = num_workers

        try:
            while True:
                item = result_q.get()
                # #logger.debug(f"[Parent] Got item from result_q: {item}")
                if item is None:
                    active_workers -= 1
                    #logger.info(f"[Parent] Worker finished, {active_workers} remaining.")
                    if active_workers == 1:
                        break
                    continue
                fid, dets_for_frame = item
                stash[fid] = dets_for_frame

                while next_fid in stash:
                    det_list = stash.pop(next_fid)
                    if isinstance(det_list, dict) and "__error__" in det_list:
                        logger.error(f"[Parent] Detection failed at frame {next_fid}: {det_list['__error__']}")
                        raise RuntimeError(f"Detection failed at frame {next_fid}: {det_list['__error__']}")
                    if isinstance(det_list, dict):
                        det_list_for_frame = [det_list]
                    else:
                        det_list_for_frame = det_list
                    rows = self.on_frame_detections(next_fid, det_list_for_frame)
                    #logger.debug(f"[Parent] on_frame_detections for frame {next_fid} returned {len(rows) if rows else 0} rows.")
                    if rows:
                        if isinstance(rows, list):
                            buffer_rows.extend(rows)
                        else:
                            buffer_rows.append(rows)
                    next_fid += 1
                    if total_samples > 0:
                        progress = min(100.0, (next_fid / total_samples) * 100.0)
                    else:
                        progress = min(99.0, next_fid % 100)
                    if progress - self._last_progress_sent >= 5.0 or progress >= 100.0:
                        self._send_ws_progress(group, progress)
                        self._last_progress_sent = progress
        finally:
            #logger.info("[Parent] Stopping workers and writing results...")
            if buffer_rows:
                self.df = pd.concat([self.df, pd.DataFrame(buffer_rows)], ignore_index=True)
            #logger.info(f"[Parent] Total frames processed: {next_fid}, total detections: {len(self.df)}")
            try:
                frame_q.put_nowait(None)
            except Exception:
                logger.warning("[Parent] Failed to send EOS to frame queue, it may be full.")
            stop_flag["stop"] = True
            t.join()
            for p in workers:
                p.join(timeout=5)
                if p.is_alive():
                    logger.warning(f"[Parent] Worker {p.pid} still alive after join, terminating.")
                    p.terminate()

        out_file = os.path.join(
            settings.MEDIA_ROOT,
            f"{self.record_id}_detections_{self.version}_{self.divide_time}.csv"
        )
        #logger.info(f"[Parent] Writing detections to {out_file}")
        if not self.df.empty:
            pass
        else:
            logger.warning("[Parent] DataFrame is empty, no detections written.")
        self._send_ws_progress(group, 100.0, "Detection complete")
        self.df.to_csv(out_file, index=False)
        #logger.info("[Parent] Detection run complete.")
        return self.df, out_file
