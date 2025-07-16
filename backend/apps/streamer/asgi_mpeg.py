from starlette.responses import StreamingResponse, PlainTextResponse
from starlette.applications import Starlette
from starlette.routing import Route
import cv2
import os
import sys
import dotenv
import time
def get_env_path():
    """Get the absolute path to the environment file."""
    if hasattr(sys, '_MEIPASS'):
        # Running in PyInstaller bundle - use the directory where the .exe is located
        env_path = os.path.abspath(os.path.join(os.path.dirname(sys.executable), "..", "..", ".hc_to_app_env"))
        return env_path
    else:
        # Running in development - use the BASE_DIR approach
        return os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../cameravision/resources/.hc_to_app_env'))

ENV_PATH = get_env_path()

dotenv.load_dotenv(ENV_PATH)

def generate_frames(rtsp_url):
    cap = cv2.VideoCapture(rtsp_url)
    if not cap.isOpened():
        raise RuntimeError("Cannot open RTSP stream")
    start_time = time.time()
    while True:
        if time.time() - start_time > 10:
            # Stop after 10 seconds to avoid infinite loop
            break
        success, frame = cap.read()
        if not success:
            break
        _, jpeg = cv2.imencode(".jpg", frame)
        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n" +
            jpeg.tobytes() + b"\r\n"
        )
    cap.release()

async def mjpeg_view(request):
    url = request.query_params.get("url")
    if not url or not url.startswith("rtsp://"):
        return PlainTextResponse("Invalid RTSP URL", status_code=400)
    return StreamingResponse(generate_frames(url), media_type="multipart/x-mixed-replace; boundary=frame")

async def health_check(request):
    return PlainTextResponse("OK", status_code=200)

app = Starlette(
    debug=True,
    routes=[
        Route("/", health_check),
        Route(f"/{os.getenv('API_HEALTH_CHECK', 'health')}/", health_check),
        Route(f"/{os.getenv('MJPEG_STREAM_URL')}/", mjpeg_view),
    ]
)
