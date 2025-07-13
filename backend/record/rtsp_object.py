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
    def transcode_to_mp4(self, input_path):
        """
        Transcode a video to browser-friendly MP4 (H.264/AAC).
        """
        ffmpeg_env = os.getenv("FFMPEG_PATH")
        if not ffmpeg_env:
            raise EnvironmentError("FFMPEG_PATH environment variable is not set.")
        ffmpeg_path = ffmpeg_env if os.path.isabs(ffmpeg_env) else os.path.join(str(settings.MEDIA_ROOT), ffmpeg_env)
        output_path = os.path.splitext(input_path)[0] + ".mp4"
        cmd = [
            ffmpeg_path, "-y",
            "-i", input_path,
            "-c:v", "libx264",
            "-c:a", "aac",
            "-movflags", "+faststart",
            output_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise RuntimeError(f"Transcoding failed: {result.stderr}")
        return output_path
    
    def record(self, duration_minutes: int, output_path: str):
        print(f"[DEBUG] Starting recording for {duration_minutes} minutes to {output_path}")
        duration_seconds = duration_minutes * 60
        ffmpeg_env = os.getenv("FFMPEG_PATH")
        
        # Ensure output path is absolute
        abs_output_path = os.path.join(str(settings.MEDIA_ROOT), output_path) if not os.path.isabs(output_path) else output_path
        output_dir = os.path.dirname(abs_output_path)
        if not os.path.isdir(output_dir):
            print(f"[DEBUG] Creating output directory: {output_dir}")
            os.makedirs(output_dir, exist_ok=True)

        if not ffmpeg_env:
            raise EnvironmentError("FFMPEG_PATH environment variable is not set.")
        ffmpeg_path = ffmpeg_env if os.path.isabs(ffmpeg_env) else os.path.join(str(settings.BASE_DIR), ffmpeg_env)
        
        # Adjust output extension according to method
        abs_output_path = os.path.splitext(abs_output_path)[0] + ".mkv"
        print(f"[DEBUG] Absolute output path: {abs_output_path}")

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
            
            
            if os.path.exists(abs_output_path):
                print(f"[DEBUG] Output file created: {abs_output_path}")
                output_path = self.transcode_to_mp4(abs_output_path)
                print(f"[DEBUG] Transcoded output path: {output_path}")
                if os.path.exists(output_path):
                    print("[DEBUG] Recording and transcoding successful.")
                    return True, "[DEBUG] Recording and transcoding successful."
                else:
                    print("[DEBUG] Transcoded file missing.")
                    return False, "[DEBUG] Transcoded file missing."
            else:
                print(f"[DEBUG] Output file missing or too small: {abs_output_path}")
                return False, "[DEBUG] Output file missing or too small."
        except Exception as e:
            print(f"[DEBUG] Exception running FFmpeg: {e}")
            return False, f"[DEBUG] Exception running FFmpeg: {e}"

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
