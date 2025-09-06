from typing import List, Dict, Any
from ultralytics import YOLO
import numpy as np

model = YOLO('yolo11n.pt')

objects_of_interest = {2, 3, 5, 7}  # car, motorcycle, bus, truck

def detect(frame):
    """Detect objects in a frame"""
    import torch  # Import here to avoid global import issues

    # Preprocess the frame
    res = model.track(frame, verbose=False)[0]
    # Process detection results
    try:
        # Check if CUDA is available and use it if possible, otherwise use CPU
        if torch.cuda.is_available():
            xywh = res.boxes.xywh.cuda().numpy()
            confs = res.boxes.conf.cuda().numpy()
            classes = res.boxes.cls.cuda().numpy()
        else:
            # Fallback to CPU
            xywh = res.boxes.xywh.cpu().numpy()
            confs = res.boxes.conf.cpu().numpy() 
            classes = res.boxes.cls.cpu().numpy()

        # Continue with the rest of your detection logic
        detections = []
        for i, (bbox, conf, cls) in enumerate(zip(xywh, confs, classes)):
            x, y, w, h = bbox
            detection = {
                'x1': x - w / 2,
                'y1': y - h / 2,
                'x2': x + w / 2,
                'y2': y + h / 2,
                'confidence': float(conf),
                'cls_id': int(cls),
                'track_id': i  # Default track ID, can be updated later
            }
            detections.append(detection)
        return detections
    except Exception as e:
        # Log the error and return an empty list
        import logging
        logging.error(f"Error in detection algorithm: {e}")
        return []