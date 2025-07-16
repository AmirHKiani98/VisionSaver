import os
import django
from channels.routing import get_default_application
from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from processor.routing import websocket_urlpatterns   # Import your routing module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'processor.settings')
django.setup()
application = get_default_application()

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(URLRouter(websocket_urlpatterns)),
})