import os
import cv2
import numpy as np
import pandas as pd

from django.conf import settings
logger = settings.APP_LOGGER
from deep_sort_realtime.deepsort_tracker import DeepSort
class CarDetection():
    
    def __init__(self, model, video_path, divide_time=1.0, tracker_config=None):
        """
        Initialize the CarDetection instance.
        """
        self.results_df = None
        self.model = model
        self.load_video(video_path)
        if tracker_config is not None:
            self.tracker = DeepSort(**tracker_config)
        else:
            self.tracker = DeepSort(max_age=5)
        logger.info(f"CarDetection initialized with model {model} and video {video_path}")
        self.results_df = None
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
        Detect and track vehicles in the frame.
        Returns list of tracked objects with bounding boxes and track IDs.
        """
        detections = []
        results = self.model(image)[0]
        objects_of_interest = [2, 3, 5, 7]
        objects = []
        if hasattr(results, 'boxes') and results.boxes is not None:
            for box, cls, conf in zip(results.boxes.xyxy, results.boxes.cls, results.boxes.conf):
                if int(cls) in objects_of_interest:
                    x1, y1, x2, y2 = map(float, box)
                    # AVG RGB
                    avg_rgb = self.average_rgb(image, [x1, y1, x2, y2])
                    
                    objects.append({
                        'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2,
                        'avg_r': avg_rgb[0] if avg_rgb else None,
                        'avg_g': avg_rgb[1] if avg_rgb else None,
                        'avg_b': avg_rgb[2] if avg_rgb else None,
                        'confidence': float(conf),
                        'class_id': int(cls),
                    })
                    detections.append(([x1, y1, x2, y2], float(conf), 'vehicle'))
        return objects
        # Pass detections to tracker
        tracks = self.tracker.update_tracks(detections, frame=image)

        # Extract tracked objects
        tracked_objects = []
        for track in tracks:
            if not track.is_confirmed():
                continue
            track_id = track.track_id
            tlwh = [float(x) for x in track.to_tlwh()]
            # Find the YOLO box that matches this track (you may need to keep a mapping)
            # For simplicity, let's assume you can get the last YOLO box for this track
            # You need to implement this mapping logic in your pipeline
            yolo_box = track.last_detection_box if hasattr(track, 'last_detection_box') else None
            if yolo_box is not None:
                x1, y1, x2, y2 = map(int, yolo_box)
                checked = "yolo"
            else:
                # fallback to tracker box if YOLO box is not available
                x1, y1, w, h = map(int, tlwh)
                x2, y2 = x1 + w, y1 + h
                checked = "tracker"
            tracked_objects.append({
                'track_id': track_id,
                'label': 'vehicle',
                'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2,
                'checked': checked
            })
        return tracked_objects

        

    def get_results_from_video(self, divide_time=1.0):
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
        df = pd.DataFrame(columns=['time', 'frame_number', "x1", "y1", "x2", "y2", "confidence", "class_id"])
        for i in np.arange(0, self.duration, divide_time):
            print(f"Progress : {round((i/self.duration) * 10000)/100}%")
            frame_number = int(i * fps)
            self.video_capture.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
            success, frame = self.video_capture.read()
            if not success:
                logger.warning(f"Failed to read frame at {frame_number}. Skipping.")
                continue
            data = self.detect_and_track(frame)
            for obj in data:
                new_row = pd.DataFrame([{
                    'time': i,
                    'frame_number': frame_number,
                    'x1': obj['x1'],
                    'y1': obj['y1'],
                    'x2': obj['x2'],
                    'y2': obj['y2'],
                    'confidence': obj.get('confidence', 0.0),
                    'class_id': obj.get('class_id', 0)
                }])
                df = pd.concat([df, new_row], ignore_index=True)

        self.results_df = df
        return df

    def average_rgb(self, frame, bbox) -> list[float] | None:
        """
        Calculate the average RGB values of the bbox inside a frame.
        :param frame: The video frame as a numpy array.
        :param bbox: Bounding box in the format [x1, y1, x2, y2].
        """
        x1, y1, x2, y2 = map(int, bbox)
        if x1 < 0 or y1 < 0 or x2 > frame.shape[1] or y2 > frame.shape[0]:
            logger.error("Bounding box is out of frame bounds.")
            return None
        roi = frame[y1:y2, x1:x2]
        if roi.size == 0:
            logger.warning("Region of interest is empty.")
            return None
        avg_color = cv2.mean(roi)[:3]
        return [avg_color[2], avg_color[1], avg_color[0]] # [R, G, B] order
        
        
        