"""
Making an RTSP object for handling RTSP streams in a Django application.
"""
import os
import cv2
import dotenv
import subprocess
from urllib.parse import urlparse
# Import settings from the Django project
from django.conf import settings
dotenv.load_dotenv(os.path.join(os.path.dirname(__file__), '../.hc_to_app_env'))

class RTSPObject:
    def __init__(self, url: str, record_type: str = 'supervisor'):
        """
        Initialize the RTSPObject with the given URL.
        
        :param url: The RTSP stream URL.
        """
        self.url = url
        self.cap = cv2.VideoCapture(url)
        self.record_type = record_type
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
    
    def record(self, duration_minutes: int, output_path: str):
        duration_seconds = duration_minutes * 60
        ffmpeg_env = os.getenv("FFMPEG_PATH")
        print(f"FFMPEG_PATH env: {ffmpeg_env}")
        
        # Ensure output path is absolute
        abs_output_path = os.path.join(str(settings.BASE_DIR), output_path) if not os.path.isabs(output_path) else output_path
        output_dir = os.path.dirname(abs_output_path)
        if not os.path.isdir(output_dir):
            print(f"Creating directory: {output_dir}")
            os.makedirs(output_dir, exist_ok=True)

        if not ffmpeg_env:
            raise EnvironmentError("FFMPEG_PATH environment variable is not set.")
        ffmpeg_path = ffmpeg_env if os.path.isabs(ffmpeg_env) else os.path.join(str(settings.BASE_DIR), ffmpeg_env)
        print(f"FFmpeg executable path: {ffmpeg_path}")
        

        # Adjust output extension according to method
        if self.record_type == 'supervisor':
            abs_output_path = os.path.splitext(abs_output_path)[0] + ".mp4"
        else:
            abs_output_path = os.path.splitext(abs_output_path)[0] + ".mkv"

        # Copy method for simple public RTSP
        cmd_copy = [
            ffmpeg_path, "-y",
            "-rtsp_transport", "tcp", "-rtsp_flags", "prefer_tcp",
            "-timeout", "30000000",
            "-i", self.url,
            "-t", str(duration_seconds),
            "-c", "copy",
            "-avoid_negative_ts", "make_zero",
            "-fflags", "+genpts",
            "-f", "matroska",  # .mkv
            abs_output_path
        ]

        # Re-encoding method for auth-protected streams
        cmd_encode = [
            ffmpeg_path, "-y",
            "-rtsp_transport", "tcp", "-rtsp_flags", "prefer_tcp",
            "-timeout", "30000000", "-stimeout", "30000000",
            "-i", self.url,
            "-t", str(duration_seconds),
            "-c:v", "libx264", "-c:a", "aac",
            "-preset", "fast", "-crf", "23",
            "-movflags", "+faststart",
            "-f", "mp4",  # .mp4
            abs_output_path
        ]

        preferred_cmd = cmd_encode if self.record_type == 'supervisor' else cmd_copy
        fallback_cmd = cmd_copy if self.record_type == 'supervisor' else cmd_encode

        # Try preferred
        try:
            print(f"Running preferred command: {' '.join(preferred_cmd)}")
            result = subprocess.run(preferred_cmd, capture_output=True, text=True, check=False)
            if os.path.exists(abs_output_path) and os.path.getsize(abs_output_path) > 1024:
                print("Recording completed successfully with preferred method.")
                return
            print("Preferred method failed or produced a small file. Trying fallback...")
        except Exception as e:
            print(f"Preferred method raised exception: {e}")
            print("Stderr:", result.stderr if 'result' in locals() else "No stderr captured")

        # Try fallback
        try:
            print(f"Running fallback command: {' '.join(fallback_cmd)}")
            result = subprocess.run(fallback_cmd, capture_output=True, text=True, check=True)
            print("Recording completed successfully with fallback method.")
        except subprocess.CalledProcessError as e:
            print(f"FFmpeg fallback failed: {e.stderr}")
            raise Exception(f"FFmpeg fallback failed: {e.stderr}")
        except Exception as e:
            print(f"Fallback exception: {e}")
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
