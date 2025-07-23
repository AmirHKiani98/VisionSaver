from django.test import TestCase
from .views import load_model
from django.conf import settings
import cv2
class AiAppTestCase(TestCase):
    """
    Template test case for the 'ai' Django app.
    """
    def test_video_image(self):
        # Example test: always passes
        model = load_model()
        video_path = settings.MEDIA_ROOT + "/503.mkv"
        video_capture = cv2.VideoCapture(video_path)
        fps = video_capture.get(cv2.CAP_PROP_FPS)
        target_time = 130 # seconds into the video (2:08)
        frame_number = int(target_time * fps)
        video_capture.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
        success, frame = video_capture.read()
        if not success:
            self.fail("Failed to read frame from video.")
        # Plot frame
        results = model(frame)
        print(results)
        
        

