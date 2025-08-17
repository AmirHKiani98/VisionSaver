from ai.detection_algorithms.abstract import DetectionAlgorithmAbstract

from ai.detection_algorithms.v1.deepsort.nn_matching import NearestNeighborDistanceMetric
from ai.detection_algorithms.v1.deepsort.tracker import Tracker
from ai.detection_algorithms.v1.deepsort.detection import Detection

from ultralytics import YOLO
import numpy as np

class Model(DetectionAlgorithmAbstract):
    def __init__(self, record_id, divide_time):
        super().__init__(record_id, divide_time)
        metric = NearestNeighborDistanceMetric("cosine", matching_threshold=0.4, budget=100)
        self.tracker = Tracker(metric)
        self.tracker_config = {
            'max_age': 30,
            'min_hits': 3,
            'n_init': 3,
            'max_cosine_distance': 0.6,
            'nn_budget': 150
        }
        self.divide_time_float = float(self.divide_time)
        self.model = YOLO("yolov8m.pt") 
        
    def detect(self, image):
        """
        Detect and track vehicles in the frame.
        Returns list of tracked objects with bounding boxes and track IDs.
        """
        detections = []
        results = self.model(image)[0]
        objects_of_interest = [2, 3, 5, 7]
        objects = []
        if hasattr(results, 'boxes') and results.boxes is not None:
            for box, cls, conf in zip(results.boxes.xyxy, results.boxes.cls, results.boxes.conf):
                if int(cls) in objects_of_interest:
                    x1, y1, x2, y2 = map(float, box)
                    # AVG RGB
                    objects.append({
                        'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2,
                        'confidence': float(conf),
                        'class_id': int(cls),
                    })
                    # Convert from (x1, y1, x2, y2) to (x, y, w, h) format
                    w = x2 - x1
                    h = y2 - y1
                    tlwh = [x1, y1, w, h]
                    # Create a simple feature vector (placeholder)
                    feature = np.random.rand(128).astype(np.float32)
                    detections.append(Detection(tlwh, float(conf), feature))
        self.tracker.predict()
        self.tracker.update(detections)

        output = []
        for track in self.tracker.tracks:
            if not track.is_confirmed() or track.time_since_update > 1:
                continue
            tlwh = track.to_tlwh()
            x1, y1, w, h = tlwh
            x2, y2 = x1 + w, y1 + h
            output.append({
                'track_id': track.track_id,
                'x1': x1,
                'y1': y1,
                'x2': x2,
                'y2': y2,
            })
        return output