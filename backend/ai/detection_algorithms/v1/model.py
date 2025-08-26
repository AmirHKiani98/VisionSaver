from typing import List, Dict, Any
import numpy as np
from ultralytics import YOLO
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
        self._model_path = "yolo11n.pt"
        self.model = YOLO(self._model_path)

    def detect(self, args) -> List[Dict[str, Any]]:
        """
        Perform detection on a single frame using YOLOv8 model.
        Returns a list of detections with bounding boxes, confidence scores, and class IDs.
        """
        if len(args) != 2:
            raise ValueError("Expected args to be a tuple of (frame, time)")
        frame, time = args
        if frame is None or time is None:
            raise ValueError("Frame and time must not be None")
        if not isinstance(frame, np.ndarray):
            raise ValueError("Frame must be a numpy ndarray")
        if not isinstance(time, (int, float)):
            raise ValueError("Time must be an int or float")
        
        result = self.model.track(frame, persist=True)[0]
        detections = []
        if result.boxes and result.boxes.is_track:
            boxes = result.boxes.xywh.cpu()
            track_ids = result.boxes.id.int().cpu().tolist()
            detections = []
            
            for box, track_id in zip(boxes, track_ids):
                # Check if the class id is in class if of interests
                cls_id = int(box.cls[0])
                if cls_id in self.objects_of_interest:
                    x, y, w, h = box.tolist()
                    detections.append({
                        'x1': x,
                        'y1': y,
                        'x2': x + w,
                    'y2': y + h,
                    "track_id": track_id,
                    "cls_id": cls_id,
                    'confidence': box.conf[0],
                    "time": time
                })
        return detections
