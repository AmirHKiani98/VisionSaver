# v6 uses the same YOLO11 + ByteTrack detector as v5.
# OD-pair matching happens at aggregation time in api/utils.py.
from ai.detection_algorithms.v5.model import detect  # noqa: F401
