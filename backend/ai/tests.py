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
        
        # Load YOLOv8 model
        model = YOLO('yolov8n.pt', verbose=False)
        detector = CarDetection(
            model=model,
            video_path=self.video_path,
            divide_time=0.5
        )

        
        
        

        # Check if the file exists
        objects_df = detector.results_df
        self.assertIsNotNone(objects_df, "Results DataFrame is None")
        self.assertGreater(len(objects_df), 0, "No objects detected in the video") # type: ignore
        os.makedirs(self.output_dir, exist_ok=True)
        objects_df.to_csv(os.path.join(self.output_dir, 'car_detection_results.csv'), index=False) # type: ignore
        self.play_annotated_video(objects_df)
        
        
    # def test_play_annotated_video(self):
    #     # Test playing the annotated video
    #     with open(os.path.join(self.output_dir, 'car_detection_results.json'), 'r') as f:
    #         detector = json.load(f)
    #     self.play_annotated_video(detector)

    def play_annotated_video(self, objects_df, fps=10):
        delay = int(1000 / fps)
        objects_df = objects_df.copy()
        objects_df = objects_df.sort_values(by='time')
        cap = cv2.VideoCapture(self.video_path)
        last_frame_number = None
        group_by_time = objects_df.groupby(['time', 'frame_number'])
        for names, group in group_by_time:
            timestamp, frame_number = names
            
            print(f"Processing timestamp: {timestamp}")
            # Only seek if not the next frame
            if last_frame_number is None or frame_number != last_frame_number + 1:
                cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
            success, frame = cap.read()
            if not success:
                continue
            frame = self.draw_detections(frame, group)
            cv2.imshow('Annotated Video', frame)
            if cv2.waitKey(delay) & 0xFF == ord('q'):
                break
            last_frame_number = frame_number
        cap.release()
        cv2.destroyAllWindows()

    def draw_detections(self, frame, objects):
        for index, row in objects.iterrows():
            x1, y1 = int(row['x1']), int(row['y1'])
            x2, y2 = int(row['x2']), int(row['y2'])
            track_id = row['track_id'] if 'track_id' in row else 0
            label = row['label'] if 'label' in row else 'unknown'

            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(frame, f"{label} ID:{track_id}", (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        return frame