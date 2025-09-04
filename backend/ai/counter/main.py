import os
import pandas as pd
import cv2
import numpy as np
from ai.counter.model.main import line_points_to_xy
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.conf import settings
from multiprocessing import Pool, cpu_count
from ai.counter.model.main import count_function, get_line_types

logger = settings.APP_LOGGER

# ---- GLOBAL set by pool initializer (each worker gets its own copy) ----
_LINE_TYPES = None

def _init_pool(line_types):
    """Called once per worker process."""
    global _LINE_TYPES
    _LINE_TYPES = line_types

def process_row(row_data):
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


class Counter:
    def __init__(self, record_id, divide_time, version) -> None:
        self.record_id = record_id
        self.divide_time = divide_time
        self.version = version
        from django.apps import apps
        if not apps.ready:
            raise RuntimeError("Django apps not ready. Cannot access models.")
        from ai.models import ModifiedAutoDetection, AutoDetection
        mod = ModifiedAutoDetection.objects.filter(
            record_id=record_id, divide_time=divide_time, version=version
        ).first()
        aut = None if mod else AutoDetection.objects.filter(
            record_id=record_id, divide_time=divide_time, version=version
        ).first()
        if not (mod or aut):
            raise ValueError("No auto detection found for this record with the specified divide_time and version")

        self.df_file_path = (mod or aut).file_name # type: ignore
        if not os.path.exists(self.df_file_path):
            raise FileNotFoundError(f"The file {self.df_file_path} does not exist.")

        self.df = pd.read_csv(self.df_file_path)
        if self.df.empty:
            raise ValueError("The detection dataframe is empty.")

        # Video (kept only in parent — do NOT use inside workers)
        video_file_path = f"{settings.MEDIA_ROOT}/{record_id}.mp4"
        if not os.path.exists(video_file_path):
            video_file_path = f"{settings.MEDIA_ROOT}/{record_id}.mkv"
            if not os.path.exists(video_file_path):
                raise FileNotFoundError(f"No video file found for record ID {record_id}")
        self.video_file_path = video_file_path
        self.video_capture = cv2.VideoCapture(self.video_file_path)
        if not self.video_capture.isOpened():
            raise ValueError(f"Could not open the video file {self.video_file_path}.")
        self.frame_count = int(self.video_capture.get(cv2.CAP_PROP_FRAME_COUNT))
        self.fps = self.video_capture.get(cv2.CAP_PROP_FPS)
        self.duration = self.frame_count / self.fps if self.fps > 0 else 0
        self.video_height = int(self.video_capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
        self.video_width = int(self.video_capture.get(cv2.CAP_PROP_FRAME_WIDTH))


    def _get_line_types(self, tolerance=0.1):
        self.line_types = {}
        for line_key, list_of_dicts in self.lines.items(): # type: ignore
            self.line_types[line_key] = []
            for line_dict in list_of_dicts:
                points = line_dict.get('points', [])
                if points:
                    points = line_points_to_xy(points, video_width=self.video_width, video_height=self.video_height)  # Normalized to [0,1]
                    line_type, geom = get_line_types(points, tolerance)
                    self.line_types[line_key].append((line_type, geom))
        return self.line_types
    
    def update_progress(self, progress):
        try:
            group_name = f"actual_counter_progress_{self.record_id}_{self.divide_time}_{self.version}"
            logger.info(f"Counting progress: {progress:.2f}%")
            channel_layer = get_channel_layer()
            if channel_layer is not None:
                async_to_sync(channel_layer.group_send)(group_name, {
                    "type": "send_progress",
                    "progress": float(progress)
                })
        except Exception as e:
            logger.error(f"Error sending progress update: {str(e)}")

    def counter(self):
        logger.info(f"Starting counting for record ID {self.record_id} with divide_time {self.divide_time} and version {self.version}")

        total_rows = len(self.df)
        if total_rows == 0:
            raise ValueError("The detection dataframe has no rows.")

        self.df['in_area'] = False
        self.df['line_index'] = -1

        shared_line_types = self._get_line_types(tolerance=0.1)
        nproc = max(4, cpu_count() // 2)  # Use half of available CPUs

        processed = 0
        def _on_result(res):
            nonlocal processed
            idx, in_area, line_idx = res
            if 0 <= idx < total_rows:
                self.df.at[idx, 'in_area'] = in_area
                self.df.at[idx, 'line_index'] = line_idx
            processed += 1

            if (processed % 200 == 0) or (processed == total_rows):
                self.update_progress(processed * 100.0 / total_rows)

        async_results = []
        with Pool(processes=nproc, initializer=_init_pool, initargs=(shared_line_types,)) as pool:
            for row in self.df.iloc[:].iterrows():
                ar = pool.apply_async(process_row, args=(row,), callback=_on_result)
                async_results.append(ar)

            pool.close()
            for ar in async_results:
                ar.wait()
            pool.join()

        output_path = self.df_file_path.replace('.csv', '_counted.csv')
        self.df.to_csv(output_path, index=False)
        from ai.models import AutoCount, DetectionLines
        detection_lines = DetectionLines.objects.filter(record_id=int(self.record_id)).first()
        AutoCount.objects.create(
            record_id=int(self.record_id),
            time=pd.Timestamp.now(),
            version=self.version,
            file_name=output_path,
            divide_time=self.divide_time,
            lines=detection_lines
        )
        self.update_progress(100.0)
        return self.df
