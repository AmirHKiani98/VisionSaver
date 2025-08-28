from ultralytics import YOLO
from ai.detection_algorithms.v2.deepsort.tracker import Tracker
from ai.detection_algorithms.v2.deepsort.detection import Detection
from ai.detection_algorithms.v2.deepsort.nn_matching import NearestNeighborDistanceMetric

model = YOLO("yolov8n.pt")
def detect(frame):
    """
    Using YOLOv8 for object detection and DeepSORT for tracking.
    """
    results = model(frame, verbose=False)[0]
    detections = []
    if results.boxes is not None and len(results.boxes) > 0:
        xyxy = results.boxes.xyxy.cpu().numpy()
        conf = results.boxes.conf.cpu().numpy()
        cls = results.boxes.cls.cpu().numpy().astype(int)
        
        for (x1, y1, x2, y2), score, cls_id in zip(xyxy, conf, cls):
            width = x2 - x1
            height = y2 - y1
            detections.append(Detection(tlwh=(x1, y1, width, height), confidence=score, feature=None))
    
    # Initialize tracker
    metric = NearestNeighborDistanceMetric("cosine", 0.2, None)
    tracker = Tracker(metric)
    tracker.predict()
    tracker.update(detections)
    
    tracked_objects = []
    for track in tracker.tracks:
        if not track.is_confirmed() or track.time_since_update > 1:
            continue
        bbox = track.to_tlbr()
        tracked_objects.append({
            "x1": bbox[0],
            "y1": bbox[1],
            "x2": bbox[2],
            "y2": bbox[3],
            "track_id": track.track_id,
            "cls_id": track.class_id,
            "confidence": track.confidence,
        })
    
    return tracked_objects
    
    