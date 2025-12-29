from ultralytics import YOLO
import cv2
import numpy as np
model = YOLO('yolo11n.pt')

objects_of_interest = {2, 3, 5, 7}  # car, motorcycle, bus, truck


def detect_number_of_vehicles_from_frame(frame):
    """
    Detect objects in a frame and return the number of vehicles detected.
    Robustly handles CUDA tensors by moving to CPU before numpy().
    """
    import torch  # Import here to avoid global import issues
    try:
        # choose device for inference if model.track supports it; keep None so model decides
        res = model.track(frame, verbose=False, device=0)[0]
        # res.boxes.cls may be a tensor on GPU or CPU; always move to cpu then numpy
        cls_vals = None
        if hasattr(res, "boxes") and hasattr(res.boxes, "cls"):
            cls_tensor = res.boxes.cls
            try:
                # safe: works for both CPU and GPU tensors
                cls_vals = cls_tensor.cpu().numpy()
            except Exception:
                # fallback: try converting via list
                try:
                    cls_vals = np.array(list(cls_tensor))
                except Exception:
                    cls_vals = np.array([])
        else:
            cls_vals = np.array([])

        vehicle_count = int(sum(1 for cls in np.atleast_1d(cls_vals) if int(cls) in objects_of_interest))
        return vehicle_count
    except Exception as e:
        import logging
        logging.error(f"Error in detection algorithm: {e}")
        return 0

def noise_detection(frame, debug=False):
    
    # Number of vehicles
    vehicle_count = detect_number_of_vehicles_from_frame(frame)
    if vehicle_count == 0:
        return 0.9
    elif vehicle_count >= 5:
        return 0.0
    elif vehicle_count == 4:
        return 0.1
    elif vehicle_count == 3:
        return 0.2
    elif vehicle_count == 2:
        return 0.3
    elif vehicle_count == 1:
        return 0.5
    else:
        return 0.0