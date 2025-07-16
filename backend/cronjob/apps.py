# backend/cronjob/apps.py
from django.apps import AppConfig

# Import settings from django
from django.conf import settings
import threading

from django.conf import settings

logger = settings.APP_LOGGER
logger.info("Initializing CronjobConfig...")
import os
def record_rtsp_task(record_id, camera_url, duration, output_file):
    from record.models import Record
    from record.rtsp_object import RTSPObject

    print(f"Starting recording task for record ID {record_id}")
    
    try:
        record = Record.objects.get(id=record_id)
        record.in_process = True
        record.save()
        print(f"Marked record {record_id} as in_process")
        
        # Create output directory
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        logger.info(f"Starting recording for record ID {record_id}")
        
        rtsp_obj = RTSPObject(camera_url)
        done = rtsp_obj.record(duration, output_file, record_id)
        
        # Check if file was created and has reasonable size
        if done:
            record.done = True
            record.error = ""
            logger.info(f"Recording completed successfully for record ID {record_id}")
            
        else:
            record.done = False
            record.error = f"File doesn't exist at {output_file}"
            logger.error(f"Recording file doesn't exist for record ID {record_id}: {output_file}")

    except Exception as e:
        record.done = False
        record.error = str(e)
        record.in_process = False
        import traceback
        logger.error(f"Error during recording for record ID{record_id}: {e}\n{traceback.format_exc()}")

    record.in_process = False
    record.save()
    logger.info(f"Finished recording task for record ID {record_id}")

def job_checker():
    from record.models import Record  # <-- move import here!
    from django.utils import timezone
    import os
    import time
    from django.db.utils import OperationalError, ProgrammingError
    if (settings.JOB_CHECKER_ENABLED):
        logger.info("Job checker is already enabled, starting job_checker thread...")
        return
    settings.JOB_CHECKER_ENABLED = True
    while True:
        try:
            now = timezone.now()
            cache_dir = settings.MEDIA_ROOT
            # logger.info(f"Checking for records to process at {now}")
            os.makedirs(cache_dir, exist_ok=True)
            
            
            records = Record.objects.filter(
                done=False,
                in_process=False,
                start_time__lte=now,
            )
            logger.info(f"Found {records.count()} records to process: {records}")
            # logger.info(f"Found {records.count()} records to process: {records}")

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
    
    _job_checker_thread = None

    def ready(self):
        import sys
        import os
        
        # Special handling for uvicorn
        if 'uvicorn' in sys.argv[0].lower():
            is_main_process = True
        else:
            # Get the process name
            process_name = os.environ.get('SERVER_SOFTWARE', '')
            
            # Check if we're in the main process for any supported server
            is_main_process = (
                'uvicorn' in process_name.lower() or  # For uvicorn
                any(x in sys.argv for x in ['runserver', 'daphne']) or  # For runserver/daphne
                os.environ.get('DJANGO_SETTINGS_MODULE')  # For other ASGI servers
            )
        
        if not is_main_process:
            logger.info("Not in main process, skipping job checker startup")
            return
            
        if 'test' in sys.argv:
            return

        # Use a process-level flag to prevent multiple starts
        if not getattr(CronjobConfig, '_job_checker_started', False):
            CronjobConfig._job_checker_started = True
            logger.info("CronjobConfig.ready() running...")
            
            import multiprocessing
            multiprocessing.set_start_method('spawn', force=True)

            if not self._job_checker_thread or not self._job_checker_thread.is_alive():
                logger.info("Starting job_checker thread...")
                self._job_checker_thread = threading.Thread(target=job_checker, daemon=True)
                self._job_checker_thread.start()
                logger.info("job_checker thread started successfully")
