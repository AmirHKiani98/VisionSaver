from typing import List, Dict, Any
import numpy as np

from ai.detection_algorithms.abstract import DetectionAlgorithmAbstract

# Deep SORT (parent side)
from ai.detection_algorithms.v1.deepsort.nn_matching import NearestNeighborDistanceMetric
from ai.detection_algorithms.v1.deepsort.tracker import Tracker
from ai.detection_algorithms.v1.deepsort.detection import Detection

class Model(DetectionAlgorithmAbstract):
    """
    Worker: YOLO batched inference → raw dets.
    Parent: Deep SORT tracking on ordered dets → rows for CSV/DF.
    """

    # ---------- parent init ----------
    def __init__(self, record_id: int, divide_time: float,
                 max_age: int = 30, min_hits: int = 3, n_init: int = 3,
                 max_cosine_distance: float = 0.6, nn_budget: int = 150):
        super().__init__(record_id, divide_time, version="v1")

        metric = NearestNeighborDistanceMetric(
            "cosine", matching_threshold=max_cosine_distance, budget=nn_budget
        )
        self.tracker = Tracker(metric, max_age=max_age, n_init=n_init)
        self.min_hits = min_hits

        # COCO vehicle-ish classes
        self.objects_of_interest = {2, 3, 5, 7}

        # Worker-side params
        self._model_path = "yolov8m.pt"
        self._conf = 0.25
        self._detector_model = None  # worker only

    # ---------- worker config ----------
    def worker_init(self, **kwargs):
        # Ensure all required attributes are set, since __init__ is not called in worker
        if not hasattr(self, "_model_path"):
            self._model_path = "yolov8m.pt"
        if not hasattr(self, "_conf"):
            self._conf = 0.25
        if not hasattr(self, "objects_of_interest"):
            self.objects_of_interest = {2, 3, 5, 7}
        self._model_path = kwargs.get("model_path", self._model_path)
        self._conf = float(kwargs.get("conf", self._conf))
        if "objects_of_interest" in kwargs:
            self.objects_of_interest = set(kwargs["objects_of_interest"])

    # ---------- worker: load model ----------
    def build_detector(self):
        from ultralytics import YOLO
        import torch
        self._detector_model = YOLO(self._model_path)
        if torch.cuda.is_available():
            self._detector_model.to("cuda")

    # ---------- worker: batched inference ----------
    def detect_batch(self, frames: List[np.ndarray]) -> List[List[Dict[str, Any]]]:
        if not self._detector_model:
            raise RuntimeError("Detector model not built in worker")
        results = self._detector_model(frames, conf=self._conf, verbose=False)

        all_out: List[List[Dict[str, Any]]] = []
        for r in results:
            dets: List[Dict[str, Any]] = []
            if hasattr(r, "boxes") and r.boxes is not None and len(r.boxes) > 0:
                xyxy = r.boxes.xyxy
                cls = r.boxes.cls
                conf = r.boxes.conf
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
            all_out.append(dets)
        return all_out

    # ---------- parent: tracking ----------
    def on_frame_detections(self, fid: int, detections_for_frame: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        # NOTE: replace random features with a real ReID for stable IDs.
        ds_dets = []
        for d in detections_for_frame:
            x1, y1, x2, y2 = d["x1"], d["y1"], d["x2"], d["y2"]
            w = x2 - x1
            h = y2 - y1
            tlwh = [x1, y1, w, h]
            feature = np.random.rand(128).astype(np.float32)  # placeholder
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
            })
        return rows
