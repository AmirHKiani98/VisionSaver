"""
Making an RTSP object for handling RTSP streams in a Django application.
"""
import os
import cv2
import dotenv
import subprocess
from urllib.parse import urlparse

# --- Ensure Django settings are configured before importing settings ---
import django
from django.conf import settings
if not settings.configured:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'processor.settings')
    django.setup()
# ----------------------------------------------------------------------

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
        
        # Ensure output path is absolute
        abs_output_path = os.path.join(str(settings.BASE_DIR), output_path) if not os.path.isabs(output_path) else output_path
        output_dir = os.path.dirname(abs_output_path)
        if not os.path.isdir(output_dir):
            os.makedirs(output_dir, exist_ok=True)

        if not ffmpeg_env:
            raise EnvironmentError("FFMPEG_PATH environment variable is not set.")
        ffmpeg_path = ffmpeg_env if os.path.isabs(ffmpeg_env) else os.path.join(str(settings.BASE_DIR), ffmpeg_env)
        
        # Adjust output extension according to method
       
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
            "-timeout", "30000000",
            "-i", self.url,
            "-t", str(duration_seconds),
            "-c", "copy",
            "-avoid_negative_ts", "make_zero",
            "-fflags", "+genpts",
            "-f", "matroska",  # .mkv
            abs_output_path
        ]

        preferred_cmd = cmd_encode if self.record_type == 'supervisor' else cmd_copy
        # fallback_cmd = cmd_copy if self.record_type == 'supervisor' else cmd_encode

        # Try preferred
        try:
            print("[DEBUG] Running FFmpeg command:", ' '.join(preferred_cmd))
            result = subprocess.run(preferred_cmd, capture_output=True, text=True, check=False)
            print(f"[DEBUG] FFmpeg returncode: {result.returncode}")
            print("[DEBUG] FFmpeg stdout:", result.stdout)
            print("[DEBUG] FFmpeg stderr:", result.stderr)
            if os.path.exists(abs_output_path) and os.path.getsize(abs_output_path) > 1024:
                print(f"[DEBUG] Output file created: {abs_output_path}, size: {os.path.getsize(abs_output_path)} bytes")
                return True
            else:
                print(f"[DEBUG] Output file missing or too small: {abs_output_path}")
                return False
        except Exception as e:
            print(f"[DEBUG] Exception running FFmpeg: {e}")
            return False

# Try
if __name__ == "__main__":
    # Example usage
    ip = "192.168.29.108"
    stream = "cam1"
    rtsp = RTSPObject(f"rtsp://{ip}/{stream}")
    # Try recording for 1 minute and save to output.mp4
    try:
        rtsp.record(1, "output")
    except Exception as e:
        print(f"[DEBUG] Exception during recording: {e}")
        pass
