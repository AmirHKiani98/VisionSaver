from django.test import TestCase
from mandetect.views import get_information
from datetime import datetime
# Create your tests here.

class ManDetectTests(TestCase):
    def test_get_information(self):
        # Test the get_information function
        ip = "192.168.30.236"
        start_time = datetime.fromisoformat("2025-10-01T00:00:00Z")
        camera_channel = "1"
        end_time = datetime.fromisoformat("2025-10-01T01:00:00Z")
        response = get_information(ip, start_time, camera_channel, end_time)
        self.assertIsInstance(response, dict)
        self.assertIn("error", response)  # Assuming the function returns an error message if