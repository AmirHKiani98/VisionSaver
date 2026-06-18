# v7 uses the same YOLO11 + ByteTrack detector as v5.
# Trajectory classification happens at aggregation time in api/utils.py.
from ai.detection_algorithms.v5.model import detect  # noqa: F401
