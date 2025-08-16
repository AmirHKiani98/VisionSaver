from django.urls import re_path
from cronjob.consumers import ProgressConsumer, CounterProgressConsumer, CounterLoadingProgressConsumer, CounterModifiedProgressConsumer

websocket_urlpatterns = [
    re_path(r"ws/recording_progress/(?P<record_id>\w+)/$", ProgressConsumer.as_asgi()),
    re_path(r"ws/counter_progress/(?P<record_id>\w+)/(?P<divide_time>\d+(\.\d+)?)/$", CounterProgressConsumer.as_asgi()),
    re_path(r"ws/counter_loading_progress/(?P<record_id>\w+)/$", CounterLoadingProgressConsumer.as_asgi()),
    re_path(r"ws/counter_progress/(?P<record_id>\w+)/(?P<divide_time>\d+(\.\d+)?)/(?<version>\w+\d+)$", CounterModifiedProgressConsumer.as_asgi()),
]