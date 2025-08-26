from django.test import TestCase
from detection_algorithms.algorithm import DetectionAlgorithm
import logging
import 
logging.getLogger('ultralytics').setLevel(logging.WARNING)
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
        df = detection_algorithm.run(record_id=self.record_id, divide_time=self.divide_time)
        
        
            
            