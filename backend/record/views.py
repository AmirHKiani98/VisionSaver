import os
import json
from urllib import response
from django.http import JsonResponse, FileResponse
from django.shortcuts import get_object_or_404
from django.http import HttpResponseNotFound
import dotenv
from .models import Record, RecordLog  # Import models here to avoid circular import issues
from django.views.decorators.csrf import csrf_exempt

# Import settings django
from django.conf import settings


# Create your views here.
from .rtsp_object import RTSPObject
from django.db.models import Count, Max
dotenv.load_dotenv(os.path.join(os.path.dirname(__file__), '../.hc_to_app_env'))

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
            os.path.join(settings.MEDIA_ROOT, f'{record_id}.mkv')
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
    Adds debug output to help diagnose streaming issues.
    """
    video_path = None
    content_type = None
    debug_info = []
    should_mp4 = request.GET.get('mp4', 'false').lower() == 'true'
    if should_mp4:
        possible_exts = ['.mp4']
    else:
        possible_exts = ['.mkv', '.mp4']
    for ext in possible_exts:
        path = os.path.join(settings.MEDIA_ROOT, f'{record_id}{ext}')
        debug_info.append(f"Checking for file: {path}")
        if os.path.exists(path):
            video_path = path
            content_type = 'video/mp4' if ext == '.mp4' else 'video/x-matroska'
            debug_info.append(f"Found file: {video_path}")
            break
    if not video_path:
        debug_info.append("No video file found for record_id: {}".format(record_id))
        with open("stream_debug.log", "a+") as debug_file:
            debug_file.write("[DEBUG stream_video] " + "\n".join(debug_info) + "\n")
        return HttpResponseNotFound(f"No video file found for record_id: {record_id} in {path}")
    else:
        with open("stream_debug.log", "a+") as debug_file:
            debug_file.write("[DEBUG stream_video] " + "\n".join(debug_info) + "\n")

    file_size = os.path.getsize(video_path)
    debug_info.append(f"File size: {file_size}")
    range_header = request.META.get('HTTP_RANGE', '')
    debug_info.append(f"HTTP_RANGE: {range_header}")
    
    if range_header:
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
        response['Content-Disposition'] = f'inline; filename="{record_id}{os.path.splitext(video_path)[1]}"'
        return response
    else:
        response = FileResponse(open(video_path, 'rb'), content_type=content_type)
        response['Content-Length'] = str(file_size)
        response['Accept-Ranges'] = 'bytes'
        response['Content-Disposition'] = f'inline; filename="{record_id}{os.path.splitext(video_path)[1]}"'
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

@csrf_exempt
def get_record_turn(request, record_id):
    """
    Get record info by record ID.
    """
    try:
        
        try:
            
            if not record_id:
                return JsonResponse(
                    {"error": "'record_id' is required."},
                    status=400
                )
            
            # Fetch the record and its latest log entry
            record = Record.objects.get(id=record_id)

            # Count each possible turn_movement, ensuring all are present
            # turn_types = ['left', 'right', 'through', 'approach']
            turn_movements = (
                RecordLog.objects
                .filter(record=record)
                .values("id", "time", "turn_movement")
            )
            # Convert queryset to a dict for easy lookup
            
            max_time = (
                RecordLog.objects
                .filter(record=record)
                .aggregate(max_time=Max('time'))
                .get('max_time')
            )

            result = {
                "turns": list(turn_movements),
                "checkpoint": max_time if max_time is not None else 0,
                "video_duration": record.duration*60,
            }
            return JsonResponse(result, status=200)
            
        except Record.DoesNotExist:
            return JsonResponse({"error": "Record not found."}, status=404)
    except Exception as e:
        return JsonResponse({"error": f"An error occurred: {str(e)}"}, status=500)

@csrf_exempt
def add_record_turn(request):
    """
    Add a new record entry.
    This view should be triggered via a POST request with the necessary parameters.
    """
    if request.method != 'POST':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
    try:
        data = json.loads(request.body.decode('utf-8'))
        turn = data.get('turn')
        time = data.get('time')
        record_id = data.get('record_id')
        print(f"Adding record turn: {turn}, time: {time}, record_id: {record_id}")
        # Print types
        print(f"Types - turn: {type(turn)}, time: {type(time)}, record_id: {type(record_id)}")
        if not record_id or not turn or time is None:
            return JsonResponse(
                {"error": "'record_id', 'turn', and 'time' are required."},
                status=400
            )
        record = Record.objects.get(id=record_id)
        if not record:
            return JsonResponse({"error": "Record not found."}, status=404)
        if not record.done:
            return JsonResponse({"error": "Record is not done yet."}, status=400)

        if not isinstance(turn, str) or not isinstance(time, int):
            return JsonResponse(
                {"error": "'turn' must be a string and 'time' must be an integer."},
                status=400
            )
        if time < 0:
            return JsonResponse(
                {"error": "'time' must be a non-negative integer."},
                status=400
            )
        # Create a new RecordLog entry
        record_log = RecordLog.objects.create(
            record=record,
            turn_movement=turn,
            time=time
        )
        record_log.save()
        return JsonResponse(
            {"message": "Record log entry added successfully.", "log_id": record_log.id},
            status=201
        )
    except Record.DoesNotExist:
        print(f"Record with ID {record_id} not found.")
        return JsonResponse({"error": "Record not found."}, status=404)
    except json.JSONDecodeError:
        print("Invalid JSON body.")
        return JsonResponse({"error": "Invalid JSON body."}, status=400)
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        return JsonResponse({"error": f"An error occurred: {str(e)}"}, status=500)

@csrf_exempt
def remove_record_log(request, log_id):
    """
    Remove a record log entry by ID.
    This view should be triggered via a POST request with the ID of the log entry to remove.
    """
    if request.method != 'DELETE':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
    try:
        if not log_id:
            return JsonResponse({"error": "'log_id' is required."}, status=400)
        try:
            record_log = RecordLog.objects.get(id=log_id)
            record_log.delete()
            return JsonResponse({"message": "Record log entry removed successfully."}, status=200)
        except RecordLog.DoesNotExist:
            return JsonResponse({"error": "Record log entry not found."}, status=404)
    except Exception as e:
        return JsonResponse({"error": f"An error occurred: {str(e)}"}, status=500)