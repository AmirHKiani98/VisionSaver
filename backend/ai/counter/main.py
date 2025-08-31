import os
import pandas as pd
import cv2
import numpy as np
from shapely.geometry import LineString, Polygon, Point
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from ai.models import AutoCount, ModifiedAutoDetection, AutoDetection, DetectionLines
from django.conf import settings
from multiprocessing import Pool, cpu_count
logger = settings.APP_LOGGER
class Counter:

    def __init__(self, record_id, divide_time, version) -> None:
        self.record_id = record_id
        self.divide_time = divide_time
        self.version = version
        modified_auto_detection = ModifiedAutoDetection.objects.filter(record_id=record_id, divide_time=divide_time, version=version).first()
        if not modified_auto_detection:
            auto_detection = AutoDetection.objects.filter(record_id=record_id, divide_time=divide_time, version=version).first()
            if not auto_detection:
                raise ValueError("No auto detection found for this record with the specified divide_time and version")
            df_file_path = auto_detection.file_name
        else:
            df_file_path = modified_auto_detection.file_name
        self.df_file_path = df_file_path

        if not os.path.exists(self.df_file_path):
            ##print(f"DEBUG: File not found: {self.df_file_path}")
            raise FileNotFoundError(f"The file {self.df_file_path} does not exist.")
        
        ##print(f"DEBUG: Loading dataframe from {self.df_file_path}")
        try:
            # Check file size first
            file_size = os.path.getsize(self.df_file_path) / (1024 * 1024)  # Size in MB
            ##print(f"DEBUG: File size: {file_size:.2f} MB")
            
            # Load the dataframe with error handling
            self.df = pd.read_csv(self.df_file_path)
            ##print(f"DEBUG: Dataframe loaded successfully, shape: {self.df.shape}")
            
            # Check memory usage
            memory_usage = self.df.memory_usage(deep=True).sum() / (1024 * 1024)  # Memory in MB
            ##print(f"DEBUG: Dataframe memory usage: {memory_usage:.2f} MB")
            
            # Print column types
            ##print(f"DEBUG: Dataframe column types: {self.df.dtypes}")
        except Exception as e:
            ##print(f"DEBUG: Error loading dataframe: {str(e)}")
            raise
        detection_lines = DetectionLines.objects.filter(record_id=record_id).first()
        if not detection_lines:
            raise ValueError("No detection lines found for this record")
        self.lines = detection_lines.lines
        video_file_path = f"{settings.MEDIA_ROOT}/{record_id}.mp4"
        if not os.path.exists(video_file_path):
            video_file_path = f"{settings.MEDIA_ROOT}/{record_id}.mkv"
            if not os.path.exists(video_file_path):
                raise FileNotFoundError(f"No video file found for record ID {record_id}")
        if not os.path.exists(video_file_path):
            raise FileNotFoundError(f"The file {video_file_path} does not exist.")
        self.video_file_path = video_file_path
        self.video_capture = cv2.VideoCapture(self.video_file_path)
        if not self.video_capture.isOpened():
            raise ValueError(f"Could not open the video file {self.video_file_path}.")
        self.frame_count = int(self.video_capture.get(cv2.CAP_PROP_FRAME_COUNT))
        self.fps = self.video_capture.get(cv2.CAP_PROP_FPS)
        self.duration = self.frame_count / self.fps if self.fps > 0 else 0
        self.video_height = int(self.video_capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
        self.video_width = int(self.video_capture.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.line_types = self._get_line_types()

    def _get_line_types(self, tolerance=0.1):
        """
        Determine the type of detection line based on the detection lines provided.
        Returns a dict: { key: [ ['closed', Polygon] or ['straight', [LineString,...]] ] }
        """
        line_types: dict[str, list] = {}
        if not self.lines:
            return line_types

        for line_key, lines in self.lines.items():
            line_types[line_key] = []
            for line in lines:
                points = np.asarray(line["points"], dtype=np.float32).reshape(-1, 2)
                first_point = points[0]
                last_point = points[-1]
                dist = float(np.linalg.norm(last_point - first_point))
                if dist < tolerance:
                    poly = Polygon(points)
                    line_types[line_key].append(["closed", poly]) # TODO shouldn't we add the first point to close the polygon?
                else:
                    segs = [LineString([p, q]) for p, q in zip(points[:-1], points[1:])]
                    line_types[line_key].append(["straight", segs])
        self.line_types = line_types
        return self.line_types

    def update_progress(self, progress):
        """
        Update the progress of the counting process via WebSocket.
        """
        try:
            group_name = f"actual_counter_progress_{self.record_id}_{self.divide_time}_{self.version}"
            ##print(f"DEBUG: Sending progress update: {progress:.2f}% to {group_name}")
            logger.info(f"Counting progress: {progress:.2f}%")
            
            channel_layer = get_channel_layer()
            if channel_layer is not None:
                # Simplify the message to just include progress
                message = {
                    "type": "send_progress",
                    "progress": float(progress)
                }
                
                # Send the message with error handling
                async_to_sync(channel_layer.group_send)(group_name, message)
                ##print(f"DEBUG: Progress update sent")
            else:
                ##print("DEBUG: Channel layer is None. Cannot send progress update.")
                pass
        except Exception as e:
            # Don't let WebSocket errors interrupt the main process
            ##print(f"DEBUG: Error sending progress update: {str(e)}")
            logger.error(f"Error sending progress update: {str(e)}")
            # Continue processing anyway

    def process_row(self, row_data):
        try:
            index, row = row_data
            x1, y1, x2, y2 = row['x1'], row['y1'], row['x2'], row['y2']
            x_c, y_c = (x1 + x2) / 2, (y1 + y2) / 2
            point = Point(x_c, y_c)
            in_area = False
            line_idx = -1
            # Remove this debug logging as it can be very verbose for large datasets
            # logger.debug(f"Processing row index {index} with point ({x_c}, {y_c})")
            for line_key, line_type_list in self.line_types.items():
                for line_type, geom in line_type_list:
                    if line_type == 'closed':
                        if geom.contains(point):
                            in_area = True
                            line_idx = line_key
                            break
            return index, in_area, line_idx
        except Exception as e:
            ##print(f"DEBUG: Error processing row: {str(e)}")
            logger.error(f"Error processing row: {str(e)}")
            return index, False, -1

    def counter(self):
        ##print("DEBUG: Counter method started")
        logger.info(f"Starting counting for record ID {self.record_id} with divide_time {self.divide_time} and version {self.version}")
        
        try:
            ##print("DEBUG: Adding columns to dataframe")
            self.df['in_area'] = False
            self.df["line_index"] = -1
            ##print("DEBUG: Columns added successfully")

            # Get dataframe information
            ##print("DEBUG: Getting total row count from dataframe")
            total_rows = len(self.df)
            ##print(f"DEBUG: Total rows in dataframe: {total_rows}")
            logger.info(f"Total rows in dataframe: {total_rows}")
            
            if total_rows == 0:
                ##print("DEBUG: No rows to process")
                logger.warning("No rows to process in dataframe")
                return self.df
            
            # Get a sample row for testing
            ##print("DEBUG: Getting sample row")
            sample_row = next(self.df.iloc[:1].iterrows())
            ##print(f"DEBUG: Sample row index: {sample_row[0]}, shape: {sample_row[1].shape}")
            
            ##print("DEBUG: Testing process_row with sample")
            try:
                sample_result = self.process_row(sample_row)
                ##print(f"DEBUG: Sample processing successful: {sample_result}")
            except Exception as e:
                ##print(f"DEBUG: Error processing sample row: {str(e)}")
                logger.error(f"Error processing sample row: {str(e)}")
                raise
            
            # Process in chunks to avoid memory issues
            chunk_size = 1000  # Process 1000 rows at a time
            total_chunks = (total_rows // chunk_size) + (1 if total_rows % chunk_size > 0 else 0)
            ##print(f"DEBUG: Will process {total_chunks} chunks of {chunk_size} rows each")
            
            # Use number of CPU cores for pool
            processes = min(cpu_count(), 4)  # Limit to 4 processes to avoid potential issues
            ##print(f"DEBUG: Using {processes} processes for counting")
            logger.info(f"Using {processes} processes for counting")
            
            # Send initial progress update
            ##print("DEBUG: Sending initial 0% progress update")
            self.update_progress(0)
            
            all_results = []
            processed_rows = 0
            
            # Process each chunk
            for chunk_idx in range(total_chunks):
                start_idx = chunk_idx * chunk_size
                end_idx = min(start_idx + chunk_size, total_rows)
                ##print(f"DEBUG: Processing chunk {chunk_idx+1}/{total_chunks}, rows {start_idx} to {end_idx-1}")
                
                # Get chunk of data
                chunk_df = self.df.iloc[start_idx:end_idx]
                chunk_rows = list(chunk_df.iterrows())
                
                # Process the chunk
                try:
                    with Pool(processes=processes) as pool:
                        chunk_results = []
                        for i, result in enumerate(pool.imap(self.process_row, chunk_rows)):
                            chunk_results.append(result)
                            
                            # Update progress occasionally
                            if i % 50 == 0 or i == len(chunk_rows) - 1:
                                current_progress = (processed_rows + i + 1) / total_rows * 100
                                ##print(f"DEBUG: Processed {processed_rows + i + 1}/{total_rows} rows ({current_progress:.2f}%)")
                                self.update_progress(current_progress)
                        
                        # Add chunk results to all results
                        all_results.extend(chunk_results)
                        processed_rows += len(chunk_rows)
                        ##print(f"DEBUG: Chunk {chunk_idx+1} completed, processed {processed_rows}/{total_rows} rows so far")
                except Exception as e:
                    ##print(f"DEBUG: Error processing chunk {chunk_idx+1} with multiprocessing: {str(e)}")
                    logger.error(f"Error processing chunk {chunk_idx+1} with multiprocessing: {str(e)}")
                    
                    # Fall back to single-process for this chunk
                    ##print(f"DEBUG: Falling back to single-process for chunk {chunk_idx+1}")
                    chunk_results = []
                    for i, row in enumerate(chunk_rows):
                        result = self.process_row(row)
                        chunk_results.append(result)
                        
                        # Update progress occasionally
                        if i % 50 == 0 or i == len(chunk_rows) - 1:
                            current_progress = (processed_rows + i + 1) / total_rows * 100
                            ##print(f"DEBUG: Processed {processed_rows + i + 1}/{total_rows} rows ({current_progress:.2f}%)")
                            self.update_progress(current_progress)
                    
                    # Add chunk results to all results
                    all_results.extend(chunk_results)
                    processed_rows += len(chunk_rows)
                    ##print(f"DEBUG: Chunk {chunk_idx+1} completed with single-process, processed {processed_rows}/{total_rows} rows so far")
            
            # Process is complete, update the dataframe with results
            ##print(f"DEBUG: Processing completed, updating dataframe with {len(all_results)} results")
            for index, in_area, line_idx in all_results:
                self.df.at[index, 'in_area'] = in_area
                self.df.at[index, 'line_index'] = line_idx

            # Save the results
            ##print("DEBUG: Saving results to CSV")
            output_path = self.df_file_path.replace('.csv', '_counted.csv')
            self.df.to_csv(output_path, index=False)
            ##print(f"DEBUG: Results saved to {output_path}")
            
            # Create AutoCount object
            from ai.models import AutoCount
            ##print("DEBUG: Creating AutoCount object")
            AutoCount.objects.create(
                record_id=int(self.record_id),
                time=pd.Timestamp.now(),
                version=self.version,
                file_name=output_path,
                divide_time=self.divide_time
            )
            ##print("DEBUG: AutoCount object created")
            
            # Send final 100% progress update
            self.update_progress(100)
            ##print("DEBUG: Counter process completed successfully")
            return self.df
        except Exception as e:
            ##print(f"DEBUG: Error in counter method: {str(e)}")
            logger.error(f"Error in counter method: {str(e)}")
            # Still try to send a final progress update
            try:
                self.update_progress(100)
            except:
                ##print("DEBUG: Failed to send final progress update")
                pass
            raise    