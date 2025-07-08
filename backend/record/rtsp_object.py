"""
Making an RTSP object for handling RTSP streams in a Django application.
"""
import os
import cv2
import dotenv
import subprocess
# Import settings from the Django project
from django.conf import settings
dotenv.load_dotenv(os.path.join(os.path.dirname(__file__), '../.hc_to_app_env'))

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
    
    def record(self, duration_minutes: int, output_path: str):
        duration_seconds = duration_minutes * 60
        ffmpeg_env = os.getenv("FFMPEG_PATH")
        print(f"FFMPEG_PATH env: {ffmpeg_env}")
        abs_output_path = os.path.join(str(settings.BASE_DIR), output_path) if not os.path.isabs(output_path) else output_path
        print(f"Output path: {abs_output_path}")
        if not os.path.isdir(os.path.dirname(abs_output_path)):
            print(f"Creating directory: {os.path.dirname(abs_output_path)}")
            os.makedirs(os.path.dirname(abs_output_path), exist_ok=True)
        if not ffmpeg_env:
            raise EnvironmentError("FFMPEG_PATH environment variable is not set.")
        if os.path.isabs(ffmpeg_env):
            ffmpeg_path = ffmpeg_env
        else:
            ffmpeg_path = os.path.join(str(settings.BASE_DIR), ffmpeg_env)
        print(f"FFmpeg executable path: {ffmpeg_path}")
        
        # Enhanced FFmpeg command for better compatibility with authenticated RTSP streams
        cmd = [
            ffmpeg_path,
            "-y",  # Overwrite output file
            "-rtsp_transport", "tcp",  # Use TCP for more reliable transport
            "-rtsp_flags", "prefer_tcp",  # Prefer TCP transport
            "-timeout", "30000000",  # 30 second timeout (in microseconds)
            "-stimeout", "30000000",  # Socket timeout
            "-i", self.url,
            "-t", str(duration_seconds),  # Duration
            "-c:v", "libx264",  # Re-encode video to ensure compatibility
            "-c:a", "aac",  # Re-encode audio to ensure compatibility
            "-preset", "fast",  # Fast encoding preset
            "-crf", "23",  # Good quality constant rate factor
            "-movflags", "+faststart",  # Optimize for streaming
            "-f", "mp4",  # Force MP4 format
            abs_output_path
        ]
        
        # Alternative command for streams that don't work with re-encoding
        cmd_copy = [
            ffmpeg_path,
            "-y",  # Overwrite output file
            "-rtsp_transport", "tcp",  # Use TCP for more reliable transport
            "-rtsp_flags", "prefer_tcp",  # Prefer TCP transport
            "-timeout", "30000000",  # 30 second timeout (in microseconds)
            "-stimeout", "30000000",  # Socket timeout
            "-i", self.url,
            "-t", str(duration_seconds),  # Duration
            "-c", "copy",  # Copy streams without re-encoding
            "-avoid_negative_ts", "make_zero",  # Fix timestamp issues
            "-fflags", "+genpts",  # Generate presentation timestamps
            abs_output_path
        ]
        
        try:
            print(f"Running command (copy method): {' '.join(cmd_copy)}")
            result = subprocess.run(cmd_copy, capture_output=True, text=True, check=False)
            
            # Check if the file was created and has reasonable size
            if os.path.exists(abs_output_path) and os.path.getsize(abs_output_path) > 1024:  # More than 1KB
                print("Recording completed successfully with copy method.")
                return
            else:
                print("Copy method failed or produced small file. Trying re-encoding...")
                
        except Exception as e:
            print(f"Copy method failed: {e}")
            print("Stderr:", result.stderr if 'result' in locals() else "No stderr captured")
        
        try:
            print(f"Running command (re-encode method): {' '.join(cmd)}")
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            print("Recording completed successfully with re-encoding method.")
            
        except subprocess.CalledProcessError as e:
            print(f"FFmpeg failed with return code: {e.returncode}")
            print(f"Stdout: {e.stdout}")
            print(f"Stderr: {e.stderr}")
            print(f"Command attempted: {cmd}")
            raise Exception(f"FFmpeg recording failed: {e.stderr}")
        except Exception as e:
            print(f"Exception type: {type(e)}")
            print(f"Exception args: {e.args}")
            print(f"Command attempted: {cmd}")
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
