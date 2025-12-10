from shapely.geometry import Point
from django.conf import settings
import traceback
from ai.utils import resample_curve, parallelism_score
import numpy as np
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
        Here we have detection direction. So we don't care about the order of points.
        We don't need any changes and returns
        """
        return False, -1, -1

    @staticmethod
    def find_direction(veh_df, directions, threshold=0.7):
        """
        Find direction of each vehicle based on its trajectory.
        veh_df: DataFrame with columns ['frame', 'x', 'y']
        Returns: direction as a string ('left_to_right', 'right_to_left', 'top_to_bottom', 'bottom_to_top', or 'unknown')
        """
        if veh_df.empty or len(veh_df) < 2:
            return None
        
        x1 = veh_df['x1'].values
        y1 = veh_df['y1'].values
        x2 = veh_df['x2'].values
        y2 = veh_df['y2'].values
        x = (x1 + x2) / 2
        y = (y1 + y2) / 2
        x_resampled, y_resampled = resample_curve(x, y, n_points=50)
        # parallel score
        for line_key, line_sample_list in directions.items(): # type: ignore
            for line_sample in line_sample_list:
                line_sample = np.asarray(line_sample, dtype=np.float32).reshape(-1, 2)
                x_line, y_line = line_sample[:, 0], line_sample[:, 1]
                score = parallelism_score(x_resampled, y_resampled, x_line, y_line)
                # TODO: tune threshold or find the maximum score
                if score >= threshold:
                    return line_key
        return None

        
        
        
        

        