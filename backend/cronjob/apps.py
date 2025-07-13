# backend/cronjob/apps.py
from django.apps import AppConfig

# Import settings from django
from django.conf import settings
import logging
from multiprocessing import Pool
import threading

from processor.logger import app_logger as logger

import os
def record_rtsp_task(record_id, camera_url, duration, output_file):
    from record.models import Record
    from record.rtsp_object import RTSPObject

    print(f"🎬 Starting recording task for record ID {record_id}")
    
    try:
        record = Record.objects.get(id=record_id)
        record.in_process = True
        record.save()
        print(f"✅ Marked record {record_id} as in_process")
        
        # Create output directory
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        logger.info(f"Starting recording for record ID {record_id}")
        
        rtsp_obj = RTSPObject(camera_url)
        rtsp_obj.record(duration, output_file)
        
        # Check if file was created and has reasonable size
        if os.path.exists(output_file):
            file_size = os.path.getsize(output_file)
            logger.info(f"Recording file created: {output_file} ({file_size} bytes)")

            if file_size > 1024:  # More than 1KB
                record.done = True
                record.error = ""
                logger.info(f"Recording completed successfully for record ID {record_id}")
            else:
                record.done = False
                record.error = f"Recording file too small: {file_size} bytes"
                logger.error(f"Recording file too small for record ID {record_id}: {file_size} bytes")
        else:
            record.done = False
            record.error = "Recording file was not created"
            logger.error(f"Recording file was not created for record ID {record_id}")

    except Exception as e:
        record.done = False
        record.error = str(e)
        record.in_process = False
        logger.error(f"Error during recording for record ID {record_id}: {e}")

    record.in_process = False
    record.save()
    logger.info(f"Finished recording task for record ID {record_id}")

def job_checker():
    from record.models import Record  # <-- move import here!
    from django.utils import timezone
    import os
    import time
    from django.db.utils import OperationalError, ProgrammingError
    while True:
        try:
            now = timezone.now()
            cache_dir = settings.MEDIA_ROOT
            logger.info(f"Checking for records to process at {now}")
            cache_dir = os.getenv('CACHE_DIR', '.cache')
            os.makedirs(cache_dir, exist_ok=True)
            
            # Write heartbeat file
            with open(os.path.join(cache_dir, 'last_run.txt'), 'w') as f:
                f.write(now.strftime('%Y-%m-%d %H:%M:%S'))
            
            records = Record.objects.filter(
                done=False,
                in_process=False,
                start_time__lte=now,
            )
            logger.info(f"Found {records.count()} records to process: {records}")

            for record in records:
                logger.info(f"Starting recording task for record ID {record.id}")
                logger.info(f"Camera URL: {record.camera_url}")
                logger.info(f"Duration: {record.duration} minutes")
                
                ip = record.camera_url.split('rtsp://')[1]
                ip = ip.replace('.', '_')
                output_file = f"{settings.MEDIA_ROOT}/{record.id}"

                # Set in_process=True and save BEFORE starting the thread
                record.in_process = True
                record.save()

                # Start recording in separate thread
                threading.Thread(
                    target=record_rtsp_task,
                    args=(
                        record.id,
                        record.camera_url,
                        record.duration,
                        output_file
                    ),
                    daemon=True
                ).start()
        except (OperationalError, ProgrammingError) as e:
            # Table does not exist yet, skip this iteration
            logger.warning(f"Database not ready: {e}")
            pass
        except Exception as e:
            logger.error(f"Error in job_checker: {e}")
        time.sleep(10)

class CronjobConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'cronjob'
    
    def ready(self):
        logger.info("CronjobConfig.ready() running...")
        import multiprocessing
        multiprocessing.set_start_method('spawn', force=True)  # Optional: avoids multiprocessing errors on Windows

        logger.info("Starting job_checker thread...")
        t = threading.Thread(target=job_checker, daemon=True)
        t.start()
        logger.info("job_checker thread started successfully")
