from django.test import TestCase
from .ISSApi import ISSApi
from datetime import datetime
# Create your tests here.

class RecordTests(TestCase):
    
    # Set up the main variables
    def setUp(self):
        self.ip = "192.168.42.169"
        self.camera_number = 1
        self.start_time = datetime(2025, 5, 10, 12, 0, 0)
        self.end_time = datetime(2025, 5, 10, 13, 0, 0)
        self.api = ISSApi(self.ip, self.camera_number, self.start_time, self.end_time)

    def test_iss_api_json(self):
        detections = self.api.get_detections_json()
        self.assertIsInstance(detections, list)
        if detections:
            self.assertIn("zoneId", detections[0])
            self.assertIn("direction", detections[0])
            self.assertIn("time", detections[0])
    

    def test_iss_api_pandas(self):
        detections = self.api.get_detections_pandas()
        self.assertIsNotNone(detections)
        self.assertFalse(detections.empty)
        self.assertIn("zoneId", detections.columns)
        self.assertIn("direction", detections.columns)
        self.assertIn("time", detections.columns)
        self.assertIn("direction", detections.columns)
    