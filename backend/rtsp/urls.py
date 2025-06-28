from django.urls import path
from . import views

urlpatterns = [
    path('mjpeg_stream/', views.mjpeg_stream, name='mjpeg_stream'),
]