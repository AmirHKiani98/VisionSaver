"""
RTSP Stream Processing Views
"""
import subprocess
import json
from django.shortcuts import render
from django.http import StreamingHttpResponse, HttpResponse
import cv2
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

def mjpeg_stream(request):
    """
    Stream MJPEG from a single RTSP URL using GET.
    Expects query parameter: ?url=rtsp://...
    Streams frames from the given URL.
    """
    url = request.GET.get('url')
    if not url:
        return HttpResponse("Bad Request: 'url' query parameter is required", status=400)

    def generate():
        cap = cv2.VideoCapture(url) # pylint: disable=no-member
        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    continue
                ret, jpeg = cv2.imencode('.jpg', frame) # pylint: disable=no-member
                if not ret:
                    continue
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')
        finally:
            cap.release()

    return StreamingHttpResponse(
        generate(),
        content_type='multipart/x-mixed-replace; boundary=frame'
    )
