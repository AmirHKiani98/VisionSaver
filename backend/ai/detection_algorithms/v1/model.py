from typing import List, Dict, Any
from ultralytics import YOLO
import numpy as np

model = YOLO('yolo11n.pt')

objects_of_interest = {2, 3, 5, 7}  # car, motorcycle, bus, truck

def detect(frame: np.ndarray):
    """
    Runs per task inside workers. Uses only worker-global state.
    Returns (detections, time)
    """
    # Predict statelessly in workers; track in parent later.

    res = model.track(frame, verbose=False)[0]
    dets: List[Dict[str, Any]] = []
    if res.boxes is not None and len(res.boxes) > 0:
        xywh = res.boxes.xywh.cuda().numpy()
        cls  = res.boxes.cls.cuda().numpy().astype(int)
        conf = res.boxes.conf.cuda().numpy()
        if res.boxes.id is None:
            return dets
        track_ids = res.boxes.id.int().cuda().tolist()
        
        for (x, y, w, h), c, s, track_id in zip(xywh, cls, conf, track_ids):
            if c in objects_of_interest:
                dets.append({
                    "x1": float(x - w/2),
                    "y1": float(y - h/2),
                    "x2": float(x + w/2),
                    "y2": float(y + h/2),
                    "track_id": track_id,         # parent will assign
                    "cls_id": int(c),
                    "confidence": float(s),
                })
    return dets