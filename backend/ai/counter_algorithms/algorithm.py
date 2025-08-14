import os
import cv2
class AlgorithmDetectionZone():
    """
    Base class for counter
    algorithms.
    """
    def __init__(self, version="v1", auto_detection_csv_path=None, detection_lines=None, record_path=None) -> None:
        """
        Initialize the detection zone algorithm with a version and model instance.
        """
        self.version = version
        from importlib import import_module
        model_module = import_module(f'.model', package=f'ai.counter_algorithms.{self.version}')
        self.Model = model_module.Model
        if not auto_detection_csv_path:
            raise ValueError("auto_detection_csv_path must be provided.")
        if not record_path:
            raise ValueError("record_path must be provided.")
        if not os.path.exists(auto_detection_csv_path):
            raise FileNotFoundError(f"The file {auto_detection_csv_path} does not exist.")
        if not os.path.exists(record_path):
            raise FileNotFoundError(f"The record path {record_path} does not exist.")
        record_video = cv2.VideoCapture(record_path)
        video_width = int(record_video.get(cv2.CAP_PROP_FRAME_WIDTH))
        video_height = int(record_video.get(cv2.CAP_PROP_FRAME_HEIGHT))
        self.model_instance = self.Model(auto_detection_csv_path, detection_lines, video_width, video_height)
    
    def get_result(self):
        """
        Get the result of the counter algorithm.
        """
        return self.model_instance.counter()

