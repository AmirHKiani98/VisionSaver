import os
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
            print(f"Generated URL for record {record_id}: {url}")
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
    Get a specific recorded video by its ID.
    """
    video_path = os.path.join(settings.MEDIA_ROOT, f'{record_id}.mp4')
    print(f"Streaming video from: {video_path}")
    if os.path.exists(video_path):
        return FileResponse(open(video_path, 'rb'), as_attachment=True, filename=f'{record_id}.mp4', content_type='video/mp4')
    else:
        return HttpResponseNotFound('Video not found')


def get_done_records_id_from_token(token):
    """
    There are multiple records with the same token. We'll
    get those that are done here from their token.
    :param token: The token associated with the record."""
    records = Record.objects.filter(token=token, done=True)
    if not records:
        return None
    return [record.id for record in records]