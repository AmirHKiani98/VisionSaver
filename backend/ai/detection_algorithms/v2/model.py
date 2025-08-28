from ultralytics import YOLO
from ai.detection_algorithms.v2.deepsort.tracker import Tracker
from ai.detection_algorithms.v2.deepsort.detection import Detection
from ai.detection_algorithms.v2.deepsort.nn_matching import NearestNeighborDistanceMetric

# 1) Create ONE model/metric/tracker once
model  = YOLO("yolov8n.pt")
metric = NearestNeighborDistanceMetric("cosine", 0.2, budget=100)
tracker = Tracker(metric, max_age=30, n_init=3)

# 2) Global map from DeepSORT's internal IDs -> your global 1..m IDs
global_id_map = {}          # {track.track_id: global_id}
next_global_id = 1

def detect(frame):
    global next_global_id

    # YOLO detections
    r = model(frame, verbose=False)[0]
    detections = []
    if r.boxes is not None and len(r.boxes) > 0:
        xyxy = r.boxes.xyxy.cpu().numpy()
        conf = r.boxes.conf.cpu().numpy()
        # NOTE: you’re not using class in DeepSORT; that’s fine for now
        for (x1,y1,x2,y2), score in zip(xyxy, conf):
            tlwh = (x1, y1, x2 - x1, y2 - y1)
            detections.append(Detection(tlwh=tlwh, confidence=score, feature=None))  # add feature later

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

        tracked_objects.append({
            "track_id": gid,       # 1..m across all frames
            "x1": x1, "y1": y1, "x2": x2, "y2": y2
        })
    return tracked_objects