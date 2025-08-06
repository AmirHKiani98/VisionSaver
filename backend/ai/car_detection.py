import os
import cv2
import numpy as np
import pandas as pd
from ai.car import Car
from django.conf import settings
from ai.deepsort.nn_matching import NearestNeighborDistanceMetric
from ai.deepsort.tracker import Tracker
logger = settings.APP_LOGGER


# from deep_sort_realtime.deepsort_tracker import DeepSort
class CarDetection():
    
    def __init__(self, model, video_path, divide_time=1.0, tracker_config=None):
        """
        Initialize the CarDetection instance.
        """
        self.results_df = None
        self.model = model
        metric = NearestNeighborDistanceMetric("cosine", matching_threshold=0.4, budget=100)
        self.tracker = Tracker(metric)
        self.load_video(video_path)
        
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
                    
                    objects.append({
                        'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2,
                        'confidence': float(conf),
                        'class_id': int(cls),
                        # 'car_image': image[int(y1):int(y2), int(x1):int(x2)]
                    })
                    detections.append(([x1, y1, x2, y2], float(conf), 'vehicle'))
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
        # Hash the name of the video
        video_name = os.path.basename(self.video_path)
        hash_name = hash(video_name)
        output_path = os.path.join(settings.MEDIA_ROOT,  str(hash_name) + '.csv')
        if os.path.exists(output_path):
            logger.info(f"Loading existing results from {output_path}")
            df = pd.read_csv(output_path)
            self.results_df = df
            return df
        times_cars = {}
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
                    # 'confidence': obj.get('confidence', 0.0),
                    # 'class_id': obj.get('class_id', 0)
                }])
                df = pd.concat([df, new_row], ignore_index=True)

        self.results_df = df
        df.to_csv(output_path, index=False)
        return df

    def _is_both_images_same_car_abs_difference(self, image1, image2, threshold=0.8):
        """
        Compare two images to check if they are of the same car.
        Uses a simple pixel-wise comparison.
        """
        # Find the smaller image
        width = min(image1.shape[1], image2.shape[1])
        height = min(image1.shape[0], image2.shape[0])
        image1_resized = cv2.resize(image1, (width, height))
        image2_resized = cv2.resize(image2, (width, height))
        # Calculate absolute difference
        diff = cv2.absdiff(image1_resized, image2_resized)
        gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
        # number of items smaller than the threshold
        num_diff = np.sum(gray < (255 * (1 - threshold)))
        total_pixels = width * height
        # Calculate the percentage of different pixels
        percentage_diff = num_diff / total_pixels
        if percentage_diff < (1 - threshold):
            logger.info("Images are of the same car.")
            return True
        else:
            logger.info("Images are of different cars.")
            return False
        
        
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
    
    # def run_tracker(self):
    #     """
    #     Run detection on a specific timestamp.
    #     """
    #     if self.results_df is None:
    #         logger.error("Results DataFrame is empty. Please run get_results_from_video first.")
    #         return None
    #     if self.results_df.empty:
    #         logger.error("Results DataFrame is empty. No detections found.")
    #         return None
    #     self.results_df['time'] = self.results_df['time'].astype(float)
    #     self.results_df = self.results_df.sort_values(by='time').reset_index(drop=True)

    #     timestamp = None
    #     next_timestamp = None

    #     time_groups = self.results_df.groupby('time')
    #     if len(time_groups) == 0:
    #         logger.error("No time groups found in results DataFrame.")
    #         return None
    #     # Process each group of results
    #     for name, group in time_groups:
    #         logger.info(f"Processing group: {name}")
    #         time = name
    #         frame = self.get_image_from_timestamp(time)
            
    #         for index, row in group.iterrows():
    #             timestamp = row['time']
                
 
