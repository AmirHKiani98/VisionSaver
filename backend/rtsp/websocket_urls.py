from django.urls import re_path
from backend.rtsp.consumers import MJPEGConsumer
import os
# Load environment variables
print("Loading environment variables for WebSocket URLs...",os.getenv('WEBSOCKET_STREAM_URL') )
websocket_urlpatterns = [
    re_path(rf"{os.getenv('WEBSOCKET_STREAM_URL')}/?$", MJPEGConsumer.as_asgi()),
]