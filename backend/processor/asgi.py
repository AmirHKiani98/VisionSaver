import os
import sys
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