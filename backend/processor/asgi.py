import os
import sys
import dotenv

def get_env_path():
    """Get the absolute path to the environment file."""
    if hasattr(sys, '_MEIPASS'):
        return os.path.abspath(os.path.join(os.path.dirname(sys.executable), "..", "..", ".hc_to_app_env"))
    else:
        return os.path.abspath(os.path.join(os.path.dirname(__file__), '../../.hc_to_app_env'))

ENV_PATH = get_env_path()
dotenv.load_dotenv(ENV_PATH)

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'processor.settings')

# 🔁 Factory-compatible ASGI application
def create_app():
    import django
    from channels.routing import ProtocolTypeRouter, URLRouter
    from django.core.asgi import get_asgi_application
    from channels.auth import AuthMiddlewareStack
    from routing import websocket_urlpatterns

    django.setup()

    return ProtocolTypeRouter({
        "http": get_asgi_application(),
        "websocket": AuthMiddlewareStack(
            URLRouter(websocket_urlpatterns)
        ),
    })
