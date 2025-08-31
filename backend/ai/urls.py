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
        f"{os.getenv('AI_START_MODIFIER')}",
        views.start_modifier,
    ),
    path(
        f"{os.getenv('AI_UPDATE_DETECTION_PROGRESS')}",
        views.update_detection_progress,
    ),
    path(
        f"{os.getenv('AI_START_COUNTER')}",
        views.start_auto_counting,
    ),
]