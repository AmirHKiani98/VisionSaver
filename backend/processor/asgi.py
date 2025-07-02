import os
import django  # Import django to call setup
from django.core.asgi import get_asgi_application
from fastapi import FastAPI, Request, Response, Header
from fastapi.templating import Jinja2Templates
from django.core.handlers.asgi import ASGIHandler
from django.conf import settings
from pathlib import Path

# Set the default settings module for Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')

# Call django.setup() to initialize the app registry
django.setup()

# Initialize Django ASGI application
django_app = ASGIHandler()

# Initialize FastAPI application
fastapi_app = FastAPI()
templates = Jinja2Templates(directory="templates")
CHUNK_SIZE = 1024 * 1024

@fastapi_app.get("/")
async def read_root(request: Request):
    return templates.TemplateResponse("index.htm", context={"request": request})

@fastapi_app.get("/video/{record_id}")
async def video_endpoint(record_id: str, range: str = Header(None)):
    print(f"Received request for video: {record_id}")
    video_path = Path(settings.MEDIA_ROOT) / f"{record_id}.mp4"
    print(f"Resolved video path: {video_path}")
    
    if not video_path.exists():
        print("Video not found")
        return Response(status_code=404, content="Video not found")

    print(f"Processing range header: {range}")
    start, end = range.replace("bytes=", "").split("-")
    start = int(start)
    end = int(end) if end else start + CHUNK_SIZE
    print(f"Start: {start}, End: {end}")

    with open(video_path, "rb") as video:
        video.seek(start)
        data = video.read(end - start)
        filesize = str(video_path.stat().st_size)
        headers = {
            'Content-Range': f'bytes {str(start)}-{str(end)}/{filesize}',
            'Accept-Ranges': 'bytes'
        }
        print(f"Returning video chunk with headers: {headers}")
        return Response(data, status_code=206, headers=headers, media_type="video/mp4")

# Combine Django and FastAPI using Starlette's routing
from starlette.applications import Starlette
from starlette.routing import Mount

application = Starlette(routes=[
    Mount("/streamer", app=fastapi_app),  # FastAPI app handles /streamer routes
    Mount("/", app=django_app),  # Django app handles root and other routes
])