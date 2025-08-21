from django.urls import re_path
from cronjob.consumers import ProgressConsumer, CounterProgressConsumer, CounterModifiedProgressConsumer

websocket_urlpatterns = [
    re_path(r"ws/recording_progress/(?P<record_id>\w+)/$", ProgressConsumer.as_asgi()),
    re_path(r"ws/detection_progress/(?P<record_id>\w+)/(?P<divide_time>\d+(\.\d+)?)/(?P<version>\w+\d+)/$", CounterProgressConsumer.as_asgi()),
    # re_path(r"ws/detection_loading_progress/(?P<record_id>\w+)/$", CounterLoadingProgressConsumer.as_asgi()),
    re_path(r"ws/detection_loading_progress/(?P<record_id>\w+)/(?P<divide_time>\d+(\.\d+)?)/(?P<version>\w+\d+)/$", CounterModifiedProgressConsumer.as_asgi()),
]