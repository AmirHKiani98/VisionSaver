"""
Making an RTSP object for handling RTSP streams in a Django application.
"""
import cv2
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
    
    def record(self, duration: int, output_file: str):
        """
        Record the RTSP stream for a specified duration in seconds.
        Saves to output_file using mp4v codec and 20 fps.
        """
        if not self.cap.isOpened():
            raise RuntimeError("RTSP stream is not open.")
        
        # Try to read first frame to get size
        first_frame = self.read_frame()
        if first_frame is None:
            raise RuntimeError("Could not read first frame from RTSP stream.")
        
        height, width = first_frame.shape[:2]
        fourcc = cv2.VideoWriter.fourcc(*'mp4v')
        out = cv2.VideoWriter(output_file, fourcc, 20.0, (width, height))

        print(f"Recording {duration}s to {output_file}...")
        start_time = cv2.getTickCount()
        elapsed_time = 0
        frame_interval = 1.0 / 20.0  # 20 FPS
        import time

        while elapsed_time <= duration * 60:
            frame = self.read_frame()
            if frame is None:
                print("Stream ended or frame not available.")
                break
            out.write(frame)
            time.sleep(frame_interval)  # Avoid writing too fast
            elapsed_time = (cv2.getTickCount() - start_time) / cv2.getTickFrequency()
        
        out.release()
        print("Recording finished.")

# Try
if __name__ == "__main__":
    # Example usage
    ip = "192.168.29.108"
    stream = "cam1"
    rtsp = RTSPObject(f"rtsp://{ip}/{stream}")
    # Try recording for 1 minute and save to output.mp4
    try:
        rtsp.record(1, "output.mp4")
        print("Recording completed successfully.")
    except Exception as e:
        print(f"An error occurred: {e}")
