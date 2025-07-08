import os
from django.urls import path
from . import views
import dotenv
dotenv.load_dotenv(os.path.join(os.path.dirname(__file__), '../.hc_to_app_env'))
urlpatterns = [
    path(f'{os.getenv("STREAM_FUNCTION_NAME")}/', views.mjpeg_stream, name=f'{os.getenv("STREAM_FUNCTION_NAME")}'),
    path(f'{os.getenv("GET_RECORD_RESOLVED_URL")}/<str:raw_url>/', views.get_record_resolved_url, name=f'{os.getenv("GET_RECORD_RESOLVED_URL")}'),
]
