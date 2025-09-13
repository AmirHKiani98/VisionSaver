import os
import pandas as pd
import cv2
import numpy as np
from ai.counter.model.main import line_points_to_xy
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.conf import settings
from multiprocessing import Pool, cpu_count
from ai.counter.utils import count_zone, get_line_types

logger = settings.APP_LOGGER

# ---- GLOBAL set by pool initializer (each worker gets its own copy) ----
_LINE_TYPES = None

def _init_pool(line_types):
    """Called once per worker process."""
    global _LINE_TYPES
    _LINE_TYPES = line_types

class Counter:

    @staticmethod
    def count_directions():
        return True
    
    @staticmethod
    def count_zones(x1, y1, x2, y2, zones):
        """
        Worker: runs inside child process.
        Expects row_data = (index, row_series) or any cheap tuple you want.
        Reads shared _LINE_TYPES set by _init_pool.
        """
        try:
            in_area, final_line_key = count_zone(x1, y1, x2, y2, zones)
            return in_area, final_line_key

        except Exception as e:
            # Avoid noisy worker logging; send a safe fallback
            print(f"Worker error in count_zones: {e}")
            return False, -1