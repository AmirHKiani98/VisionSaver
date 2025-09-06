import os
import pandas as pd
import cv2
import numpy as np
from ai.counter.model.main import line_points_to_xy
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.conf import settings
from multiprocessing import Pool, cpu_count
from ai.counter.utils import count_function, get_line_types

logger = settings.APP_LOGGER

# ---- GLOBAL set by pool initializer (each worker gets its own copy) ----
_LINE_TYPES = None

def _init_pool(line_types):
    """Called once per worker process."""
    global _LINE_TYPES
    _LINE_TYPES = line_types

def counter(x1, y1, x2, y2, line_types):
    """
    Worker: runs inside child process.
    Expects row_data = (index, row_series) or any cheap tuple you want.
    Reads shared _LINE_TYPES set by _init_pool.
    """
    try:
        in_area, final_line_key = count_function(x1, y1, x2, y2, line_types)
        return in_area, final_line_key

    except Exception as e:
        # Avoid noisy worker logging; send a safe fallback
        return False, -1


def process_row_multiprocessing(row_data):
    """
    Worker: runs inside child process.
    Expects row_data = (index, row_series) or any cheap tuple you want.
    Reads shared _LINE_TYPES set by _init_pool.
    """
    try:
        index, row = row_data
        x1, y1, x2, y2 = row['x1'], row['y1'], row['x2'], row['y2']
        in_area, line_idx = count_function(x1, y1, x2, y2, _LINE_TYPES)
        return index, in_area, line_idx

    except Exception as e:
        # Avoid noisy worker logging; send a safe fallback
        return (row_data[0] if row_data else -1), False, -1    