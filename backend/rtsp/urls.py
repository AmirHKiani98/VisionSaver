import os
from django.urls import path
from . import views
import dotenv
dotenv.load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))
STREAM_FUNCTION_NAME = os.getenv("STREAM_FUNCTION_NAME")
urlpatterns = [
    path(f'{STREAM_FUNCTION_NAME}/', views.mjpeg_stream, name=f'{STREAM_FUNCTION_NAME}'),
]
