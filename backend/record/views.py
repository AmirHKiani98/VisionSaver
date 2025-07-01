import os
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.http import StreamingHttpResponse, HttpResponseNotFound
import dotenv
from .models import Record
from django.views.decorators.csrf import csrf_exempt
from wsgiref.util import FileWrapper


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
        backend_domain = os.getenv("BACKEND_SERVER_DOMAIN", "localhost")
        backend_port = os.getenv("BACKEND_SERVER_PORT", "5000")
        stream_func = os.getenv("RECORD_STREAM_FUNCTION_NAME", "record/stream_record")
        url = f'http://{backend_domain}:{backend_port}/{stream_func}'
        urls = []
        for record_id in record_ids:
            urls.append(
                {
                    "id": record_id,
                    "url": f"{url}/{record_id}/",
                }
            )
        return JsonResponse({"urls": urls}, status=200)
        
    except Exception as e:
        return JsonResponse({"error": f"An error occurred: {str(e)}"}, status=500)




def stream_video(request, record_id):
    record = get_object_or_404(Record, id=record_id)
    cache_dir = os.getenv("CACHE_DIR", ".cache")
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    file_path = os.path.join(base_dir, cache_dir, f"{record.id}.mp4")
    try:
        video_file = open(file_path, 'rb')
    except FileNotFoundError:
        print(f"Video file not found: {file_path}")
        return HttpResponseNotFound('Video not found.')

    try:
        wrapper = FileWrapper(video_file)
        response = StreamingHttpResponse(wrapper, content_type='video/mp4')
        response['Content-Length'] = os.path.getsize(file_path)
        response['Accept-Ranges'] = 'bytes'
        return response
    except BrokenPipeError:
        print("Client disconnected before the response was fully sent.")
        return HttpResponseNotFound('Client disconnected.')


def get_done_records_id_from_token(token):
    """
    There are multiple records with the same token. We'll
    get those that are done here from their token.
    :param token: The token associated with the record."""
    records = Record.objects.filter(token=token, done=True)
    if not records:
        return None
    return [record.id for record in records]