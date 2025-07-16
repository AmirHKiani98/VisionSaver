from django.urls import re_path
from backend.rtsp.consumers import MJPEGConsumer
import os
# Load environment variables

websocket_urlpatterns = [
    re_path(r'ws/stream/$', MJPEGConsumer.as_asgi()),
]