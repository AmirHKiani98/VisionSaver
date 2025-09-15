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
        Worker: runs inside child process.
        Expects row_data = (index, row_series) or any cheap tuple you want.
        Reads shared _LINE_TYPES set by _init_pool.
        """
        try:
            x_c, y_c = (x1 + x2) / 2, (y1 + y2) / 2
            point = Point(x_c, y_c)
            in_area = False
            final_line_key = -1
            geom_index = -1
            for line_key, geoms in zones.items(): # type: ignore
                for index, geom in enumerate(geoms):
                    if geom.contains(point):
                            in_area = True
                            final_line_key = line_key
                            geom_index = index
                            break
                    if in_area:
                        break
            return in_area, final_line_key, geom_index

        except Exception as e:
            # Avoid noisy worker logging; send a safe fallback
            logger.error(f"Worker error in count_zones (x1={x1}, y1={y1}, x2={x2}, y2={y2}):\n{print(traceback.format_exc())}")
            return False, -1

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

        
        
        
        

        