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
    path(
        f"{os.getenv('GET_RECORD_URL') or 'get_record'}/<int:record_id>/",
        views.get_record_url,
        name=os.getenv('GET_RECORD_URL') or 'get_record'
    ),
    path(
        f"{os.getenv('GET_RECORD_TURN_URL') or 'get_record_turn'}/<int:record_id>/",
        views.get_record_turn,
        name=os.getenv('GET_RECORD_TURN_URL') or 'get_record_turn'
    ),
    path(
        f"{os.getenv('ADD_RECORD_TURN_URL') or 'add_record_turn'}",
        views.add_record_turn,
        name=os.getenv('ADD_RECORD_TURN_URL') or 'add_record_turn'
    ),
    path(
        f"{os.getenv('REMOVE_RECORD_LOG') or 'remove_record_log'}/<int:log_id>/",
        views.remove_record_log,
        name=os.getenv('REMOVE_RECORD_LOG') or 'remove_record_log'
    )
]
