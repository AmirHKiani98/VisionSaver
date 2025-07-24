import os
from django.urls import path
import dotenv
from . import views
from django.conf import settings
# Load environment variables

dotenv.load_dotenv(settings.ENV_PATH)

urlpatterns = [
    # Add your URL patterns here
    path(
        f"{os.getenv('AI_ADD_LINE')}",
        views.add_line,
    ),
]