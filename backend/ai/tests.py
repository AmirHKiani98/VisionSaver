from django.test import TestCase
from .car_detection import CarDetection
from django.conf import settings
from ultralytics import YOLO
import os
import cv2
import logging
import json
logging.getLogger('ultralytics').setLevel(logging.WARNING)
class AiAppTestCase(TestCase):
    """
    Template test case for the 'ai' Django app.
    """
    def setUp(self):
        """
        Set up the test case with necessary configurations.
        """
        video_input = "663.mkv"
        self.video_path = os.path.join(settings.MEDIA_ROOT, video_input)
        if not os.path.isfile(self.video_path):
            raise FileNotFoundError(f"Test video file not found at {self.video_path}")
        # Ensure the video file is accessiblea
        self.output_dir = os.path.join(os.path.dirname(__file__), 'test')
        self.assertTrue(os.path.isfile(self.video_path), f"Video file not found at {self.video_path}")

    def test_video_image(self):
        self.assertTrue(os.path.isfile(self.video_path), f"Video file not found at {self.video_path}")
        if os.path.isfile(os.path.join(self.output_dir, 'car_detection_results.json')):
            return
        
        # Load YOLOv8 model
        model = YOLO('yolov8n.pt', verbose=False)
        detector = CarDetection(
            model=model,
            video_path=self.video_path,
            divide_time=0.5
        )

        # Check that results exist
        self.assertIsInstance(detector.results, dict)
        self.assertGreater(len(detector.results), 0, "No frames were processed")
        # Store the data inside the test folder
        os.makedirs(self.output_dir, exist_ok=True)
        with open(os.path.join(self.output_dir, 'car_detection_results.json'), 'w') as f:
            # Convert all keys to str to ensure JSON serializability
            def convert_keys_to_str(obj):
                if isinstance(obj, dict):
                    return {str(k): convert_keys_to_str(v) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [convert_keys_to_str(i) for i in obj]
                else:
                    return obj
            json.dump(convert_keys_to_str(detector.results), f, indent=4)

        # Check if the file exists
        self.assertTrue(os.path.isfile(os.path.join(self.output_dir, 'car_detection_results.json')), "Results file was not created")

    def test_play_annotated_video(self):
        # Test playing the annotated video
        with open(os.path.join(self.output_dir, 'car_detection_results.json'), 'r') as f:
            detector = json.load(f)
        self.play_annotated_video(detector)

    def play_annotated_video(self, detector: dict, fps=10):
        delay = int(1000 / fps)
        sorted_keys = sorted(detector.keys())
        cap = cv2.VideoCapture(self.video_path)
        for timestamp in sorted_keys:
            result = detector[timestamp]
            frame_number = result['frame_number']
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
            success, frame = cap.read()
            if not success:
                continue
            frame = self.draw_detections(frame, result['objects'])
            cv2.imshow('Annotated Video', frame)
            if cv2.waitKey(delay) & 0xFF == ord('q'):
                break
        cap.release()
        cv2.destroyAllWindows()

    def draw_detections(self, frame, objects):
        for obj in objects:
            x1, y1, x2, y2 = map(int, obj['bbox'])
            track_id = obj['track_id']
            label = obj['label']

            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(frame, f"{label} ID:{track_id}", (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        return frame