from typing import List, Dict, Any
import numpy as np
from ultralytics import YOLO
from ai.detection_algorithms.abstract import DetectionAlgorithmAbstract

# Deep SORT (parent side)
from ai.detection_algorithms.v1.deepsort.nn_matching import NearestNeighborDistanceMetric
from ai.detection_algorithms.v1.deepsort.tracker import Tracker
from ai.detection_algorithms.v1.deepsort.detection import Detection


def _yolo_factory(model_path: str, objects_of_interest: set[int]):
    """
    This function is picklable and runs in the PARENT. In each WORKER
    it will be executed by _init_worker(), instantiate YOLO once, and
    return the actual detect(frame, t) function that closes over the model.
    """
    def factory():
        model = YOLO(model_path)  # heavy init INSIDE worker
        classes = set(objects_of_interest)

        def detect(frame, t):
            # Use predict() or track() carefully; here use predict() to keep stateless in worker.
            res = model.predict(frame, verbose=False)[0]
            dets = []
            if res.boxes is not None and len(res.boxes) > 0:
                xywh = res.boxes.xywh.cpu().numpy()
                cls  = res.boxes.cls.cpu().numpy().astype(int)
                conf = res.boxes.conf.cpu().numpy()
                for (x, y, w, h), c, s in zip(xywh, cls, conf):
                    if c in classes:
                        dets.append({
                            "x1": float(x - w/2),
                            "y1": float(y - h/2),
                            "x2": float(x + w/2),
                            "y2": float(y + h/2),
                            "track_id": None,   # tracking is parent-side
                            "cls_id": int(c),
                            "confidence": float(s),
                        })
            return dets
        return detect
    return factory

class Model(DetectionAlgorithmAbstract):
    def __init__(self, record_id: int, divide_time: float,
                 max_age: int = 30, min_hits: int = 3, n_init: int = 3,
                 max_cosine_distance: float = 0.6, nn_budget: int = 150):
        super().__init__(record_id, divide_time, version="v1")

        from ai.detection_algorithms.v1.deepsort.nn_matching import NearestNeighborDistanceMetric
        from ai.detection_algorithms.v1.deepsort.tracker import Tracker

        metric = NearestNeighborDistanceMetric("cosine",
                                               matching_threshold=max_cosine_distance,
                                               budget=nn_budget)
        self.tracker = Tracker(metric, max_age=max_age, n_init=n_init)
        self.min_hits = min_hits

        # Parent-side config only (picklable)
        self.objects_of_interest = {2, 3, 5, 7}
        self._model_path = "yolo11n.pt"

    def get_worker_init_args(self) -> tuple[str, tuple[int, ...]]:
        # Return ONLY simple data; no self-bound callables.
        return self._model_path, tuple(sorted(self.objects_of_interest))
