from django.urls import re_path
from backend.cronjob.consumers import ProgressConsumer  # Adjust path to your app
from backend.rtsp.websocket_urls import websocket_urlpatterns

websocket_urlpatterns += [
    re_path(r"ws/recording_progress/(?P<record_id>\w+)/$", ProgressConsumer.as_asgi()),
]