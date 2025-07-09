# backend/cronjob/apps.py
from django.apps import AppConfig
from django.db import OperationalError, ProgrammingError

import logging
from multiprocessing import Pool
import threading
from django.db.models import F, ExpressionWrapper, DateTimeField, DurationField
logging.basicConfig(level=logging.INFO)
import os
def record_rtsp_task(record_id, camera_url, duration, output_file, record_type):
    from record.models import Record
    from record.rtsp_object import RTSPObject

    try:
        record = Record.objects.get(id=record_id)
        record.in_process = True
        record.save()
        
        # Create output directory
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        logging.info(f"Starting recording for record ID {record_id}")
        
        rtsp_obj = RTSPObject(camera_url, record_type=record_type)
        done = rtsp_obj.record(duration, output_file)
        
        # Check if file was created and has reasonable size
        if done:
            record.done = True
            record.error = ""
        else:
            record.done = False
            record.error = "Recording file was not created"
            
    except Exception as e:
        record.done = False
        record.error = str(e)
        record.in_process = False
        logging.error(f"Error during recording for record ID {record_id}: {e}")

    record.in_process = False
    record.save()

def job_checker():
    from record.models import Record  # <-- move import here!
    from django.utils import timezone
    import os
    import time
    from django.db.utils import OperationalError, ProgrammingError
    while True:
        try:
            now = timezone.now()
            cache_dir = os.getenv('CACHE_DIR', '.cache')
            os.makedirs(cache_dir, exist_ok=True)
            
            # Write heartbeat file
            with open(os.path.join(cache_dir, 'last_run.txt'), 'a+') as f:
                f.write(now.strftime('%Y-%m-%d %H:%M:%S'))
            
            records = Record.objects.filter(
                done=False,
                in_process=False,
                start_time__lte=now,
            )

            for record in records:
                ip = record.camera_url.split('rtsp://')[1]
                ip = ip.replace('.', '_')
                output_file = f"{os.getenv('CACHE_DIR', '.cache')}/{record.id}"
                
                # Start recording in separate thread
                threading.Thread(
                    target=record_rtsp_task,
                    args=(
                        record.id,
                        record.camera_url,
                        record.duration,
                        output_file,
                        record.record_type
                    ),
                    daemon=True
                ).start()

            # Filter in_process records whose (start_time + duration) < now
            records = Record.objects.filter(
                done=False,
                in_process=True
            ).annotate(
                end_time=ExpressionWrapper(
                    F('start_time') + 
                    ExpressionWrapper((F('duration') + 3) * 60, output_field=DurationField()),
                    output_field=DateTimeField()
                )
            ).filter(
                end_time__lt=now
            )
            records.update(
                in_process=False
            )
        except (OperationalError, ProgrammingError) as e:
            pass
        except Exception as e:
            pass
        time.sleep(10)

class CronjobConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'cronjob'
    
    def ready(self):
        print("apps_cronjob 18. CronjobConfig.ready() running...")
        import multiprocessing

        multiprocessing.set_start_method('spawn', force=True)  # Optional: avoids multiprocessing errors on Windows

        print("apps_cronjob 19. Starting job_checker thread...")
        t = threading.Thread(target=job_checker, daemon=True)
        t.start()
        print("apps_cronjob 20. job_checker thread started successfully")
