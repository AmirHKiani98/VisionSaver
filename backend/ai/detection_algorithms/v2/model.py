from ultralytics import YOLO
from ai.detection_algorithms.v2.deepsort.tracker import Tracker
from ai.detection_algorithms.v2.deepsort.detection import Detection
from ai.detection_algorithms.v2.deepsort.nn_matching import NearestNeighborDistanceMetric
import numpy as np
import sys
import os
import torch
GPU_AVAILABLE = torch.cuda.is_available()

# Suppress YOLO output
class SuppressOutput:
    def __enter__(self):
        self.original_stdout = sys.stdout
        self.original_stderr = sys.stderr
        sys.stdout = open(os.devnull, 'w')
        sys.stderr = open(os.devnull, 'w')
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        sys.stdout.close()
        sys.stdout = self.original_stdout
        sys.stderr.close()
        sys.stderr = self.original_stderr

# Load model with suppressed output
with SuppressOutput():
    model = YOLO("yolov8n.pt")
    if GPU_AVAILABLE:
        model.to('cuda')
        print("Using GPU for YOLOv8 inference.")
    
# Create a unit dummy feature vector instead of all zeros
# This avoids division by zero in cosine distance calculation
FEATURE_DIM = 128
dummy_feature = np.ones(FEATURE_DIM, dtype=np.float32)  # Using ones instead of zeros
dummy_feature = dummy_feature / np.linalg.norm(dummy_feature)  # Normalize to unit vector

# Use IoU-based tracking instead of appearance features
class IoUOnlyMetric(object):
    """
    A metric that forces DeepSORT to use IoU matching only by returning max distance for appearance.
    """
    
    def __init__(self, matching_threshold=0.5):
        self.matching_threshold = matching_threshold
        self.samples = {}
    
    def partial_fit(self, features, targets, active_targets=None):
        """Update the distance metric with new data (no-op for IoU only)."""
        pass
        
    def distance(self, features, targets):
        """Return a cost matrix that ensures appearance features aren't used."""
        cost_matrix = np.ones((len(targets), len(features))) * 0.2  # Cost above threshold
        return cost_matrix

# Use IoU-only metric for tracking
metric = NearestNeighborDistanceMetric("cosine", 0.45, budget=100)
tracker = Tracker(metric, max_iou_distance=0.9, max_age=10, n_init=3)

# Global map from DeepSORT's internal IDs -> your global 1..m IDs
global_id_map = {}          # {track.track_id: global_id}
next_global_id = 1
VEHICLE_CLASS_IDS = {2, 3, 5, 7}
CONFIDENCE_THRESHOLD = 0.5
def detect(frame, device=None):
    global next_global_id

    # YOLO detections with suppressed output
    with SuppressOutput():
        if GPU_AVAILABLE:
            r = model(frame, verbose=False, device=0)[0]
        else:
            r = model(frame, verbose=False)[0]
        
    detections = []
    if r.boxes is not None and len(r.boxes) > 0:
        xyxy = r.boxes.xyxy.cpu().numpy()
        conf = r.boxes.conf.cpu().numpy()
        cls = r.boxes.cls.cpu().numpy().astype(int) if r.boxes.cls is not None else np.zeros(len(conf), dtype=int)
        for (x1,y1,x2,y2), score, cls_id in zip(xyxy, conf, cls):
            if cls_id not in VEHICLE_CLASS_IDS:
                continue
            # if score < CONFIDENCE_THRESHOLD:
            #     continue
            tlwh = (x1, y1, x2 - x1, y2 - y1)
            # Use unit vector as dummy feature
            detections.append(Detection(tlwh=tlwh, confidence=score, feature=dummy_feature))
            # Store class ID in detection object for later use
            detections[-1].cls_id = int(cls_id)

    # Predict/update on the SAME tracker every frame
    tracker.predict()
    tracker.update(detections)

    # Build outputs, assigning stable global IDs
    tracked_objects = []
    for t in tracker.tracks:
        if not t.is_confirmed() or t.time_since_update > 1:
            continue
        if t.track_id not in global_id_map:
            global_id_map[t.track_id] = next_global_id
            next_global_id += 1
        gid = global_id_map[t.track_id]
        x1, y1, x2, y2 = t.to_tlbr().astype(float)  # tlbr from Track
        
        # Extract class ID if available (from most recent detection)
        cls_id = t.cls_id

        tracked_objects.append({
            "track_id": gid,       # 1..m across all frames
            "x1": float(x1), 
            "y1": float(y1), 
            "x2": float(x2), 
            "y2": float(y2),
            "cls_id": int(cls_id),
            "confidence": t.confidence
        })
    return tracked_objects