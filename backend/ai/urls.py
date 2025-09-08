import os
from django.urls import path
import dotenv
from . import views
from django.conf import settings
# Load environment variables

dotenv.load_dotenv(settings.ENV_PATH)

urlpatterns = [
    path(
        f"{os.getenv('AI_ADD_LINES')}",
        views.add_line,
    ),
    path(
        f"{os.getenv('AI_GET_LINES')}",
        views.get_lines,
    ),
    path(
        f"{os.getenv('AI_START_DETECTING')}",
        views.run_car_detection,
    ),
    path(
        f"{os.getenv('AI_TERMINATE_DETECTION_PROCESS')}",
        views.terminate_detection_process,
    ),
    path(
        f"{os.getenv('API_IS_DETECTION_IN_PROCESS')}",
        views.check_if_detection_in_process,
    ),
    path(
        f"{os.getenv('AI_DETECTION_EXISTS')}",
        views.check_if_detection_exists,
    ),
    path(
        f"{os.getenv('AI_DELETE_DETECTION')}",
        views.delete_detection,
    ),
]