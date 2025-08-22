import dotenv
from django.conf import settings
import os
import requests
dotenv.load_dotenv(settings.ENV_PATH)

logger = settings.APP_LOGGER
def poke_detection_progress(record_id, divide_time, version, progress=50.0):
    """
    Helper function to test WebSocket progress updates.
    Call this function to send a test progress update.
    """
    try:
        url = f"http://{os.getenv('BACKEND_SERVER_DOMAIN')}:{os.getenv('BACKEND_SERVER_PORT')}/{os.getenv('AI_UPDATE_DETECTION_PROGRESS')}"
        r = requests.post(url, json={
            "record_id": record_id,
            "divide_time": divide_time,
            "version": version,
            "progress": progress
        })
        
        # Check if request was successful
        if r.status_code == 200:
            response_data = r.json()
            if response_data.get('status') == 'success':
                logger.info("Test progress update sent successfully.")
                return True
            else:
                logger.error(f"Request failed with response: {response_data}")
                return False
        else:
            logger.error(f"Request failed with status code: {r.status_code}")
            return False
            
    except Exception as e:
        print(f"Error: {e}")
        return False   
