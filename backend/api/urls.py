"""
# File: cameravision/src/backend/api/urls.py
# This file is part of CameraVision.
"""
import os
from django.urls import path
import dotenv
from . import views
from django.conf import settings
# Load environment variables

dotenv.load_dotenv(settings.ENV_PATH)

urlpatterns = [
    # Health check endpoint
    # This endpoint is used to check if the API is running and healthy.
    # It returns a simple JSON response with a status message.
    path(
        f"{os.getenv('API_HEALTH_CHECK')}",
        views.health_check,
    ),
    path(
        f"{os.getenv('API_STORE_RECORD_SCHEDULE')}",
        views.store_record_schedule,
    ),
    path(
        f"{os.getenv('API_GET_RECORD_SCHEDULE')}",
        views.get_record_schedule,
    ),
    path(
        f"{os.getenv('API_DELETE_RECORD_SCHEDULE')}",
        views.delete_record_schedule,
    ),
    path(
        f"{os.getenv('GET_RECORD_STATUS')}/<str:token>",
        views.get_record_status,
    ),
    path(
        f"{os.getenv('API_DOWNLOAD_DB')}",
        views.download_db,
    ),
    path(
        f"{os.getenv('API_GET_IPS')}",
        views.get_ips,
    ),
    path(
        f"{os.getenv('API_EDIT_RECORD')}",
        views.edit_record,
    ),
    path(
        f"{os.getenv('API_IMPORT_VIDEO_URL')}",
        views.import_video,
    ),
    path(
        f"{os.getenv('API_GET_RECORD_AUTOCOUNTS')}",
        views.get_record_counts,
    ),
    path(
        f"{os.getenv('API_GET_COUNTS_AT_TIME')}",
        views.get_counts_at_time,
    ),
    path(
        f"{os.getenv('API_COUNT_EXISTS')}",
        views.count_exists,
    ),
    path(
        f"{os.getenv('API_GET_MODIFIED_DETECTIONS_AT_TIME')}",
        views.get_modified_detections_at_time,
    ),
    path(
        f"{os.getenv('API_MODIFIED_DETECTION_EXISTS')}",
        views.modified_detection_exists,
    ),
    path(
        f"{os.getenv('API_DELETE_DETECTION')}",
        views.remove_detection,
    ),
    path(
        f"{os.getenv('API_DELETE_MODIFIED_DETECTION')}",
        views.remove_modified_detection,
    ),
    path(
        f"{os.getenv('API_GET_COUNTER_MANUAL_AUTO_RESULTS')}",
        views.get_counter_manual_auto_results,
    ),
    path(
        f"{os.getenv('API_GET_FRAME_AT_TIME')}",
        views.get_frame_at_time,
    ),
    path(
        f"{os.getenv('API_GET_DURATION_TIME')}",
        views.get_total_time
    )
]
