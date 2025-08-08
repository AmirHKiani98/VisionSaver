import os
import cv2
import numpy as np
import pandas as pd
from ai.car import Car
from tqdm import tqdm
from django.conf import settings
from ai.deepsort.nn_matching import NearestNeighborDistanceMetric
from ai.deepsort.tracker import Tracker
from ai.deepsort.detection import Detection
import hashlib
import numpy as np
from sklearn.decomposition import PCA

logger = settings.APP_LOGGER


# from deep_sort_realtime.deepsort_tracker import DeepSort
class CarDetection():
    
    def __init__(self, model, video_path, divide_time=1.0, tracker_config=None, detection_lines={}):
        """
        Initialize the CarDetection instance.
        """
        self.results_df = None
        self.model = model
        metric = NearestNeighborDistanceMetric("cosine", matching_threshold=0.4, budget=100)
        self.tracker = Tracker(metric)
        self.load_video(video_path)
        self._get_line_type()
        logger.info(f"CarDetection initialized with model {model} and video {video_path}")
        self.results_df = None
        self.detection_lines = detection_lines
        self.tracker_config = tracker_config if tracker_config else {
            'max_age': 30,
            'min_hits': 3,
            'n_init': 3,
            'max_cosine_distance': 0.4,
            'nn_budget': 100
        }
        self.divide_time = divide_time
        
        
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
        self.width = int(self.video_capture.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.height = int(self.video_capture.get(cv2.CAP_PROP_FRAME_HEIGHT))


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
                    
                    objects.append({
                        'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2,
                        'confidence': float(conf),
                        'class_id': int(cls),
                        # 'car_image': image[int(y1):int(y2), int(x1):int(x2)]
                    })
                    # Convert from (x1, y1, x2, y2) to (x, y, w, h) format
                    w = x2 - x1
                    h = y2 - y1
                    tlwh = [x1, y1, w, h]
                    # Create a simple feature vector (placeholder)
                    feature = np.random.rand(128).astype(np.float32)
                    detections.append(Detection(tlwh, float(conf), feature))
        self.tracker.predict()
        self.tracker.update(detections)

        output = []
        for track in self.tracker.tracks:
            if not track.is_confirmed() or track.time_since_update > 1:
                continue
            tlwh = track.to_tlwh()
            x1, y1, w, h = tlwh
            x2, y2 = x1 + w, y1 + h
            output.append({
                'track_id': track.track_id,
                'x1': x1,
                'y1': y1,
                'x2': x2,
                'y2': y2
            })
        return output

        

    def get_results_from_video(self):
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
        df = pd.DataFrame(columns=['time', 'frame_number', "x1", "y1", "x2", "y2", 'track_id'])
        # Hash the name of the video
        video_name = os.path.basename(self.video_path)
        hash_name = hashlib.md5((video_name + str(self.divide_time)).encode()).hexdigest()
        output_path = os.path.join(settings.MEDIA_ROOT,  str(hash_name) + '.csv')
        if os.path.exists(output_path):
            logger.info(f"Loading existing results from {output_path}")
            df = pd.read_csv(output_path)
            self.results_df = df
            return df
        for i in tqdm(np.arange(0, self.duration, self.divide_time), total=int(self.duration/self.divide_time)):
            frame_number = int(i * fps)
            self.video_capture.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
            success, frame = self.video_capture.read()
            if (
                not success
                or frame is None
                or frame.shape[0] == 0
                or frame.shape[1] == 0
                or np.mean(frame) < 1  # type: ignore
            ):
                logger.warning(f"[Decode Error] Suspect frame at frame={frame_number}, time={i:.2f}s")
                continue
            data = self.detect_and_track(frame)
            
            for obj in data:
                new_row = pd.DataFrame([{
                    'time': i,
                    'frame_number': frame_number,
                    'track_id': obj['track_id'],
                    'x1': obj['x1'],
                    'y1': obj['y1'],
                    'x2': obj['x2'],
                    'y2': obj['y2'],
                    # 'confidence': obj.get('confidence', 0.0),
                    # 'class_id': obj.get('class_id', 0)
                }])
                df = pd.concat([df, new_row], ignore_index=True)

        self.results_df = df
        df.to_csv(output_path, index=False)
        return df

    
    def _calculate_angle(self, p1, p2, p3):
        # Vectors
        v1 = p1 - p2
        v2 = p3 - p2
        
        # Dot product and magnitudes
        dot_product = np.dot(v1, v2)
        magnitude_v1 = np.linalg.norm(v1)
        magnitude_v2 = np.linalg.norm(v2)
        
        # Angle in radians
        angle_rad = np.arccos(dot_product / (magnitude_v1 * magnitude_v2))
        
        # Convert to degrees
        angle_deg = np.degrees(angle_rad)
        
        return angle_deg

    def _get_line_type(self):
        """
        Determine the type of detection line based on the detection lines provided.
        """
        line_types = {}
        for line_key, lines in self.detection_lines.items():
            line_types[line_key] = []
            for line in lines:
                points = line['points']
                tuple_points = np.array([[x, y] for x, y in zip(points[0::2], points[1::2])])
                perpendicular_lines = 0
                for index in range(0, len(points), 3):
                    if index + 2 < len(points):
                        p1 = np.array(points[index])
                        p2 = np.array(points[index + 1])
                        p3 = np.array(points[index + 2])
                        angle = self._calculate_angle(p1, p2, p3)
                        if angle > 70:
                            perpendicular_lines += 1
                if perpendicular_lines >= 2:
                    rect_bbox = cv2.boundingRect(tuple_points)
                    line_types[line_key].append(['rectangle', rect_bbox])
                elif perpendicular_lines == 1:
                    line_types[line_key].append('intersection', [])
                elif perpendicular_lines == 1:
                    line_types[line_key].append('straight', [tuple_points[0], tuple_points[-1]])
        self.line_types = line_types
                
                
    
        
    def get_image_from_timestamp(self, timestamp):
        """
        Get an image from the video at a specific timestamp.
        """
        if not hasattr(self, 'video_capture'):
            logger.error("Video capture not initialized. Please load a video first.")
            raise RuntimeError("Video capture not initialized. Please load a video first.")
        fps = self.video_capture.get(cv2.CAP_PROP_FPS)
        frame_number = int(timestamp * fps)
        self.video_capture.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
        success, frame = self.video_capture.read()
        if not success:
            logger.error(f"Failed to read frame at {frame_number}.")
            return None
        return frame

