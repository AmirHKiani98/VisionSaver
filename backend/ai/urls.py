import os
from django.urls import path
import dotenv
from . import views
from django.conf import settings
# Load environment variables

dotenv.load_dotenv(settings.ENV_PATH)

urlpatterns = [
    # Health check endpoint
    # This endpoint is used to check if the API is running and healthy.
    # It returns a simple JSON response with a status message.
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
        f"{os.getenv('AI_START_COUNTING')}",
        views.start_counting,
    )
]