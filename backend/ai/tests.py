from django.test import TestCase
from .car_detection import CarDetection
from django.conf import settings
from ultralytics import YOLO
import os
import cv2
import logging
logging.getLogger('ultralytics').setLevel(logging.WARNING)
class AiAppTestCase(TestCase):
    """
    Template test case for the 'ai' Django app.
    """
    def test_video_image(self):
        video_path = os.path.join(settings.MEDIA_ROOT, "165.mkv")
        self.assertTrue(os.path.isfile(video_path), f"Video file not found at {video_path}")
        
        # Load YOLOv8 model
        model = YOLO('yolov8n.pt', verbose=False)
        detector = CarDetection(
            model=model,
            video_path=video_path,
            divide_time=1
        )

        # Check that results exist
        self.assertIsInstance(detector.results, dict)
        self.assertGreater(len(detector.results), 0, "No frames were processed")
        # Store the data inside the test folder
        output_dir = os.path.join(settings.BASE_DIR, 'tests', 'output')
        os.makedirs(output_dir, exist_ok=True)
        with open(os.path.join(output_dir, 'car_detection_results.json'), 'w') as f:
            import json
            json.dump(detector.results, f, indent=4)
        
        # Check if th file exists
        self.assertTrue(os.path.isfile(os.path.join(output_dir, 'car_detection_results.json')), "Results file was not created")

    def draw_detections(self, frame, objects):
        for obj in objects:
            x1, y1, x2, y2 = int(obj['x1']), int(obj['y1']), int(obj['x2']), int(obj['y2'])
            track_id = obj['id']

            # Draw bounding box
            cv2.rectangle(frame, (x1, y1), (x2, y2), color=(0, 255, 0), thickness=2)

            # Draw ID label
            label = f"ID: {track_id}"
            cv2.putText(frame, label, (x1, y1 - 10),
                        fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                        fontScale=0.6,
                        color=(0, 255, 0),
                        thickness=2)
        return frame