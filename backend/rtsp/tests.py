
import json
import os
from django.test import TestCase, Client
from django.urls import reverse

class MJPEGStreamViewTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.url = reverse('mjpeg_stream')

    def test_method_not_allowed(self):
        """
        Test that GET requests to the MJPEG stream endpoint return 405 Method Not Allowed.
        """
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 405)
        self.assertIn(b"Method Not Allowed", response.content)

    def test_missing_url_param(self):
        """
        Test that POST requests without the 'url' parameter return 400 Bad Request.
        """
        response = self.client.post(self.url, data=json.dumps({}), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertIn(b"'url' must be a non-empty list", response.content)

    def test_invalid_json(self):
        """
        Test that POST requests with invalid JSON body return 400 Bad Request.
        """
        response = self.client.post(self.url, data="notjson", content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertIn(b"Invalid JSON body", response.content)

    def test_valid_request(self):
        """
        Test that valid POST requests with a list of RTSP URLs return a 200 OK response.
        """
        valid_urls = ["rtsp://192.168.29.108:554/cam1", "rtsp://192.168.29.108:554/cam2"]
        response = self.client.post(
            self.url,
            data=json.dumps({"url": valid_urls}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("multipart/x-mixed-replace", response['Content-Type'])
        # To get the picture (frame), you would need to parse the multipart response.
        # Example: Read the first chunk of the response streaming content.
        # This is a simplified demonstration:
        first_chunk = next(response.streaming_content, None) #type: ignore
        # Save the first chunk to a file in ./tests/pics
        pics_dir = os.path.join(os.path.dirname(__file__), "pics")
        os.makedirs(pics_dir, exist_ok=True)
        with open(os.path.join(pics_dir, "first_frame.jpg"), "wb") as f:
            f.write(first_chunk) #type: ignore
        self.assertIsNotNone(first_chunk)
        # Note: Actual frame content cannot be tested without a real RTSP stream.
