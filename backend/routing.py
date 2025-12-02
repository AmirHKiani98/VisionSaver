from django.urls import re_path
from cronjob.consumers import ProgressConsumer, CounterProgressConsumer, CounterModifiedProgressConsumer, ActualCounterProgressConsumer, DownloadingResultsProgress

websocket_urlpatterns = [
    re_path(r"ws/recording_progress/(?P<record_id>\w+)/$", ProgressConsumer.as_asgi()),
    re_path(r"ws/detection_progress/(?P<record_id>\w+)/(?P<divide_time>\d+(\.\d+)?)/(?P<version>\w+\d+)/$", CounterProgressConsumer.as_asgi()),
    # re_path(r"ws/detection_loading_progress/(?P<record_id>\w+)/$", CounterLoadingProgressConsumer.as_asgi()),
    re_path(r"ws/detection_loading_progress/(?P<record_id>\w+)/(?P<divide_time>\d+(\.\d+)?)/(?P<version>\w+\d+)/$", CounterModifiedProgressConsumer.as_asgi()),
    re_path(r"ws/modification_progress/(?P<record_id>\w+)/(?P<divide_time>\d+(\.\d+)?)/(?P<version>\w+\d+)/$", CounterModifiedProgressConsumer.as_asgi()),
    # Modified the pattern to be more flexible with version format (v1, v2, etc.)
    re_path(r"ws/actual_counter_progress/(?P<record_id>\w+)/(?P<divide_time>\d+(\.\d+)?)/(?P<version>\w+\d*)/$", ActualCounterProgressConsumer.as_asgi()),
    re_path(r"ws/downloading_results_progress/", DownloadingResultsProgress.as_asgi())
]