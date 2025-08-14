import os
import cv2
import numpy as np
import pandas as pd
from ai.car import Car
from django.conf import settings
from ai.deepsort.nn_matching import NearestNeighborDistanceMetric
from ai.deepsort.tracker import Tracker
from ai.deepsort.detection import Detection
import hashlib
import numpy as np
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from ai.models import AutoCounter
import json

logger = settings.APP_LOGGER


# from deep_sort_realtime.deepsort_tracker import DeepSort
class CarDetection():
    
    def __init__(self, model, record_id, divide_time=1.0, tracker_config=None, detection_lines={}, epsilon_magnitude=0.02):
        """
        Initialize the CarDetection instance.
        """
        self.results_df = None
        self.model = model
        metric = NearestNeighborDistanceMetric("cosine", matching_threshold=0.4, budget=100)
        self.tracker = Tracker(metric)
        self.record_id = record_id
        self.load_video(record_id)
        self.detection_lines = detection_lines
        #logger.info(f"CarDetection initialized with model {model} and record {record_id}")
        self.results_df = None
        
        self.tracker_config = tracker_config if tracker_config else {
            'max_age': 30,
            'min_hits': 3,
            'n_init': 3,
            'max_cosine_distance': 0.4,
            'nn_budget': 100
        }
        self.divide_time = divide_time
        
        
    def load_video(self, record_id):
        """
        Load a video file for car detection.
        
        :param video_path: Path to the video file.
        """
        video_path = os.path.join(settings.MEDIA_ROOT, f"{record_id}.mp4")
        if not os.path.isfile(video_path):
            video_path = os.path.join(settings.MEDIA_ROOT, f"{record_id}.mkv")
            if not os.path.isfile(video_path):
                #logger.error(f"Video file not found: {video_path}")
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

        

    def run(self):
        logger.info(f"[CarDetection.run] Starting run for record_id={self.record_id}, divide_time={self.divide_time}, video_path={self.video_path}")

        # -------------- Basic capture checks --------------
        if not hasattr(self, 'video_capture'):
            logger.error("Video capture not initialized. Please load a video first.")
            raise RuntimeError("Video capture not initialized. Please load a video first.")

        if not self.video_capture.isOpened():
            logger.error(f"cv2.VideoCapture failed to open: {self.video_path}")
            raise RuntimeError(f"Failed to open video: {self.video_path}")

        fps = float(self.video_capture.get(cv2.CAP_PROP_FPS)) or 0.0
        frame_count = int(self.video_capture.get(cv2.CAP_PROP_FRAME_COUNT)) or 0
        if fps <= 0.0:
            logger.error(f"Invalid FPS ({fps}). Cannot extract frames.")
            raise ValueError("Invalid FPS value. Cannot extract frames.")
        duration_sec = frame_count / fps
        self.duration = int(duration_sec)
        self.width = int(self.video_capture.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.height = int(self.video_capture.get(cv2.CAP_PROP_FRAME_HEIGHT))

        logger.info(f"[CarDetection.run] Video opened. fps={fps:.3f}, frames={frame_count}, duration={duration_sec:.2f}s, size=({self.width}x{self.height})")

        # -------------- Output path, with lock + atomic writes --------------
        video_name = os.path.basename(self.video_path)
        hash_name = hashlib.md5((video_name + str(self.divide_time)).encode()).hexdigest()
        output_path = os.path.join(settings.MEDIA_ROOT, f"{hash_name}.csv")
        tmp_path = output_path + ".tmp"
        lock_path = output_path + ".lock"

        logger.debug(f"[CarDetection.run] Output path for results: {output_path}")

        # Acquire simple file lock
        try:
            lock_fd = os.open(lock_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            os.write(lock_fd, str(os.getpid()).encode())
            os.close(lock_fd)
            have_lock = True
            logger.debug(f"[CarDetection.run] Acquired lock: {lock_path}")
        except FileExistsError:
            have_lock = False
            logger.info(f"[CarDetection.run] Another process/thread is working (lock present: {lock_path}). Will not start a duplicate run.")
            # Optionally: send a progress ping here.
            return self.results_df if self.results_df is not None else pd.DataFrame(
                columns=['time','frame_number','x1','y1','x2','y2','track_id']
            )

        def remove_lock():
            try:
                if have_lock and os.path.exists(lock_path):
                    os.remove(lock_path)
                    logger.debug(f"[CarDetection.run] Removed lock: {lock_path}")
            except Exception as e:
                logger.warning(f"[CarDetection.run] Failed to remove lock {lock_path}: {e}")

        try:
            # If an existing file is there but empty/bad, ignore it.
            exists = os.path.exists(output_path)
            size = os.path.getsize(output_path) if exists else 0
            logger.info(f"[CarDetection.run] Existing results? exists={exists}, size={size} bytes")

            if exists and size > 0:
                try:
                    logger.info(f"[CarDetection.run] Loading existing results from {output_path}")
                    auto_count, _ = AutoCounter.objects.get_or_create(
                        record_id=self.record_id,
                        file_name=output_path,
                        divide_time=self.divide_time
                    )
                    df = pd.read_csv(output_path)
                    self.results_df = df
                    channel_layer = get_channel_layer()
                    group_name = f"counter_progress_{self.record_id}"
                    if channel_layer is not None:
                        async_to_sync(channel_layer.group_send)(
                            group_name,
                            {"type": "send.progress", "progress": 100.00}
                        )
                    else:
                        logger.warning("Channel layer is not configured; skipping progress notification.")
                    return df
                except pd.errors.EmptyDataError:
                    logger.warning(f"[CarDetection.run] Existing CSV is empty. Will recompute: {output_path}")
                except pd.errors.ParserError as e:
                    logger.warning(f"[CarDetection.run] ParserError on existing CSV. Will recompute. Error: {e}")
                except OSError as e:
                    logger.warning(f"[CarDetection.run] OSError reading existing CSV. Will recompute. Error: {e}")

            # -------------- Process video --------------
            logger.info(f"[CarDetection.run] Processing video for car detection and tracking with divide_time={self.divide_time}s "
                        f"and duration={self.duration}s and {len(np.arange(0, self.duration, self.divide_time))} steps")

            df = pd.DataFrame(columns=['time', 'frame_number', 'x1', 'y1', 'x2', 'y2', 'track_id'])
            channel_layer = get_channel_layer()
            group_name = f"counter_progress_{self.record_id}"

            for i in np.arange(0, self.duration, self.divide_time):
                frame_number = int(i * fps)

                # Progress
                progress = round((i / max(self.duration, 1)) * 100, 2)
                if channel_layer is not None:
                    try:
                        logger.debug(f"[CarDetection.run] Sending progress update: {progress}%")
                        async_to_sync(channel_layer.group_send)(group_name, {"type": "send.progress", "progress": progress})
                    except Exception as e:
                        logger.warning(f"[CarDetection.run] Failed to send progress: {e}")

                logger.info(f"[CarDetection.run] Processing time={i:.2f}s, frame_number={frame_number}")

                # Seek & read frame
                self.video_capture.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
                success, frame = self.video_capture.read()
                if (not success) or frame is None or frame.size == 0 or np.mean(frame) < 1:
                    logger.warning(f"[CarDetection.run] Suspect frame at frame={frame_number}, time={i:.2f}s")
                    continue

                try:
                    data = self.detect_and_track(frame)
                except Exception as e:
                    logger.exception(f"[CarDetection.run] detect_and_track failed at time={i:.2f}s frame={frame_number}: {e}")
                    continue

                if not data:
                    continue

                rows = [{
                    'time': float(i),
                    'frame_number': frame_number,
                    'track_id': obj['track_id'],
                    'x1': float(obj['x1']), 'y1': float(obj['y1']),
                    'x2': float(obj['x2']), 'y2': float(obj['y2']),
                } for obj in data]
                df = pd.concat([df, pd.DataFrame(rows)], ignore_index=True)

            self.results_df = df

            # Record DB (don’t fail the run if DB hiccups)
            try:
                AutoCounter.objects.get_or_create(
                    record_id=self.record_id,
                    file_name=output_path,
                    divide_time=self.divide_time
                )
            except Exception as e:
                logger.warning(f"[CarDetection.run] AutoCounter get_or_create failed: {e}")

            # Atomic write
            logger.info(f"[CarDetection.run] Saving results atomically to {output_path}")
            try:
                df.to_csv(tmp_path, index=False)
                os.replace(tmp_path, output_path)  # atomic on Windows NTFS and POSIX
            finally:
                if os.path.exists(tmp_path):
                    try:
                        os.remove(tmp_path)
                    except Exception:
                        pass

            # Final 100% ping
            if channel_layer is not None:
                try:
                    async_to_sync(channel_layer.group_send)(group_name, {"type": "send.progress", "progress": 100.0})
                except Exception as e:
                    logger.warning(f"[CarDetection.run] Failed to send final progress: {e}")

            return df

        finally:
            remove_lock()


    

    

    # def draw_lines(self):
    #     """
    #     Draw detection lines on the image for visualization.
    #     """
    #     # Get the image in the first second
    #     image = self.get_image_from_timestamp(1.0)
    #     if image is None:
    #         #logger.error("Failed to retrieve image for drawing lines.")
    #         return
    #     for line_key, lines in self.line_types.items():
    #         for index, line in enumerate(lines):
    #             if line[0] == 'closed':
    #                 x, y, w, h = line[1]
    #                 pt1 = (int(x * self.width), int(y * self.height))
    #                 pt2 = (int((x + w) * self.width), int((y + h) * self.height))
    #                 cv2.rectangle(image, pt1, pt2, (0, 255, 0), 2)
    #             if line[0] == 'straight':
    #                 x1, y1 = line[1][0]
    #                 x2, y2 = line[1][1]
    #                 pt1 = (int(x1 * self.width), int(y1 * self.height))
    #                 pt2 = (int(x2 * self.width), int(y2 * self.height))
    #                 cv2.line(image, pt1, pt2, (255, 0, 0), 2)
    #     # Show the image
    #     cv2.imshow('Detection Lines', image)
    #     cv2.waitKey(0)
        
    def get_image_from_timestamp(self, timestamp):
        """
        Get an image from the video at a specific timestamp.
        """
        if not hasattr(self, 'video_capture'):
            #logger.error("Video capture not initialized. Please load a video first.")
            raise RuntimeError("Video capture not initialized. Please load a video first.")
        fps = self.video_capture.get(cv2.CAP_PROP_FPS)
        frame_number = int(timestamp * fps)
        self.video_capture.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
        success, frame = self.video_capture.read()
        if not success:
            #logger.error(f"Failed to read frame at {frame_number}.")
            return None
        return frame

