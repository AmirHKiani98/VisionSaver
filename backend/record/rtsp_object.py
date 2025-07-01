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
        Record the RTSP stream for a specified duration and save it to a file.
        Dynamically sets the frame size and checks the first frame.
        :param duration: Duration in seconds to record the stream.
        :param output_file: The file path where the recorded video will be saved.
        """
        if not self.cap.isOpened():
            raise RuntimeError("RTSP stream is not open.")
        # Read the first frame to get frame size
        first_frame = self.read_frame()
        if first_frame is None:
            raise RuntimeError("Could not read first frame from RTSP stream.")
        height, width = first_frame.shape[:2]
        fourcc = cv2.VideoWriter.fourcc(*'XVID')
        out = cv2.VideoWriter(output_file, fourcc, 20.0, (width, height))
        start_time = cv2.getTickCount()
        elapsed_time = 0
        while elapsed_time <= duration*60: # Duration is in minutes.
            frame = first_frame if elapsed_time == 0 else self.read_frame()
            if frame is None:
                print("Stream ended or frame not available.")
                break
            out.write(frame)
            elapsed_time = (cv2.getTickCount() - start_time) / cv2.getTickFrequency()

        out.release()

# Try
if __name__ == "__main__":
    # Example usage
    ip = "192.168.29.108"
    stream = "cam1"
    rtsp = RTSPObject(f"rtsp://{ip}/{stream}")
    # Try recording for 10 seconds and save to output.avi
    try:
        rtsp.record(10, "output.avi")
        print("Recording completed successfully.")
    except Exception as e:
        print(f"An error occurred: {e}")
