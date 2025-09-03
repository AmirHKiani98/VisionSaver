import dotenv
from django.conf import settings
import os
import requests
dotenv.load_dotenv(settings.ENV_PATH)

logger = settings.APP_LOGGER
