import os
import cv2


from django.conf import settings
logger = settings.APP_LOGGER
from deep_sort_realtime.deepsort_tracker import DeepSort
class CarDetection():
    
    def __init__(self, model, video_path, divide_time=1, tracker_config=None):
        """
        Initialize the CarDetection instance.
        """
        self.model = model
        self.results = {}
        self.load_video(video_path)
        if tracker_config is not None:
            self.tracker = DeepSort(**tracker_config)
        else:
            self.tracker = DeepSort(max_age=5)
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


    def detect_and_track(self, image):
        """
        detect the cars inside a cv2 image
        """
        detections = []
        results = self.model(image)[0]
        objects_of_interest = [2, 3, 5, 7]

        if hasattr(results, 'boxes') and results.boxes is not None:
            for box, cls, conf in zip(results.boxes.xyxy, results.boxes.cls, results.boxes.conf):
                if int(cls) in objects_of_interest:
                    x1, y1, x2, y2 = map(float, box)
                    detections.append(([x1, y1, x2 - x1, y2 - y1], float(conf), 'vehicle'))
    
        tracks = self.tracker.update_tracks(detections, frame=image)
        output = []
        for track in tracks:
            if not track.is_confirmed():
                
                continue
 
            track_id = track.track_id
            x, y, w, h = track.to_ltrb()
            output.append({
                'id': track_id,
                'x1': x,
                'y1': y,
                'x2': x + w,
                'y2': y + h,
                'center_x': x + w / 2,
                'center_y': y + h / 2,
            })
        return output
        

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
            data = self.detect_and_track(frame)

            self.results[i] = {
                'frame_number': frame_number,
                'objects': data
            }
            print(f"{self.results[i]['objects']}")
            # logger.info(f"Processed frame at {i} seconds: {i}")