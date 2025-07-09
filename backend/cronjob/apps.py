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

    print(f"apps_cronjob 1. Starting recording task for record ID {record_id}")
    
    try:
        record = Record.objects.get(id=record_id)
        record.in_process = True
        record.save()
        print(f"apps_cronjob 2. Marked record {record_id} as in_process")
        
        # Create output directory
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        logging.info(f"Starting recording for record ID {record_id}")
        print(f"apps_cronjob 3. Recording from {camera_url} for {duration} minutes to {output_file}")
        
        rtsp_obj = RTSPObject(camera_url, record_type=record_type)
        done = rtsp_obj.record(duration, output_file)
        
        # Check if file was created and has reasonable size
        if done:
            print(f"apps_cronjob 4. Recording file created: {output_file}")
            record.done = True
            record.error = ""
        else:
            record.done = False
            record.error = "Recording file was not created"
            print(f"apps_cronjob 5. Recording file was not created for record ID {record_id}")
            
    except Exception as e:
        print(f"apps_cronjob 6. Error during recording for record ID {record_id}: {e}")
        record.done = False
        record.error = str(e)
        record.in_process = False
        logging.error(f"Error during recording for record ID {record_id}: {e}")

    record.in_process = False
    record.save()
    print(f"apps_cronjob 7. Finished recording task for record ID {record_id}")

def job_checker():
    from record.models import Record  # <-- move import here!
    from django.utils import timezone
    import os
    import time
    from django.db.utils import OperationalError, ProgrammingError
    while True:
        try:
            now = timezone.now()
            print(f"apps_cronjob 8. Checking for records to process at {now}")
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
            print(f"apps_cronjob 9. Found {records.count()} records to process: {records}")

            for record in records:
                print(f"apps_cronjob 10. Starting recording task for record ID {record.id}")
                print(f"apps_cronjob 11. Camera URL: {record.camera_url}")
                print(f"apps_cronjob 12. Duration: {record.duration} minutes")
                
                ip = record.camera_url.split('rtsp://')[1]
                ip = ip.replace('.', '_')
                output_file = f"{os.getenv('CACHE_DIR', '.cache')}/{record.id}"
                print(f"apps_cronjob 13. Output file: {output_file}")
                
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
            print("apps_cronjob 14. Checking for in_process records to finalize...")
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
            
            
            print(f"apps_cronjob 15. Found {records.count()} in_process records to check: {records}")
        except (OperationalError, ProgrammingError) as e:
            # Table does not exist yet, skip this iteration
            print(f"apps_cronjob 16. Database not ready: {e}")
            pass
        except Exception as e:
            print(f"apps_cronjob 17. Error in job_checker: {e}")
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
