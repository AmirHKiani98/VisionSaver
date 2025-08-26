from django.test import TestCase
from ai.detection_algorithms.algorithm import DetectionAlgorithm
import logging
import websocket
import threading
import dotenv
from django.conf import settings
import os
logging.getLogger('ultralytics').setLevel(logging.WARNING)
dotenv.load_dotenv(settings.ENV_PATH)
class AiAppTestCase(TestCase):
    """
    Template test case for the 'ai' Django app.
    """
    def setUp(self):
        """
        Set up the test case with necessary configurations.
        """
        self.record_id = 673
        self.divide_time = 1
        


    def get_get_detection_progress(self, version: str) -> str:
        """
        Helper method to get detection progress.
        """
        return f'detection_progress_{self.record_id}_{self.divide_time}_{version}'

    def test_version_v1(self):        
        """
        Test the CarDetection class with version v1.
        """
        version = 'v1'
        detection_algorithm = DetectionAlgorithm(version=version)
        da = threading.Thread(target=detection_algorithm.run, args=(self.record_id, self.divide_time))
        da.start()

        # Wait for detection algorithm to complete
        da.join()

        def on_message(ws, message):
            print(f"Received message: {message}")
        def on_error(ws, error):
            print(f"Error: {error}")
        def on_close(ws, close_status_code, close_msg):
            print("WebSocket closed")

        # Connect to websocket after detection is complete
        ws = websocket.WebSocket(f"ws://{os.getenv('BACKEND_SERVER_DOMAIN', 'localhost')}:{os.getenv('BACKEND_SERVER_PORT')}/ws/detection_progress/{self.record_id}/{self.divide_time}/{version}/")
        wst = threading.Thread(target=ws.run_forever)
        wst.start()
        
        # Give websocket a short time to receive any messages
        wst.join(timeout=1)
        ws.close()
        wst.join()


        
        
            
            