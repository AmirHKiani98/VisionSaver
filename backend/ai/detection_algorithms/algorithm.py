import os
import pandas as pd
import tempfile
from typing import Tuple, Optional, Dict, Any
from django.conf import settings
from django.db.models import Q
from ai.utils import poke_detection_progress
logger = settings.APP_LOGGER
class DetectionAlgorithm:
    """
    High-level entrypoint:
     - If AutoDetection exists for (record_id, version, divide_time) and file is present → return cached DataFrame.
     - Else → instantiate model subclass and call .run() (MP owned by abstract).
             → store/refresh AutoDetection with produced CSV.
    """
    def __init__(self, version: str = "v1"):
        self.version = version

    def _import_model(self):
        import importlib
        module = importlib.import_module(f"ai.detection_algorithms.{self.version}.model")
        return getattr(module, "Model")

    @staticmethod
    def _run_detection_mp(version: str, record_id: int, divide_time: float, detector_init: Optional[Dict[str, Any]] = None, result_path: Optional[str] = None):
        """
        Multiprocessing-safe detection runner. Writes output file path to result_path.
        """
        import importlib
        import os
        import sys
        import logging
        import traceback
        from django.conf import settings
        
        # Configure logging
        logging.basicConfig(level=logging.INFO, 
                           format='%(asctime)s [%(levelname)s] %(message)s',
                           handlers=[logging.StreamHandler()])
        logger = logging.getLogger(__name__)
        
        # Configure Django settings if needed (safe even if already configured)
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
        
        try:
            # Ensure WebSockets work with the correct type field
            from channels.layers import get_channel_layer
            
            # Create a dedicated function for sending WebSocket updates with the correct type
            def send_direct_ws_progress(record_id, divide_time, version, progress, message=None):
                try:
                    # Format divide_time
                    if isinstance(divide_time, (int, float)):
                        divide_time_str = f"{float(divide_time):.6g}"
                    else:
                        divide_time_str = divide_time
                        
                    # Create group name - IMPORTANT: Must match format in CounterProgressConsumer
                    group = f"detection_progress_{record_id}_{divide_time_str}_{version}"
                    
                    # Get channel layer
                    channel_layer = get_channel_layer()
                    if not channel_layer:
                        logger.warning("Channel layer not available")
                        return False
                        
                    payload = {"type": "send.progress", "progress": float(progress)}
                    if message:
                        payload["message"] = message
                        
                    # Send update
                    
                    try:
                        poke_detection_progress(record_id, divide_time, version, progress)
                        logger.info(f"Sending progress {progress}% to group {group}")
                    except Exception as e:
                        logger.error(f"WebSocket error: {e}")
                        return False
                    return True
                except Exception as e:
                    logger.error(f"WebSocket error: {e}")
                    return False
            
            # Send initial progress update
            send_direct_ws_progress(record_id, divide_time, version, 5.0, "Starting detection...")
            
            # Import model class
            logger.info(f"Importing model from ai.detection_algorithms.{version}.model")
            module = importlib.import_module(f"ai.detection_algorithms.{version}.model")
            ModelCls = getattr(module, "Model")
            
            # Create model instance
            logger.info(f"Creating model instance for record {record_id}")
            model = ModelCls(record_id=record_id, divide_time=divide_time)
            cls_path = f"ai.detection_algorithms.{version}.model.Model"
            
            # Override the model's send_ws_progress method to use our direct method
            def patched_send_ws_progress(self, group, progress, message=None):
                # Ignore the group parameter since we'll construct it ourselves
                send_direct_ws_progress(record_id, divide_time, version, progress, message)
            
            # Apply the patch
            model._send_ws_progress = patched_send_ws_progress.__get__(model, ModelCls)
            
            # Run detection
            logger.info("Starting detection with patched WebSocket progress updates")
            send_direct_ws_progress(record_id, divide_time, version, 10.0, "Running detection...")
            df, out_file = model.run(
                cls_path=cls_path,
                detector_init=detector_init or {},
            )
            
            # Final progress update
            send_direct_ws_progress(record_id, divide_time, version, 100.0, "Detection complete")
            
            # Ensure the output file exists and is valid
            if not out_file or not os.path.exists(out_file):
                raise RuntimeError(f"Detection completed but output file not found: {out_file}")
            
            logger.info(f"Detection complete. Output file verified at: {out_file}")
            
            # Write result to file
            if result_path:
                with open(result_path, "w") as f:
                    f.write(out_file)
                logger.info(f"Result path written to: {result_path}")
            return out_file
        except Exception as e:
            error_msg = f"Error in _run_detection_mp: {e}\n{traceback.format_exc()}"
            logger.error(error_msg)
            if result_path:
                try:
                    with open(result_path, "w") as f:
                        f.write("ERROR")
                    logger.info(f"Error status written to result path: {result_path}")
                except Exception as write_error:
                    logger.error(f"Failed to write error to result path: {write_error}")
            return None

    def get_result(self,
            record_id: int,
            divide_time: float,
            detector_init: Optional[Dict[str, Any]] = None) -> Tuple[str, str]:
        """
        Orchestrate detection and ORM update. Only call in main process.
        Returns: (file_path, source)
        source ∈ {"cache", "computed"}
        """
        from ai.models import AutoDetection
        ac = AutoDetection.objects.filter(
            Q(record_id=record_id) & Q(version=self.version) & Q(divide_time=divide_time)
        ).order_by("-time").first()

        if ac and ac.file_name and os.path.exists(ac.file_name):
            logger.info(f"Cache hit for record {record_id}, version {self.version}, time {divide_time}. File: {ac.file_name}")
            return ac.file_name, "cache"

        # 2) Check for detection output
        import glob
        # Look for result files that might have been created by run_detection_mp
        result_files = glob.glob(os.path.join(tempfile.gettempdir(), f"*_detect_result.txt"))
        out_file = None
        
        # Try to find a valid output file path in any of the result files
        for result_path in result_files:
            if os.path.exists(result_path):
                try:
                    with open(result_path, "r") as f:
                        file_content = f.read().strip()
                    if file_content and file_content != "ERROR" and os.path.exists(file_content):
                        out_file = file_content
                        logger.info(f"Found valid detection output file: {out_file}")
                        break
                except Exception as e:
                    logger.warning(f"Error reading result file {result_path}: {e}")
        
        if not out_file:
            logger.error("Detection output file not found. Run detection first using run_detection_mp.")
            return None, "error"

        # 3) Upsert AutoDetection (do this in main process only)
        try:
            AutoDetection.objects.update_or_create(
                record_id=record_id,
                version=self.version,
                divide_time=divide_time,
                defaults={"file_name": out_file},
            )
            logger.info(f"AutoDetection upserted for record {record_id}, version {self.version}, time {divide_time}.")
        except Exception as e:
            logger.error(f"Failed to upsert AutoDetection: {e}")

        return out_file, "computed"

    def run_detection_mp(self, record_id: int, divide_time: float, detector_init: Optional[Dict[str, Any]] = None) -> str:
        """
        Public method to run detection in a child process. Call this from your view.
        """
        import tempfile
        result_path = tempfile.mktemp(suffix="_detect_result.txt")
        import multiprocessing
        p = multiprocessing.Process(target=DetectionAlgorithm._run_detection_mp,
                                   args=(self.version, record_id, divide_time, detector_init, result_path))
        p.start()
        p.join()
        return result_path
