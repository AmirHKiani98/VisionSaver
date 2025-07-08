"""
RTSP Stream Processing Views
"""

from django.shortcuts import render
from django.http import StreamingHttpResponse, HttpResponse
import cv2
import numpy as np
import requests
from django.http import JsonResponse
from .utility import get_stream_type, get_ip_from_url


import logging

logger = logging.getLogger(__name__)


# Create your views here.

def process_stream(request):
    """
    Process the RTSP stream and return the result.
    This is a placeholder function that should be implemented with actual processing logic.
    """
    # Here you would typically handle the RTSP stream processing
    # For now, we just return a simple response
    return render(
        request,
        'rtsp/process_stream.html',
        {
            'message': 'RTSP stream processed successfully.'
        }
    )

def get_record_resolved_url(request):
    """
    Get the resolved RTSP URL for a specific IP address.
    """
    raw_url = request.GET.get('url')
    if not raw_url:
        return JsonResponse({'error': 'Missing url parameter'}, status=400)
    
    ip = get_ip_from_url(raw_url)
    if not ip:
        return JsonResponse({'error': 'Invalid RTSP URL'}, status=400)
    
    stream_type = get_stream_type(ip)
    if stream_type == 'costar':
        for i in range(1, 10):
            try:
                response = requests.get(f'http://{ip}/jpegpull/{i}', timeout=5)
                if response.status_code == 200:
                    resolved_url = f'rtsp://admin:admin@{ip}/Stream{i}'
                    return JsonResponse({'resolved_url': resolved_url})
            except requests.RequestException:
                continue
        return JsonResponse({'error': 'Could not resolve costar stream'}, status=500)
    elif stream_type == 'supervisor':
        # For supervisor, we assume the raw_url is already in the correct format
        # and we just return it as the resolved URL.
        # You might want to add additional logic here if needed.
        stream_channel = raw_url.split('/')[-1]  # Extract the channel from the URL
        resolved_url = f'rtsp://{ip}/{stream_channel}'
        return JsonResponse({'resolved_url': resolved_url})
    # For 'supervisor' or fallback
    return JsonResponse({'resolved_url': raw_url})

def generate_video(url):
    cap = cv2.VideoCapture(url)  # pylint: disable=no-member
    consecutive_failures = 0
    max_failures = 120  # e.g., after 30 failed reads, consider stream stopped
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                consecutive_failures += 1
                if consecutive_failures >= max_failures:
                    # Send a notification frame before breaking
                    msg = "RTSP stream stopped or unavailable."
                    # Create a simple black image with the message
                    notif_frame = 255 * np.ones((100, 400, 3), dtype=np.uint8)
                    cv2.putText(
                        notif_frame,
                        msg,
                        (10, 60),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.7,
                        (0, 0, 255),
                        2
                    )
                    ret, jpeg = cv2.imencode('.jpg', notif_frame)
                    if ret:
                        yield (b'--frame\r\n'
                            b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')
                    break  # Stop streaming after notification
                continue
            consecutive_failures = 0
            ret, jpeg = cv2.imencode('.jpg', frame)  # pylint: disable=no-member
            if not ret:
                continue
            yield (b'--frame\r\n'
                b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')
    finally:
        cap.release()


def mjpeg_stream(request):
    """
    Stream MJPEG from a single RTSP URL using GET.
    Expects query parameter: ?url=rtsp://...
    Streams frames from the given URL.
    Detects if the stream stops completely and ends the response.
    If the stream fails or stops, returns a notification message.
    """
    url = request.GET.get('url')
    return StreamingHttpResponse(
        generate_video(url),
        content_type='multipart/x-mixed-replace; boundary=frame'
    )

        
