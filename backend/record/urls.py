"""
# File: cameravision/src/backend/api/urls.py
# This file is part of CameraVision.
"""
import os
from django.urls import path
import dotenv
from . import views
dotenv.load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

urlpatterns = [
    path(
        f"{os.getenv('RECORD_FUNCTION_NAME') or 'record'}/",
        views.start_record_rtsp,
        name=os.getenv('RECORD_FUNCTION_NAME') or 'record'
    ),
    path(
        f"{os.getenv('RECORD_STREAM_FUNCTION_NAME') or 'stream'}/<str:record_id>/",
        views.stream_video,
        name=os.getenv('RECORD_STREAM_FUNCTION_NAME') or 'stream'
    ),
    path(
        f"{os.getenv('GET_RECORDS_URL') or 'get_records'}/<str:token>/",
        views.get_records_url,
        name=os.getenv('GET_RECORDS_URL') or 'get_records'
    ),
]
