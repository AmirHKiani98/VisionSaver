import os
import sys
# Add the backend directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
import django
django.setup()

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fix_websocket():
    try:
        logger.info("Getting channel layer...")
        channel_layer = get_channel_layer()
        if not channel_layer:
            logger.error("Channel layer is not available.")
            return
            
        logger.info("Channel layer retrieved successfully.")
        
        # Test send progress for record 1, divide_time 0.1, version v1
        record_id = 1
        divide_time = 0.1
        version = 'v1'
        
        # Format the group name
        divide_time_str = f"{float(divide_time):.6g}"
        group = f"detection_progress_{record_id}_{divide_time_str}_{version}"
        
        logger.info(f"Sending test progress update to group: {group}")
        
        # Send a test message
        async_to_sync(channel_layer.group_send)(
            group,
            {
                "type": "send_progress",  # This should match the handler method in the consumer
                "progress": 50.0
            }
        )
        
        logger.info("Test message sent successfully.")
        
    except Exception as e:
        logger.error(f"Error: {e}")

if __name__ == "__main__":
    fix_websocket()
