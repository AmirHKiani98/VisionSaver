"""
Making an RTSP object for handling RTSP streams in a Django application.
"""
import os
import cv2
import dotenv
import subprocess
# Import settings from the Django project
from django.conf import settings
dotenv.load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

class RTSPObject:
    def __init__(self, url: str):
        """
        Initialize the RTSPObject with the given URL.
        
        :param url: The RTSP stream URL.
        """
        self.url = url
        self.cap = cv2.VideoCapture(url)
        if not self.cap.isOpened():
            raise ValueError(f"Could not open RTSP stream at {url}")
    
    def read_frame(self):
        """
        Read a frame from the RTSP stream.
        
        :return: The frame read from the stream, or None if no frame is available.
        """
        ret, frame = self.cap.read()
        if not ret:
            return None
        return frame
    
    def release(self):
        """
        Release the RTSP stream.
        """
        if self.cap.isOpened():
            self.cap.release()
    
    def __del__(self):
        """
        Destructor to ensure the RTSP stream is released when the object is deleted.
        """
        self.release()
    
    def record(self, duration_seconds: int, output_path: str):
        ffmpeg_path = settings.BASE_DIR + os.getenv("FFMPEG_PATH")        
        cmd = [
            ffmpeg_path,
            "-y",
            "-rtsp_transport", "tcp",
            "-i", self.url,
            "-t", str(duration_seconds),
            "-c", "copy",
            output_path
        ]
        try:
            print(f"Running command: {' '.join(cmd)}")
            subprocess.run(cmd, check=True)
            print("Recording complete.")
        except subprocess.CalledProcessError as e:
            print(f"FFmpeg error: {e}")
            raise

# Try
if __name__ == "__main__":
    # Example usage
    ip = "192.168.29.108"
    stream = "cam1"
    rtsp = RTSPObject(f"rtsp://{ip}/{stream}")
    # Try recording for 1 minute and save to output.mp4
    try:
        rtsp.record(10, "output.mp4")
        print("Recording ompleted successfully.")
    except Exception as e:
        print(f"An error occurred: {e}")
