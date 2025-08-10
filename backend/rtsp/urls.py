import os
from django.urls import path
from . import views
import dotenv
from django.conf import settings
# Load environment variables

dotenv.load_dotenv(settings.ENV_PATH)

urlpatterns = [
    path(f'{os.getenv("STREAM_FUNCTION_NAME")}', views.mjpeg_stream, name=f'{os.getenv("STREAM_FUNCTION_NAME")}'),
    path(f'{os.getenv("GET_RECORD_RESOLVED_URL")}', views.get_record_resolved_url, name=f'{os.getenv("GET_RECORD_RESOLVED_URL")}'),
]
