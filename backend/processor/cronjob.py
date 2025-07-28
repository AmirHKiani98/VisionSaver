import os
import sys
import time
import dotenv
from pathlib import Path
import requests
# --- PATH SETUP ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)
sys.path.insert(0, os.path.abspath(os.path.join(BASE_DIR, '..')))

# --- ENV SETUP ---
def get_env_path():
    if hasattr(sys, '_MEIPASS'):
        return os.path.abspath(os.path.join(os.path.dirname(sys.executable), "..", "..", ".hc_to_app_env"))
    else:
        return os.path.abspath(os.path.join(BASE_DIR, '../../cameravision/resources/.hc_to_app_env'))

ENV_PATH = get_env_path()
dotenv.load_dotenv(ENV_PATH)

# --- DJANGO SETUP ---
import django
# os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.processor.settings")
django.setup()
from django.conf import settings
logger = settings.APP_LOGGER

# --- MAIN JOB LOOP ---
def job_checker():
    from record.models import Record
    from django.utils import timezone
    from django.db.utils import OperationalError, ProgrammingError

    if settings.JOB_CHECKER_ENABLED:
        logger.info("Job checker is already running. Exiting.")
        return
    settings.JOB_CHECKER_ENABLED = True

    try:
        while True:
            try:
                now = timezone.now()
                os.makedirs(settings.MEDIA_ROOT, exist_ok=True)
                records = Record.objects.filter(done=False, in_process=False, start_time__lte=now)
                
                for record in records:
                    logger.info(f"Processing record: {record.id} from {record.camera_url}")
                    record.in_process = True
                    record.save()

                    output_file = f"{settings.MEDIA_ROOT}/{record.id}"
                    post_data = {
                        "record_id": record.id,
                        "camera_url": record.camera_url,
                        "duration": record.duration,
                        "output_file": output_file
                    }

                    post_url = f"http://{os.getenv('BACKEND_SERVER_DOMAIN')}:{os.getenv('BACKEND_SERVER_PORT')}/{os.getenv('RECORD_FUNCTION_NAME')}/"
                    logger.info(f"Making POST request to: {post_url}")
                    response = requests.post(post_url, json=post_data)
                    if response.status_code == 200:
                        logger.info(f"Record {record.id} started successfully.")
                    else:
                        logger.error(f"Failed to start record {record.id}: Status {response.status_code}, Response: {response.text}")
                        record.in_process = False
                        record.save()
                        continue

            except (OperationalError, ProgrammingError) as db_exc:
                logger.warning(f"DB not ready: {db_exc}")
            except Exception as e:
                logger.error(f"Unhandled error in job loop: {e}")

            time.sleep(10)

    except KeyboardInterrupt:
        print("\n[INFO] Cronjob interrupted by user. Exiting gracefully.")

# --- ENTRY POINT ---
if __name__ == "__main__":
    print("[INFO] Starting cronjob loop from external runner...")
    job_checker()
