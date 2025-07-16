from starlette.responses import StreamingResponse
from starlette.requests import Request

from views import mjpeg_generator  # Import the generator

async def rtsp_mjpeg_stream(scope, receive, send):
    assert scope["type"] == "http"
    request = Request(scope, receive=receive)
    response = StreamingResponse(mjpeg_generator(), media_type="multipart/x-mixed-replace; boundary=frame")
    await response(scope, receive, send)