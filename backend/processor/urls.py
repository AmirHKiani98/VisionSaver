from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse

urlpatterns = [
    path('', lambda request: HttpResponse("✅ Django backend is running.")),  # fixed line
    path('admin/', admin.site.urls),
    path('rtsp/', include('rtsp.urls')),
    path('', include('record.urls')),
    path('', include('api.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
