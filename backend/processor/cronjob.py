import os
import sys
import time
import threading
import dotenv
from pathlib import Path

# --- PATH SETUP ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)
sys.path.insert(0, os.path.abspath(os.path.join(BASE_DIR, '..')))

# --- ENV SETUP ---
def get_env_path():
    if hasattr(sys, '_MEIPASS'):
        return os.path.abspath(os.path.join(os.path.dirname(sys.executable), "..", "..", ".hc_to_app_env"))
    else:
        return os.path.abspath(os.path.join(BASE_DIR, '../cameravision/resources/.hc_to_app_env'))

ENV_PATH = get_env_path()
dotenv.load_dotenv(ENV_PATH)

# --- DJANGO SETUP ---
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.processor.settings")
django.setup()
from django.conf import settings
logger = settings.APP_LOGGER

# --- RECORDING FUNCTION ---
def record_rtsp_task(record_id, camera_url, duration, output_file):
    from record.models import Record
    from record.rtsp_object import RTSPObject

    print(f"Starting recording task for record ID {record_id}")
    try:
        record = Record.objects.get(id=record_id)
        record.in_process = True
        record.save()

        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        rtsp_obj = RTSPObject(camera_url)
        done = rtsp_obj.record(duration, output_file, record_id)

        if done:
            record.done = True
            record.error = ""
        else:
            record.done = False
            record.error = f"File doesn't exist at {output_file}"
            logger.error(f"Recording file doesn't exist: {output_file}")

    except Exception as e:
        import traceback
        logger.error(f"Recording error for {record_id}: {e}\n{traceback.format_exc()}")
        record = Record.objects.get(id=record_id)
        record.done = False
        record.error = str(e)

    record.in_process = False
    record.save()
    print(f"Finished recording for record ID {record_id}")

# --- MAIN JOB LOOP ---
def job_checker():
    from record.models import Record
    from django.utils import timezone
    from django.db.utils import OperationalError, ProgrammingError

    if settings.JOB_CHECKER_ENABLED:
        print("Job checker already enabled.")
        return
    settings.JOB_CHECKER_ENABLED = True

    try:
        while True:
            try:
                now = timezone.now()
                os.makedirs(settings.MEDIA_ROOT, exist_ok=True)
                records = Record.objects.filter(done=False, in_process=False, start_time__lte=now)

                for record in records:
                    print(f"Launching record thread for ID {record.id}")
                    record.in_process = True
                    record.save()

                    ip = record.camera_url.split('rtsp://')[1].replace('.', '_')
                    output_file = f"{settings.MEDIA_ROOT}/{record.id}"

                    threading.Thread(
                        target=record_rtsp_task,
                        args=(record.id, record.camera_url, record.duration, output_file),
                        daemon=True
                    ).start()

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
