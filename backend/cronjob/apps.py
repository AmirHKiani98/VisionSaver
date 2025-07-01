# backend/cronjob/apps.py
from django.apps import AppConfig
from django.db import OperationalError, ProgrammingError

import threading
import time
import os
def job_checker():
    from record.models import Record  # <-- move import here!
    from django.utils import timezone
    import os
    from record.rtsp_object import RTSPObject
    def record_rtsp_task(camera_url, duration, output_file):
        rtsp_obj = RTSPObject(camera_url)
        rtsp_obj.record(duration, output_file)
    while True:
        now = timezone.now()
        print("what time is now?:", now)
        records = Record.objects.filter(done=False, in_process=False, start_time__lte=now)
        
        for record in records:
            ip = record.camera_url.split('rtsp://')[1]            
            ip = ip.replace('.', '_')
            threading.Thread(
                target=record_rtsp_task,
                args=(
                    record.camera_url,
                    record.duration,
                    f"{os.getenv('CACHE_DIR', '.cache')}/recording_{ip}_{record.start_time}_{record.duration}.avi"
                ),
                daemon=True
            ).start()
            record.in_process = True
            record.save()
        time.sleep(10)

class CronjobConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'cronjob'

    def ready(self):
        if os.environ.get('RUN_MAIN', None) != 'true':
            return
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1 FROM record_record LIMIT 1;")
        except (OperationalError, ProgrammingError):
            # Table does not exist yet, skip starting the thread
            return
        t = threading.Thread(target=job_checker, daemon=True)
        t.start()
