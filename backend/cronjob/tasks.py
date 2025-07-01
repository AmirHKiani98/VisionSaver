import os
import requests
from celery import shared_task
from django.utils import timezone

from record.rtsp_object import RTSPObject
from record import models

import dotenv
dotenv.load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

@shared_task
def record_rtsp_task(camera_url, duration, output_file):
    rtsp_obj = RTSPObject(camera_url)
    rtsp_obj.record(duration, output_file)

def check_and_start_recordings():
    """
    This function is intended to be run as a cron job.
    """
    # This function will check the database for any records that are not done
    # and start them if they are not currently in process.
    now = timezone.now()
    records = models.Record.objects.filter(done=False, in_process=False, start_time__lte=now)
    
    for record in records:
        requests.post(
            f"http://{os.getenv('BACKEND_SERVER_DOMAIN')}:{os.getenv('BACKEND_SERVER_PORT')}/{os.getenv('RECORD_FUNCTION_NAME')}/",
            data={
                'url': record.camera_url,
                'duration': record.duration,
                'start_time': record.start_time.isoformat()
            }
        )