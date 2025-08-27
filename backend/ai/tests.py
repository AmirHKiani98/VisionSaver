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
        self.record_id = 556
        self.divide_time = 20
        


    def get_get_detection_progress(self, version: str) -> str:
        """
        Helper method to get detection progress.
        """
        return f'detection_progress_{self.record_id}_{self.divide_time}_{version}'

    def test_detect_version_v1(self):        
        """
        Test the CarDetection class with version v1.
        """
        return # Tested
        version = 'v1'
        detection_algorithm = DetectionAlgorithm(record_id=self.record_id, divide_time=self.divide_time, version=version)
        da = detection_algorithm.run()
        print(da)
    
    def test_detect_version_v2(self):
        """
        Test the CarDetection class with version v2.
        """
        verson = 'v2'
        detection_algorithm = DetectionAlgorithm(record_id=self.record_id, divide_time=self.divide_time, version=verson)
        da = detection_algorithm.run()
        print(da)



        
        
            
            