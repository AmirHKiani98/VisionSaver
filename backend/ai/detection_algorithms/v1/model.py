# ai/detection_algorithms/v1/model.py
from typing import List, Dict, Any
import numpy as np

from ai.detection_algorithms.abstract import DetectionAlgorithmAbstract

# Deep SORT pieces (parent side)
from ai.detection_algorithms.v1.deepsort.nn_matching import NearestNeighborDistanceMetric
from ai.detection_algorithms.v1.deepsort.tracker import Tracker
from ai.detection_algorithms.v1.deepsort.detection import Detection

class Model(DetectionAlgorithmAbstract):
    """
    - Worker: loads YOLO and returns raw detections per frame (no tracking).
    - Parent: runs Deep SORT on those detections in-order and returns track rows.
    """

    # ---------- parent init ----------
    def __init__(self, record_id: int, divide_time: float,
                 max_age: int = 30, min_hits: int = 3, n_init: int = 3,
                 max_cosine_distance: float = 0.6, nn_budget: int = 150):
        super().__init__(record_id, divide_time)

        # Deep SORT tracker in the parent
        metric = NearestNeighborDistanceMetric(
            "cosine", matching_threshold=max_cosine_distance, budget=nn_budget
        )
        self.tracker = Tracker(metric, max_age=max_age, n_init=n_init)
        self.min_hits = min_hits

        # Inference classes (COCO): car=2, motorcycle=3, bus=5, truck=7
        self.objects_of_interest = {2, 3, 5, 7}

        # Worker-side attributes (set in worker_init)
        self._model_path = "yolov8m.pt"
        self._conf = 0.25
        self._detector_model = None  # YOLO model (worker only)

    # ---------- worker configuration ----------
    def worker_init(self, **kwargs):
        # called in worker (NO ORM/VideoCapture)
        self._model_path = kwargs.get("model_path", self._model_path)
        self._conf = float(kwargs.get("conf", self._conf))
        self.objects_of_interest = set(kwargs.get("objects_of_interest", list(self.objects_of_interest)))

    # ---------- worker: build detector ----------
    def build_detector(self):
        from ultralytics import YOLO
        import torch
        self._detector_model = YOLO(self._model_path)
        if torch.cuda.is_available():
            self._detector_model.to("cuda")

    # ---------- worker: batched detection ----------
    def detect_batch(self, frames: List[np.ndarray]) -> List[List[Dict[str, Any]]]:
        """
        Returns: for each input frame, a list of dicts with:
        {x1,y1,x2,y2,confidence,class_id}
        """
        if not self._detector_model:
            raise RuntimeError("Detector model is not built")
        results = self._detector_model(frames, conf=self._conf, verbose=False)
        out: List[List[Dict[str, Any]]] = []

        for r in results:
            dets: List[Dict[str, Any]] = []
            if hasattr(r, "boxes") and r.boxes is not None and len(r.boxes) > 0:
                xyxy = r.boxes.xyxy
                cls = r.boxes.cls
                conf = r.boxes.conf
                # Move to CPU numpy (single transfer)
                xyxy = xyxy.detach().cpu().numpy()
                cls = cls.detach().cpu().numpy().astype(int)
                conf = conf.detach().cpu().numpy()
                for (x1, y1, x2, y2), k, c in zip(xyxy, cls, conf):
                    if k in self.objects_of_interest:
                        dets.append({
                            "x1": float(x1), "y1": float(y1),
                            "x2": float(x2), "y2": float(y2),
                            "confidence": float(c), "class_id": int(k),
                        })
            out.append(dets)
        return out

    # ---------- parent: tracking on ordered detections ----------
    def on_frame_detections(self, fid: int, detections_for_frame: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Convert raw detections to Deep SORT inputs, update tracker, return rows:
        {frame_id, track_id, x1, y1, x2, y2, conf, class_id}
        """
        # NOTE: Replace random features with a real ReID embedding for better ID stability.
        ds_dets = []
        for d in detections_for_frame:
            x1, y1, x2, y2 = d["x1"], d["y1"], d["x2"], d["y2"]
            w = x2 - x1
            h = y2 - y1
            tlwh = [x1, y1, w, h]
            feature = np.random.rand(128).astype(np.float32)  # TODO: ReID/appearance encoder
            ds_dets.append(Detection(tlwh, d["confidence"], feature))

        self.tracker.predict()
        self.tracker.update(ds_dets)

        rows: List[Dict[str, Any]] = []
        for track in self.tracker.tracks:
            if not track.is_confirmed() or track.time_since_update > 1:
                continue
            x, y, w, h = track.to_tlwh()
            rows.append({
                "frame_id": int(fid),
                "track_id": int(track.track_id),
                "x1": float(x),
                "y1": float(y),
                "x2": float(x + w),
                "y2": float(y + h),
                # Optional: attach last confidence/class if you kept them
            })
        return rows
