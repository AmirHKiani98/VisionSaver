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
    
]
