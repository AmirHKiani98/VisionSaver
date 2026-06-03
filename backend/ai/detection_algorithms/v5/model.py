import os
import sys

from ultralytics import YOLO

MODEL_PATH = os.path.join(
    os.path.dirname(  # backend/
        os.path.dirname(  # ai/
            os.path.dirname(  # detection_algorithms/
                os.path.dirname(os.path.abspath(__file__))  # v5/
            )
        )
    ),
    "yolo11n.pt",
)


class _Suppress:
    def __enter__(self):
        self._out, self._err = sys.stdout, sys.stderr
        sys.stdout = sys.stderr = open(os.devnull, "w")
        return self

    def __exit__(self, *_):
        sys.stdout.close()
        sys.stdout, sys.stderr = self._out, self._err


with _Suppress():
    model = YOLO(MODEL_PATH)

VEHICLE_CLASSES = {2, 3, 5, 7}  # car, motorcycle, bus, truck
CONF_THRESHOLD = 0.3


def detect(frame, device=0):
    with _Suppress():
        results = model.track(
            frame,
            persist=True,
            tracker="bytetrack.yaml",
            verbose=False,
            device=device,
        )[0]

    out = []
    if results.boxes is None or len(results.boxes) == 0:
        return out

    boxes = results.boxes
    for i in range(len(boxes)):
        cls_id = int(boxes.cls[i].item())
        if cls_id not in VEHICLE_CLASSES:
            continue
        conf = float(boxes.conf[i].item())
        if conf < CONF_THRESHOLD:
            continue
        if boxes.id is None:
            continue
        track_id = boxes.id[i].item()
        if track_id is None:
            continue
        x1, y1, x2, y2 = boxes.xyxy[i].cpu().numpy().astype(float)
        out.append(
            {
                "track_id": int(track_id),
                "x1": x1,
                "y1": y1,
                "x2": x2,
                "y2": y2,
                "cls_id": cls_id,
                "confidence": conf,
            }
        )
    return out
