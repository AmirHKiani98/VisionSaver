"""
Making an RTSP object for handling RTSP streams in a Django application.
"""
import os
import cv2
import dotenv
import subprocess
# --- Ensure Django settings are configured before importing settings ---
from django.conf import settings

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import re

progress_re = re.compile(r'time=(\d{2}:\d{2}:\d{2}\.\d{2})')
# ----------------------------------------------------------------------





dotenv.load_dotenv(os.path.join(os.path.dirname(__file__), '../.hc_to_app_env'))


def broadcast_progress(record_id: str, progress: str):
    channel_layer = get_channel_layer()
    group_name = f"recording_progress_{record_id}"
    if channel_layer is not None:
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "send.progress",
                "progress": progress
            }
        )
    else:
        logger.warning("Channel layer is not configured; skipping progress notification.")
logger = settings.APP_LOGGER

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
    def transcode_to_mp4(self, input_path, record_id):
        """
        Transcode a video to browser-friendly MP4 (H.264/AAC).
        """
        ffmpeg_env = str(settings.FFMPEG_PATH)
        if not ffmpeg_env:
            logger.error("FFMPEG_PATH environment variable is not set.")
            raise EnvironmentError("FFMPEG_PATH environment variable is not set.")
        ffmpeg_path = ffmpeg_env if os.path.isabs(ffmpeg_env) else os.path.join(str(settings.BASE_DIR), ffmpeg_env)
        if not os.path.isfile(ffmpeg_path):

            logger.error(f"FFmpeg executable not found at: {ffmpeg_path}")
            raise FileNotFoundError(f"FFmpeg executable not found at: {ffmpeg_path}")
        output_path = os.path.splitext(input_path)[0] + ".mp4"
        logger.info(f"ffmpeg path: {ffmpeg_path}")
        cmd = [
            ffmpeg_path, "-y",
            "-i", input_path,
            "-c:v", "libx264",
            "-c:a", "aac",
            "-movflags", "+faststart",
            output_path
        ]
        creation_flags = 0x08000000  # This hides the window in Windows
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, creationflags=creation_flags)
        if process.stderr is not None:
            for line in process.stderr:
                match = progress_re.search(line)
                if match:
                    timestamp = match.group(1)
                    broadcast_progress(str(record_id), timestamp)
        else:
            logger.warning("FFmpeg stderr is None, no progress updates will be sent.")
        if process.returncode != 0:
            logger.error(f"[ERROR] Transcoding failed: {process.stderr}")
            raise RuntimeError(f"Transcoding failed: {process.stderr}")
        return output_path
    
    def record(self, duration_minutes: int, output_path: str, record_id: str):
        logger.debug(f"Starting recording for {duration_minutes} minutes to {output_path}")
        duration_seconds = duration_minutes * 60
        ffmpeg_env = str(settings.FFMPEG_PATH)

        # Ensure output path is absolute
        abs_output_path = os.path.join(str(settings.MEDIA_ROOT), output_path) if not os.path.isabs(output_path) else output_path
        output_dir = os.path.dirname(abs_output_path)
        if not os.path.isdir(output_dir):
            logger.debug(f"Creating output directory: {output_dir}")
            os.makedirs(output_dir, exist_ok=True)

        if not ffmpeg_env:
            logger.error("FFMPEG_PATH environment variable is not set.")
            raise EnvironmentError("FFMPEG_PATH environment variable is not set.")
        ffmpeg_path = ffmpeg_env if os.path.isabs(ffmpeg_env) else os.path.join(str(settings.BASE_DIR), ffmpeg_env)
        if not os.path.isfile(ffmpeg_path):
            logger.error(f"FFmpeg executable not found at: {ffmpeg_path}")
            logger.error(f"Path to BASE_DIR: {str(settings.BASE_DIR)}")
            logger.error(f"FFMPEG Env: {ffmpeg_env}")

            raise FileNotFoundError(f"FFmpeg executable not found at: {ffmpeg_path}")
        # Adjust output extension according to method
        abs_output_path = os.path.splitext(abs_output_path)[0] + ".mkv"
        logger.debug(f"Absolute output path: {abs_output_path}")

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
            logger.debug(f"Running FFmpeg command: {' '.join(preferred_cmd)}")
            creation_flags = 0x08000000  # This hides the window in Windows
            process = subprocess.Popen(preferred_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, creationflags=creation_flags)
            if process.stderr is not None:
                for line in process.stderr:
                    match = progress_re.search(line)
                    if match:
                        timestamp = match.group(1)
                        broadcast_progress(str(record_id), timestamp)
            else:
                logger.warning("FFmpeg stderr is None, no progress updates will be sent.")

            if os.path.exists(abs_output_path):
                logger.debug(f"Output file created: {abs_output_path}")
                output_path = self.transcode_to_mp4(abs_output_path, record_id)
                logger.debug(f"Transcoded output path: {output_path}")
                if os.path.exists(output_path):
                    logger.debug("Recording and transcoding successful.")
                    return True
                else:
                    logger.critical("Transcoded file missing.")
                    return False
            else:
                logger.critical(f"Output file missing or too small: {abs_output_path}")
                return False
        except Exception as e:
            import traceback
            logger.critical(f"Exception running FFmpeg: {e}\n{traceback.format_exc()}")
            return False

# Try
if __name__ == "__main__":
    # Example usage
    ip = "192.168.29.108"
    stream = "cam1"
    rtsp = RTSPObject(f"rtsp://{ip}/{stream}")
    # Try recording for 1 minute and save to output.mp4
    try:
        rtsp.record(1, "output", "1")
    except Exception as e:
        logger.debug(f"Exception during recording: {e}")
        pass
