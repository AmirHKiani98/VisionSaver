from django.test import TestCase
from .car_detection import CarDetection
from django.conf import settings
from ultralytics import YOLO
import cv2
class AiAppTestCase(TestCase):
    """
    Template test case for the 'ai' Django app.
    """
    def test_video_image(self):
        # Example test: always passes
        model = YOLO('yolov8n.pt', verbose=False)  # Load a pre-trained YOLO model
        model = CarDetection(
            model=model, 
            video_path=settings.MEDIA_ROOT + "/503.mkv",
            divide_time=100
        )
        
        

