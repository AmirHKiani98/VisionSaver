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
            print("rtsp_object 1: Could not open RTSP stream at", url)
            raise ValueError(f"Could not open RTSP stream at {url}")
        print("rtsp_object 2: RTSP stream opened successfully at", url)
    
    def read_frame(self):
        """
        Read a frame from the RTSP stream.
        
        :return: The frame read from the stream, or None if no frame is available.
        """
        ret, frame = self.cap.read()
        if not ret:
            print("rtsp_object 3: Failed to read frame from stream")
            return None
        print("rtsp_object 4: Frame read successfully")
        return frame
    
    def release(self):
        """
        Release the RTSP stream.
        """
        if self.cap.isOpened():
            self.cap.release()
            print("rtsp_object 5: RTSP stream released")
    
    def __del__(self):
        """
        Destructor to ensure the RTSP stream is released when the object is deleted.
        """
        self.release()
        print("rtsp_object 6: RTSPObject deleted and stream released")
    
    def record(self, duration_minutes: int, output_path: str):
        duration_seconds = duration_minutes * 60
        ffmpeg_env = os.getenv("FFMPEG_PATH")
        print("rtsp_object 7: FFMPEG_PATH env:", ffmpeg_env)
        
        # Ensure output path is absolute
        abs_output_path = os.path.join(str(settings.BASE_DIR), output_path) if not os.path.isabs(output_path) else output_path
        output_dir = os.path.dirname(abs_output_path)
        if not os.path.isdir(output_dir):
            print("rtsp_object 8: Creating directory:", output_dir)
            os.makedirs(output_dir, exist_ok=True)

        if not ffmpeg_env:
            print("rtsp_object 9: FFMPEG_PATH environment variable is not set.")
            raise EnvironmentError("FFMPEG_PATH environment variable is not set.")
        ffmpeg_path = ffmpeg_env if os.path.isabs(ffmpeg_env) else os.path.join(str(settings.BASE_DIR), ffmpeg_env)
        print("rtsp_object 10: FFmpeg executable path:", ffmpeg_path)
        

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
        fallback_cmd = cmd_copy if self.record_type == 'supervisor' else cmd_encode

        # Try preferred
        try:
            print("rtsp_object 11: Running preferred command:", ' '.join(preferred_cmd))
            result = subprocess.run(preferred_cmd, capture_output=True, text=True, check=False)
            print(f"rtsp_object FFmpeg returncode: {result.returncode}")
            print("rtsp_object FFmpeg stdout:", result.stdout)
            print("rtsp_object FFmpeg stderr:", result.stderr)
            if os.path.exists(abs_output_path) and os.path.getsize(abs_output_path) > 1024:
                print("rtsp_object 12: Recording completed successfully with preferred method.")
                return True
            else:
                print(f"rtsp_object 13: Preferred method failed or produced a small file. File exists: {os.path.exists(abs_output_path)}, Size: {os.path.getsize(abs_output_path) if os.path.exists(abs_output_path) else 'N/A'} bytes")
                return False
        except Exception as e:
            print("rtsp_object 14: Preferred method raised exception:", e)
            if 'result' in locals():
                print("rtsp_object 15: Stderr:", result.stderr)
                print("rtsp_object 15: Stdout:", result.stdout)
            else:
                print("rtsp_object 15: No result object, no stderr/stdout captured")
            return False

        # Try fallback
        try:
            print("rtsp_object 16: Running fallback command:", ' '.join(fallback_cmd))
            result = subprocess.run(fallback_cmd, capture_output=True, text=True, check=True)
            if os.path.exists(abs_output_path) and os.path.getsize(abs_output_path) > 1024:
                print("rtsp_object 17: Recording completed successfully with fallback method.")
                return True
            else:
                print("rtsp_object 18: Fallback method failed or produced a small file.")
                return False
        except subprocess.CalledProcessError as e:
            print("rtsp_object 19: FFmpeg fallback failed:", e.stderr)
            return False
        except Exception as e:
            print("rtsp_object 20: Fallback exception:", e)
            return False

# Try
if __name__ == "__main__":
    # Example usage
    ip = "192.168.29.108"
    stream = "cam1"
    rtsp = RTSPObject(f"rtsp://{ip}/{stream}")
    # Try recording for 1 minute and save to output.mp4
    try:
        rtsp.record(10, "output.mp4")
        print("rtsp_object 21: Recording completed successfully.")
    except Exception as e:
        print("rtsp_object 22: An error occurred:", e)
