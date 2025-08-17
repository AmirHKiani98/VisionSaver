import os
import cv2
from django.conf import settings
from record.models import Record
import pandas as pd
logger = settings.APP_LOGGER

class AlgorithmDetectionZone():
    """
    Base class for counter
    algorithms.
    """
    def __init__(self, version, record_id, divide_time) -> None:
        """
        Initialize the detection zone algorithm with a version and model instance.
        """
        self.version = version
        self.record_id = record_id
        self.divide_time = divide_time
        from ai.models import AutoCounter, DetectionLines
        from importlib import import_module
        model_module = import_module(f'.model', package=f'ai.detection_modifier_algorithms.{self.version}')
        self.Model = model_module.Model
        video_path = os.path.join(settings.MEDIA_ROOT, str(record_id) + ".mp4")
        if not os.path.exists(video_path):
            video_path = os.path.join(settings.MEDIA_ROOT, str(record_id) + ".mkv")
            if not os.path.exists(video_path):
                logger.error(f"Video file not found for record ID: {record_id}")
                raise FileNotFoundError(f"Video file not found for record ID: {record_id}")
        try:
            record = Record.objects.get(id=record_id)
        except Record.DoesNotExist:
            logger.error(f"Record not found for record ID: {record_id}")
            return None
        auto_counter = AutoCounter.objects.filter(record=record, divide_time=divide_time).first()
        if not auto_counter:
            logger.error(f"AutoCounter not found for record ID: {record_id} with divide_time: {divide_time}")
            raise ValueError(f"AutoCounter not found for record ID: {record_id} with divide_time: {divide_time}")
        auto_detection_csv_path = auto_counter.file_name
        if not auto_detection_csv_path:
            raise ValueError("auto_detection_csv_path must be provided.")
        
        record_video = cv2.VideoCapture(video_path)
        video_width = int(record_video.get(cv2.CAP_PROP_FRAME_WIDTH))
        video_height = int(record_video.get(cv2.CAP_PROP_FRAME_HEIGHT))
        detection_lines_object = DetectionLines.objects.filter(record=record).first()
        if not detection_lines_object:
            logger.error(f"Detection lines not found for record ID: {record_id}")
            raise ValueError(f"Detection lines not found for record ID: {record_id}")
        detection_lines = detection_lines_object.lines
        if not detection_lines:
            logger.error(f"No detection lines found for record ID: {record_id}")
            raise ValueError(f"No detection lines found for record ID: {record_id}")
        self.model_instance = self.Model(auto_detection_csv_path, detection_lines, video_width, video_height, divide_time, record_id)
        
    
    def get_result(self):
        """
        Get the result of the counter algorithm.
        """
        #logger.info("Getting result from the model instance")
        from ai.models import ModifiedAutoCounter
        try:
            record = Record.objects.get(id=self.record_id)
            auto_modified_counter = ModifiedAutoCounter.objects.filter(version=self.version, record=record, divide_time=self.divide_time).first()
            if auto_modified_counter:
                file_path = auto_modified_counter.file_name
                if os.path.exists(file_path):
                    return pd.read_csv(file_path)
                else:
                    logger.error(f"Modified auto counter file not found: {file_path}")
                    raise FileNotFoundError(f"Modified auto counter file not found: {file_path}")
            else:
                df, file_path = self.model_instance.cleaner()
                ModifiedAutoCounter.objects.create(
                    record_id=self.record_id,
                    version=self.version,
                    divide_time=self.divide_time,
                    file_name=file_path
                )
                return df
        except Exception as e:
            logger.error(f"Error while getting result: {e}")
            raise e
        

