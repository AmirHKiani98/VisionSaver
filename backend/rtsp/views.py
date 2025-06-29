"""
RTSP Stream Processing Views
"""
import subprocess
import json
from django.shortcuts import render
from django.http import StreamingHttpResponse, HttpResponse
import cv2
import numpy as np
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
    Detects if the stream stops completely and ends the response.
    If the stream fails or stops, returns a notification message.
    """
    url = request.GET.get('url')
    if not url:
        return HttpResponse("Bad Request: 'url' query parameter is required", status=400)

    def generate():
        cap = cv2.VideoCapture(url)  # pylint: disable=no-member
        consecutive_failures = 0
        max_failures = 30  # e.g., after 30 failed reads, consider stream stopped
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

    # If you want to catch ImportError for numpy, move the import here:
    # try:
    #     import numpy as np
    # except ImportError:
    #     return HttpResponse("Server error: numpy is required for notifications.", status=500)

    return StreamingHttpResponse(
        generate(),
        content_type='multipart/x-mixed-replace; boundary=frame'
    )
