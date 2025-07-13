"""
# File: cameravision/src/backend/api/urls.py
# This file is part of CameraVision.
"""
import os
from django.urls import path
import dotenv
from . import views
dotenv.load_dotenv(os.path.join(os.path.dirname(__file__), '../.hc_to_app_env'))

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
    )
]
