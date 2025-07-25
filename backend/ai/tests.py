from django.test import TestCase
from .car_detection import CarDetection
from django.conf import settings
from ultralytics import YOLO
import os
import cv2
class AiAppTestCase(TestCase):
    """
    Template test case for the 'ai' Django app.
    """
    def test_video_image(self):
        video_path = os.path.join(settings.MEDIA_ROOT, "161.mkv")
        self.assertTrue(os.path.isfile(video_path), f"Video file not found at {video_path}")
        
        # Load YOLOv8 model
        model = YOLO('yolov8n.pt', verbose=False)

        # Initialize CarDetection with a high divide_time for a fast test
        detector = CarDetection(
            model=model,
            video_path=video_path,
            divide_time=100  # e.g., every 100 seconds (1 frame for quick test)
        )

        # Check that results exist
        self.assertIsInstance(detector.results, dict)
        self.assertGreater(len(detector.results), 0, "No frames were processed")

        # Check structure of a sample result
        for timestamp, data in detector.results.items():
            self.assertIn("frame_number", data)
            self.assertIn("objects", data)
            self.assertIsInstance(data["objects"], list)

            # If there are any detected objects, check structure
            if data["objects"]:
                obj = data["objects"][0]
                for key in ['id', 'x1', 'y1', 'x2', 'y2', 'center_x', 'center_y']:
                    self.assertIn(key, obj)
                break  # Only validate structure for the first valid detection


        

