from django.urls import re_path
from cronjob.consumers import ProgressConsumer, CounterProgressConsumer  # Adjust path to your app

websocket_urlpatterns = [
    re_path(r"ws/recording_progress/(?P<record_id>\w+)/$", ProgressConsumer.as_asgi()),
    re_path(r"ws/counter_progress/(?P<record_id>\w+)/$", CounterProgressConsumer.as_asgi()),
]