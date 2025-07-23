import os
import cv2


from django.conf import settings
logger = settings.APP_LOGGER

class CarDetection():
    
    def __init__(self, model, video_path, divide_time=1):
        """
        Initialize the CarDetection instance.
        """
        self.model = model
        self.results = {} # {time: data of the cars}, time = time into the video
        self.load_video(video_path)
        logger.info(f"CarDetection initialized with model {model} and video {video_path}")
        self.get_results_from_video(divide_time)
        
    def load_video(self, video_path):
        """
        Load a video file for car detection.
        
        :param video_path: Path to the video file.
        """
        if not os.path.isfile(video_path):
            logger.error(f"Video file not found: {video_path}")
            raise FileNotFoundError(f"Video file not found: {video_path}")
        self.video_path = video_path
        self.video_capture = cv2.VideoCapture(video_path)
        self.duration = int(self.video_capture.get(cv2.CAP_PROP_FRAME_COUNT) / self.video_capture.get(cv2.CAP_PROP_FPS))
    
    @staticmethod
    def detect_cars(image, model):
        """
        detect the cars inside a cv2 image
        """
        results = model(image)[0]
        # Only keep detections labeled as 'car'
        data = []
        objects_of_interest = [2, 3, 5, 7] # ["car", "motorcycle", "bus", "truck"] in coco8
        if hasattr(results, 'boxes') and results.boxes is not None:
            xyxy = results.boxes.xyxy
            classes = results.boxes.cls
            
            for index, box in enumerate(xyxy):
                if classes[index] in objects_of_interest:
                    x1, y1, x2, y2 = box
                    center_x = (x1 + x2) // 2
                    center_y = (y1 + y2) // 2
                    confidence = float(results.boxes.conf[index]) if hasattr(results.boxes, 'conf') else None
                    data.append({
                        'x1': x1,
                        'y1': y1,
                        'x2': x2,
                        'y2': y2,
                        'center_x': center_x,
                        'center_y': center_y,
                        'confidence': confidence
                    })
        return data
        

    def get_results_from_video(self, divide_time=1):
        """
        Extract images from the video at specified intervals.
        """
        # if video_capture is not in self raise error
        if not hasattr(self, 'video_capture'):
            logger.error("Video capture not initialized. Please load a video first.")
            raise RuntimeError("Video capture not initialized. Please load a video first.")
        fps = self.video_capture.get(cv2.CAP_PROP_FPS)
        if fps <= 0:
            logger.error("Invalid FPS value. Cannot extract frames.")
            raise ValueError("Invalid FPS value. Cannot extract frames.")
        
        for i in range(0, int(self.duration), divide_time):
            frame_number = int(i * fps)
            self.video_capture.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
            success, frame = self.video_capture.read()
            if not success:
                logger.warning(f"Failed to read frame at {frame_number}. Skipping.")
                continue
            data = self.detect_cars(frame, self.model)
            self.results[i] = data
            # logger.info(f"Processed frame at {i} seconds: {i}")