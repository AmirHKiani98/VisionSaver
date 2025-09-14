from django.test import TestCase
from ai.detection_algorithms.algorithm import DetectionAlgorithm
import logging
import dotenv
from django.conf import settings
import os
from ai.counter.model.main import count_function, get_line_types, line_points_to_xy
import cv2
import pandas as pd
from ai.car import Car
from ai.models import DetectionLines, AutoDetection
import time
logging.getLogger('ultralytics').setLevel(logging.WARNING)
dotenv.load_dotenv(settings.ENV_PATH)
class AiAppTestCase(TestCase):
    """
    Template test case for the 'ai' Django app.
    """
    def setUp(self):
        """
        Set up the test case with necessary configurations.
        """
        self.record_id = 5
        self.divide_time = 0.1
        self.video_time = 45 # in seconds. There is a white SUV car going left to right at that time
        # Load the video
        self.video_path = f"{settings.MEDIA_ROOT}/{self.record_id}.mp4"
        self.video_capture = cv2.VideoCapture(self.video_path)
        if not self.video_capture.isOpened():
            self.video_path = f"{settings.MEDIA_ROOT}/{self.record_id}.mkv"
            self.video_capture = cv2.VideoCapture(self.video_path)
        if not self.video_capture.isOpened():
            raise ValueError(f"Could not open the video file {self.video_path}.")
        self.frame_count = int(self.video_capture.get(cv2.CAP_PROP_FRAME_COUNT))
        self.fps = self.video_capture.get(cv2.CAP_PROP_FPS)
        self.duration = self.frame_count / self.fps if self.fps > 0 else 0
        self.video_height = int(self.video_capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
        self.video_width = int(self.video_capture.get(cv2.CAP_PROP_FRAME_WIDTH))
        # Calculate the frame number corresponding to the specified video time
        self.target_frame_number = int(self.video_time * self.fps)
        if self.target_frame_number >= self.frame_count:
            raise ValueError(f"Target frame number {self.target_frame_number} exceeds total frame count {self.frame_count}.")
        # Set the video capture to the target frame
        self.video_capture.set(cv2.CAP_PROP_POS_FRAMES, self.target_frame_number)
        # Read the frame
        ret, self.frame = self.video_capture.read()
        if not ret:
            raise ValueError(f"Could not read frame at {self.video_time} seconds (frame {self.target_frame_number}).")

        self.detection_lines = DetectionLines.objects.get_or_create(record_id=self.record_id)[0]

        if not self.detection_lines:
            raise ValueError(f"No detection lines found for record ID {self.record_id}")
        
        
        


    def get_get_detection_progress(self, version: str) -> str:
        """
        Helper method to get detection progress.
        """
        return f'detection_progress_{self.record_id}_{self.divide_time}_{version}'

    def test_detect_version_v1(self):        
        """
        Test the CarDetection class with version v1.
        """
        return # Tested
        version = 'v1'
        detection_algorithm = DetectionAlgorithm(record_id=self.record_id, divide_time=self.divide_time, version=version)
        da = detection_algorithm.run()
        print(da)
    
    def test_detect_version_v2(self):
        """
        Test the CarDetection class with version v2.
        """
        return # Tested
        # verson = 'v2'
        # detection_algorithm = DetectionAlgorithm(record_id=self.record_id, divide_time=self.divide_time, version=verson)
        # da = detection_algorithm.run()
        # print(da)
    
    def test_depict_the_points(self):
        """
        Test depicting points on the frame.
        """
        lines = self.detection_lines.lines
        for key, list_of_points in lines.items():
            for dictionary_of_points in list_of_points:
                points = dictionary_of_points['points']
                points = line_points_to_xy(points, self.video_width, self.video_height)
                for point in points:
                    cv2.circle(self.frame, point, 5, (0, 255, 0), -1)
                print(f"Line {key} ")
        cv2.imshow("Frame with Points", self.frame)
        cv2.waitKey(0)
        # Passed and just fine


    def test_get_line_types(self):
        """
        Test the get_line_types function.
        """
        lines = self.detection_lines.lines
        key_of_interest = 'through'
        list_of_points = lines[key_of_interest][0]['points']
        points = line_points_to_xy(list_of_points, self.video_width, self.video_height)
        tolerance = 0.1
        line_types_info = get_line_types(points, tolerance)
        print(f"Line types for line '{key_of_interest}': {line_types_info}")

    def test_depict_the_detections(self):
        """
        Test depicting detections on the frame.
        """
        aut = AutoDetection.objects.filter(
            record_id=self.record_id, divide_time=self.divide_time, version="v1"
        ).first() # We are using v1 detection for counting now. This can be changed to v2 if needed
        if not aut:
            raise ValueError("No auto detection found for this record with the specified divide_time and version")
        df_file_path = aut.file_name # type: ignore
        if not os.path.exists(df_file_path):
            raise FileNotFoundError(f"The file {df_file_path} does not exist.")
        df = pd.read_csv(df_file_path)

        if df.empty:
            raise ValueError("The detection dataframe is empty.")
        print(f"Dataframe loaded with {len(df)} rows.")
        # Find the closest time to self.video_time
        df['time_diff'] = df["time"] - self.video_time
        closest_row = df.loc[df['time_diff'].abs().idxmin()]
        time = closest_row['time']
        grouped = df[df['time'] == time]
        for index, row in grouped.iterrows():
            x1, y1, x2, y2 = int(row['x1']), int(row['y1']), int(row['x2']), int(row['y2'])
            cv2.rectangle(self.frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(self.frame, f"ID: {row['track_id']}", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        cv2.imshow("Frame with Detections", self.frame)
        cv2.waitKey(0)
        # Passed and just fine
    
    def test_modifier_v2(self):
        """
        Test the modifier function in v2.
        """
        from ai.detection_modifier_algorithms.v2.model import modifier
        prev_results = [
            {'track_id': 1, 'time': 1.0, 'x1': 100, 'y1': 100, 'x2': 200, 'y2': 200, 'cls_id': 0, 'confidence': 0.9},
            {'track_id': 2, 'time': 1.0, 'x1': 300, 'y1': 300, 'x2': 400, 'y2': 400, 'cls_id': 0, 'confidence': 0.8},
            {'track_id': 3, 'time': 1.0, 'x1': 500, 'y1': 500, 'x2': 600, 'y2': 600, 'cls_id': 0, 'confidence': 0.85},
        ]
        
        results = [
            {'track_id': 4, 'time': 2.0, 'x1': 105, 'y1': 105, 'x2': 205, 'y2': 205, 'cls_id': 0, 'confidence': 0.92},
            {'track_id': 5, 'time': 2.0, 'x1': 305, 'y1': 305, 'x2': 405, 'y2': 405, 'cls_id': 0, 'confidence': 0.82},
            {'track_id': 6, 'time': 2.0, 'x1': 700, 'y1': 700, 'x2': 800, 'y2': 800, 'cls_id': 0, 'confidence': 0.88},
        ]
        modified = modifier(results, prev_results)
        assert modified[0]['track_id'] == 1  # Should match with prev_results[0]
        assert modified[1]['track_id'] == 2  # Should match with prev_results[1]
        assert modified[2]['track_id'] == 6  # No match, should remain the sameren


    def test_counter(self):
        """
        Test the Counter class.
        """
        aut = AutoDetection.objects.filter(
            record_id=self.record_id, divide_time=self.divide_time, version="v1"
        ).first() # We are using v1 detection for counting now. This can be changed to v2 if needed
        if not aut:
            raise ValueError("No auto detection found for this record with the specified divide_time and version")
        df_file_path = aut.file_name # type: ignore
        if not os.path.exists(df_file_path):
            raise FileNotFoundError(f"The file {df_file_path} does not exist.")
        df = pd.read_csv(df_file_path)

        if df.empty:
            raise ValueError("The detection dataframe is empty.")
        print(f"Dataframe loaded with {len(df)} rows.")
        # Find the closest time to self.video_time
        df['time_diff'] = df["time"] - self.video_time
        closest_row = df.loc[df['time_diff'].abs().idxmin()]
        time = closest_row['time']
        grouped = df[df['time'] == time]
        print(f"Closest time in dataframe: {time} with {len(grouped)} entries.")
        line_types = {}
        for key, list_of_points in self.detection_lines.lines.items():
            line_types[key] = []
            for dictionary_of_points in list_of_points:
                points = dictionary_of_points['points']
                points = line_points_to_xy(points, self.video_width, self.video_height)
                tolerance = 0.1
                line_types[key].append(get_line_types(points, tolerance))
        
        for index, row in grouped.iterrows():
            x1, y1, x2, y2 = int(row['x1']), int(row['y1']), int(row['x2']), int(row['y2'])
            in_area, line_idx = count_function(x1, y1, x2, y2, line_types)
            color = (255, 0, 0) if in_area else (0, 255, 0)
            cv2.rectangle(self.frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(self.frame, f"ID: {row['track_id']} Line: {line_idx}", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
        cv2.imshow("Frame with Counting", self.frame)
        cv2.waitKey(0)
        
    def test_detection_algorithm_read(self):
        """
        Test the DetectionAlgorithm class.
        """
        detection_lines = DetectionLines.objects.filter(record_id=self.record_id).first()
        if not detection_lines:
            raise ValueError(f"No detection lines found for record ID {self.record_id}")
        
        detection_algorithm = DetectionAlgorithm(record_id=self.record_id, divide_time=self.divide_time, version='v2', lines=detection_lines, detection_time=self.video_time, debug=False)
        print(len(detection_algorithm.zones["through"])) # type: ignore
        for _i in range(20): # Read 5 frames
            results = detection_algorithm.read()
            frame = detection_algorithm.frame
            
            if isinstance(detection_algorithm.detection_time, (int, float)):
                detection_algorithm.detection_time += 0.1
            if frame is not None:
                if results is not None:
                    for obj in results:
                        x1, y1, x2, y2 = (obj['x1']), (obj['y1']), (obj['x2']), (obj['y2'])
                        x1 *= self.video_width
                        x2 *= self.video_width
                        y1 *= self.video_height
                        y2 *= self.video_height
                        x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
                        if obj.get('in_area'):
                            color = (255, 0, 0) if obj['in_area'] else (0, 255, 0)
                        else:
                            color = (0, 255, 0)
                        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                        cv2.putText(frame, f"ID: {obj['track_id']}", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                cv2.imshow("Frame from DetectionAlgorithm", frame)
                time.sleep(0.1)
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
            
    

    def test_detection_algorithm_run(self):
        """
        Test the DetectionAlgorithm class.
        """
        try:
            detection_lines = DetectionLines.objects.filter(record_id=self.record_id).first()
            if not detection_lines:
                raise ValueError(f"No detection lines found for record ID {self.record_id}")
            
            # Set a low frame limit to prevent memory issues
            detection_algorithm = DetectionAlgorithm(
                record_id=self.record_id, 
                divide_time=self.divide_time, 
                version='v2', 
                lines=detection_lines, 
            )
            
            # Run the detection algorithm
            results = detection_algorithm.run()
            
            # Verify we got some results
            self.assertIsNotNone(results)
        except Exception as e:
            # Print detailed error information
            import traceback
            traceback.print_exc()
            self.fail(f"Test failed with exception: {e}")
        finally:
            # Clean up resources
            if 'detection_algorithm' in locals() and hasattr(detection_algorithm, 'video'):
                detection_algorithm.video.release()
            
            # Clear Car registry to prevent memory leaks
            Car.all_cars_available.clear()
            
            # Force garbage collection
            import gc
            gc.collect()

    
        
        
            
            