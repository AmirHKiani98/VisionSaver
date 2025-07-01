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
        f"{os.getenv('API_STORE_RECORD_SCHEDULE')}",
        views.store_record_schedule,
    ),
    path(
        f"{os.getenv('API_GET_RECORD_SCHEDULE')}",
        views.get_record_schedule,
    ),
]
