# backend/cronjob/apps.py
from django.apps import AppConfig
from django.db import OperationalError, ProgrammingError

import logging
from multiprocessing import Pool
import threading

logging.basicConfig(level=logging.INFO)
import os
def record_rtsp_task(record_id, camera_url, duration, output_file):
    from record.models import Record
    from record.rtsp_object import RTSPObject

    record = Record.objects.get(id=record_id)
    record.in_process = True
    record.save()
    try:
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        logging.info(f"Starting recording for record ID {record_id}")
        rtsp_obj = RTSPObject(camera_url)
        rtsp_obj.record(duration, output_file)
        record.done = True
        record.error = ""
        logging.info(f"Recording completed for record ID {record_id}")
    except Exception as e:
        record.done = True
        record.error = str(e)
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
            records = Record.objects.filter(done=False, in_process=False, start_time__lte=now)
            for record in records:
                ip = record.camera_url.split('rtsp://')[1]
                ip = ip.replace('.', '_')
                # Ensure start_time is formatted as a string safe for filenames
                threading.Thread(
                    target=record_rtsp_task,
                    args=(
                        record.id,
                        record.camera_url,
                        record.duration,
                        f"{os.getenv('CACHE_DIR', '.cache')}/{record.id}.mp4"
                    ),
                    daemon=True
                ).start()
        except (OperationalError, ProgrammingError):
            # Table does not exist yet, skip this iteration
            pass
        time.sleep(60)

class CronjobConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'cronjob'

    def ready(self):
        if os.environ.get('RUN_MAIN', None) != 'true':
            return
        # Do not access the database here!
        t = threading.Thread(target=job_checker, daemon=True)
        t.start()
