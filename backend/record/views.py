import os
import json
from urllib import response
from django.http import JsonResponse, FileResponse
from django.shortcuts import get_object_or_404
from django.http import StreamingHttpResponse, HttpResponseNotFound
import dotenv
from .models import Record
from django.views.decorators.csrf import csrf_exempt
from rest_framework.response import Response

# Import settings django
from django.conf import settings


# Create your views here.
from .rtsp_object import RTSPObject
dotenv.load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

def start_record_rtsp(request):
    """
    Start a recording of an RTSP stream.
    This view should be triggered via a POST request with the necessary parameters.
    """
    cache_dir = os.getenv("CACHE_DIR", ".cache")
    if not os.path.isdir(cache_dir):
        os.makedirs(cache_dir)
    if request.method != 'POST':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
    
    try:
        camera_url = request.POST.get('camera_url')
        duration = request.POST.get('duration')
        start_time = request.POST.get('start_time')
        if not camera_url or not duration or not start_time:
            return JsonResponse(
                {
                    "error": (
                        "One or more of the following variables are not defined: "
                        "'camera_url', 'duration', and 'start_time'"
                    )
                },
                status=400
            )
        duration = int(duration)
        if duration <= 0:
            return JsonResponse(
                {"error": "'duration' must be a positive integer."},
                status=400
            )
        rtsp_obj = RTSPObject(camera_url)
        try:
            rtsp_obj.record(duration, f"{cache_dir}/recording_{start_time}_{duration}.mp4")
        except Exception as e:
            return JsonResponse({"error": f"An error occurred while recording: {str(e)}"}, status=500)

        
        # For demonstration, we will just return a success message.
        return JsonResponse(
            {"message": f"Recording started for {camera_url} for {duration} seconds."},
            status=200
        )
    except Exception as e:
        return JsonResponse({"error": f"An error occurred: {str(e)}"}, status=500)


@csrf_exempt
def get_records_url(request, token):
    """
    Get a list of all recorded videos.
    This view should be triggered via a GET request.
    """
    if request.method != 'GET':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
    try:
        
        record_ids = get_done_records_id_from_token(token)
        if not record_ids:
            return JsonResponse({"error": "No records found for the provided token."}, status=404)
        records_path = {record_id:
            os.path.join(settings.MEDIA_ROOT, f'{record_id}.mp4')
            for record_id in record_ids
        }
        urls = []
        for record_id, record_path in records_path.items():
            
            if not os.path.exists(record_path):
                continue
            domain = os.getenv('BACKEND_SERVER_DOMAIN')
            port = os.getenv('BACKEND_SERVER_PORT')
            func_name = os.getenv('RECORD_STREAM_FUNCTION_NAME')
            url = (
                f"http://{domain}:{port}/{func_name}/{record_id}"
            )
            urls.append(
                {
                    "id": record_id,
                    "url": url,
                }
            )

        return JsonResponse({"urls": urls}, status=200)

    except Exception as e:
        return JsonResponse({"error": f"An error occurred: {str(e)}"}, status=500)


def stream_video(request, record_id):
    """
    Streams video with support for HTTP Range requests (seeking).
    """
    video_path = os.path.join(settings.MEDIA_ROOT, f'{record_id}.mp4')
    print(f"Streaming video from: {video_path}")
    if not os.path.exists(video_path):
        return HttpResponseNotFound('Video not found')

    file_size = os.path.getsize(video_path)
    range_header = request.META.get('HTTP_RANGE', '')
    content_type = 'video/mp4'
    if range_header:
        # Example: "bytes=0-1023"
        range_match = range_header.strip().lower().replace('bytes=', '').split('-')
        try:
            start = int(range_match[0]) if range_match[0] else 0
            end = int(range_match[1]) if len(range_match) > 1 and range_match[1] else file_size - 1
        except ValueError:
            start = 0
            end = file_size - 1
        if end >= file_size:
            end = file_size - 1
        length = end - start + 1
        f = open(video_path, 'rb')
        f.seek(start)
        response = FileResponse(
            f,
            status=206,
            content_type=content_type
        )
        response['Content-Range'] = f'bytes {start}-{end}/{file_size}'
        response['Content-Length'] = str(length)
        response['Accept-Ranges'] = 'bytes'
        response['Content-Disposition'] = f'inline; filename="{record_id}.mp4"'
        return response
    else:
        response = FileResponse(open(video_path, 'rb'), content_type=content_type)
        response['Content-Length'] = str(file_size)
        response['Accept-Ranges'] = 'bytes'
        response['Content-Disposition'] = f'inline; filename="{record_id}.mp4"'
        return response


def get_done_records_id_from_token(token):
    """
    There are multiple records with the same token. We'll
    get those that are done here from their token.
    :param token: The token associated with the record."""
    records = Record.objects.filter(token=token, done=True)
    if not records:
        return None
    return [record.id for record in records]



@csrf_exempt
def get_record_url(request, record_id):
    """
    Get record Url by record ID. This is going to be POST.
    """
    try:
        if not record_id:
            return JsonResponse({"error": "'record_id' is required."}, status=400)

        try:
            record = Record.objects.get(id=record_id)
            if not record.done:
                return JsonResponse({"error": "Record is not done yet."}, status=400)
            domain = os.getenv('BACKEND_SERVER_DOMAIN')
            port = os.getenv('BACKEND_SERVER_PORT')
            func_name = os.getenv('RECORD_STREAM_FUNCTION_NAME')
            url = (
                f"http://{domain}:{port}/{func_name}/{record_id}"
            )
            return JsonResponse({"url": url}, status=200)
        except Record.DoesNotExist:
            return JsonResponse({"error": "Record not found."}, status=404)
    except Exception as e:
        return JsonResponse({"error": f"An error occurred: {str(e)}"}, status=500)