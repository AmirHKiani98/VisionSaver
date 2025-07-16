from django.urls import re_path
from backend.rtsp.consumers import MJPEGConsumer
from django.conf import settings
import dotenv
import os
# Load environment variables
dotenv.load_dotenv(settings.ENV_PATH)
websocket_urlpatterns = [
    re_path(rf'{os.getenv("WEBSOCKET_STREAM_URL", "ws/mjpeg")}/(?P<url>.+)/$', MJPEGConsumer.as_asgi()),
]