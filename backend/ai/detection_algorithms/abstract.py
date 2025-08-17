import os
import cv2
import pandas as pd
from abc import abstractmethod
from django.conf import settings
from record.models import Record
import numpy as np

def final_method(func):
    """
    This is a placeholder for the final method in the abstract class.
    """
    func.__isfinal__ = True
    return func

class FinalMeta(type):
    def __new__(cls, name, bases, attrs):
        for base in bases:
            for attr_name, attr_value in base.__dict__.items():
                if getattr(attr_value, "__isfinal__", False):
                    if attr_name in attrs:
                        raise TypeError(f"Cannot override final method '{attr_name}' in class '{name}'")
        return super().__new__(cls, name, bases, attrs)

class DetectionAlgorithmAbstract:
    def __init__(self, record_id, divide_time):
        """
        Initialize the detection algorithm with a record ID and divide time.
        :param record_id: ID of the record to process.
        :param divide_time: Time interval for processing the record.
        """
        self.record_id = record_id
        self.divide_time = divide_time
        self.video, self.duration, self.width, self.height = self.load_video()
        self.df = pd.DataFrame()
    
    def load_video(self):
        """
        Load the video associated with the record ID.
        :return: Video capture object.
        """
        record = Record.objects.get(id=self.record_id)
        if not record:
            raise ValueError(f"Record with ID {self.record_id} does not exist.")
        video_path = os.path.join(settings.MEDIA_ROOT, f"{self.record_id}.mp4")
        if not os.path.exists(video_path):
            video_path = os.path.join(settings.MEDIA_ROOT, f"{self.record_id}.mkv")
            if not os.path.exists(video_path):
                raise FileNotFoundError(f"The video file for record ID {self.record_id} does not exist.")
        video = cv2.VideoCapture(video_path)
        duration = int(video.get(cv2.CAP_PROP_FRAME_COUNT) / video.get(cv2.CAP_PROP_FPS))
        width = int(video.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(video.get(cv2.CAP_PROP_FRAME_HEIGHT))
        return video, duration, width, height
        
    @abstractmethod
    def detect(self, image):
        """
        Abstract method to be implemented by subclasses for detection logic.
        :param image: Input image for detection.
        :return: Detection results.
        """
        raise NotImplementedError("Subclasses should implement this method.")


    @final_method
    def run(self):
        """
        Process the video and apply detection logic.
        This method should be implemented by subclasses to define how the video is processed.
        """
        if not self.video.isOpened():
            raise RuntimeError(f"Failed to open video for record ID {self.record_id}.")
        
        
        for time in range(0, self.duration, int(self.divide_time)):
            
            ret, frame = self.video.read()
            if not ret:
                break
            
            # Apply detection logic on the frame
            results = self.detect(frame)
            ## TODO: See if you can find a better way to check if the keys are present.
            ## If we were to use the check_detection_keys method here, it would be time consuming.
            # if not self.check_detection_keys(results):
            #     raise ValueError("Detection results do not contain all required keys.")
            temp_df = pd.DataFrame(results)
            self.df = pd.concat([self.df, temp_df], ignore_index=True)
        
        self.video.release()
    
    @final_method
    def check_detection_keys(self, detection_results: dict) -> bool:
        """
        Check if the detection results contain the required keys.
        :param detection_results: Dictionary of detection results.
        :return: True if all required keys are present, False otherwise.
        """
        required_keys = {"x1", "y1", "x2", "y2", "track_id"}
        return required_keys.issubset(detection_results.keys())
        
        

    