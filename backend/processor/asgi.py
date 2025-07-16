import os
import sys
import dotenv
# Load environment variables because django settings will load after this. This function exists in settings.py too.
def get_env_path():
    """Get the absolute path to the environment file."""
    if hasattr(sys, '_MEIPASS'):
        # Running in PyInstaller bundle - use the directory where the .exe is located
        env_path = os.path.abspath(os.path.join(os.path.dirname(sys.executable), "..", "..", ".hc_to_app_env"))
        return env_path
    else:
        # Running in development - use the BASE_DIR approach
        return os.path.abspath(os.path.join(os.path.dirname(__file__), '../../.hc_to_app_env'))

ENV_PATH = get_env_path()

dotenv.load_dotenv(ENV_PATH)

import django
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from channels.auth import AuthMiddlewareStack
from backend.routing import websocket_urlpatterns  # this must be your own defined patterns

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))



os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.processor.settings')
django.setup()

application = ProtocolTypeRouter({
    "http": get_asgi_application(),  # For normal Django views
    "websocket": AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)  # For your ws:// routes
    ),
})