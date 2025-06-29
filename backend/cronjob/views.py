import os

from django.shortcuts import render
from record import models
# Create your views here.
from django.utils import timezone
import dotenv
dotenv.load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))
# Import request
import requests


def run_cronjob():
    """
    This function is intended to be run as a cron job.
    """
    # This function will check the database for any records that are not done
    # and start them if they are not currently in process.
    now = timezone.now()
    records = models.Record.objects.filter(done=False, in_process=False, start_time__lte=now)
    
    for record in records:
        requests.post(
            f"http://{os.getenv('BACKEND_SERVER_DOMAIN')}:{os.getenv('BACKEND_SERVER_PORT')}/record/{os.getenv('RECORD_FUNCTION_NAME')}/",
            data={
                'url': record.url,
                'duration': record.duration,
                'start_time': record.start_time.isoformat()
            }
        )