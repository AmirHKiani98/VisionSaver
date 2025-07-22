import os
import json
from urllib import response
from django.http import JsonResponse, FileResponse
from django.shortcuts import get_object_or_404
from django.http import HttpResponseNotFound
import dotenv
from .models import Record, RecordLog, RecordNote  # Import models here to avoid circular import issues
from django.views.decorators.csrf import csrf_exempt
import threading
# Import settings django
from django.conf import settings
from record.rtsp_object import RTSPObject

logger = settings.APP_LOGGER
def record_rtsp_task(record_id, camera_url, duration, output_file):

    print(f"Starting recording task for record ID {record_id}")
    try:
        record = Record.objects.get(id=record_id)
        record.in_process = True
        record.save()

        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        rtsp_obj = RTSPObject(camera_url)
        done = rtsp_obj.record(duration, output_file, record_id)

        if done:
            record.done = True
            record.error = ""
        else:
            record.done = False
            record.error = f"File doesn't exist at {output_file}"
            # logger.error(f"Recording file doesn't exist: {output_file}")

    except Exception as e:
        import traceback
        # logger.error(f"Recording error for {record_id}: {e}\n{traceback.format_exc()}")
        record = Record.objects.get(id=record_id)
        record.done = False
        record.error = str(e)

    record.in_process = False
    record.save()
    print(f"Finished recording for record ID {record_id}")

# Create your views here.
from .rtsp_object import RTSPObject
from django.db.models import Max
from django.conf import settings
# Load environment variables

dotenv.load_dotenv(settings.ENV_PATH)

@csrf_exempt
def start_record_rtsp(request):
    """
    Start a recording of an RTSP stream.
    This view should be triggered via a POST request with the necessary parameters.
    """
    if request.method != 'POST':
        # logger.error("Method not allowed for start_record_rtsp.")
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
    try:
        data = json.loads(request.body.decode('utf-8'))
        record_id = data.get('record_id')
        camera_url = data.get('camera_url')
        duration = data.get('duration', 60)  # Default to 60 seconds if not provided
        output_file = data.get('output_file', f"{settings.MEDIA_ROOT}/{record_id}.mkv")
        # logger.info(f"Starting recording for record ID {record_id} at {camera_url} for {duration} seconds.")
        if not record_id or not camera_url:
            # logger.error("Missing 'record_id' or 'camera_url' in request data.")
            return JsonResponse({"error": "'record_id' and 'camera_url' are required."}, status=400)

        # Create a new Record instance
        record = Record.objects.get(id=record_id)
        if not record:
            # logger.error(f"Record with ID {record_id} not found.")
            return JsonResponse({"error": "Record not found."}, status=404)
        # logger.info(f"Record found: {record}")

        # Start the recording in a separate thread
        threading.Thread(
            target=record_rtsp_task,
            args=(record.id, camera_url, duration, output_file)
        ).start()
        # logger.info(f"Started recording for record ID {record.id} at {camera_url} for {duration} seconds.")
        return JsonResponse({"message": "Recording started successfully.", "record_id": record.id}, status=200)

    except json.JSONDecodeError:
        # logger.error("Invalid JSON body in request.")
        return JsonResponse({"error": "Invalid JSON body."}, status=400)
    except Exception as e:
        # logger.error(f"An error occurred while starting the recording: {str(e)}")
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

@csrf_exempt
def get_record_notes(request, record_id):
    """
    Get all notes for a specific record.
    """
    try:
        if not record_id:
            return JsonResponse({"error": "'record_id' is required."}, status=400)

        try:
            record = Record.objects.get(id=record_id)
            notes = RecordNote.objects.filter(record=record).values('id', 'note', 'created_at')
            return JsonResponse({"notes": list(notes)}, status=200)
        except Record.DoesNotExist:
            return JsonResponse({"error": "Record not found."}, status=404)
    except Exception as e:
        return JsonResponse({"error": f"An error occurred: {str(e)}"}, status=500)
    
@csrf_exempt
def add_record_note(request):
    """
    Add a note to a specific record.
    This view should be triggered via a POST request with the necessary parameters.
    """
    if request.method != 'POST':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
    try:
        data = json.loads(request.body.decode('utf-8'))
        record_id = data.get('record_id')
        note = data.get('note')
        
        if not record_id or not note:
            return JsonResponse({"error": "'record_id' and 'note' are required."}, status=400)

        record = Record.objects.get(id=record_id)
        if not record:
            return JsonResponse({"error": "Record not found."}, status=404)

        # Create a new RecordNote entry
        record_note = RecordNote.objects.create(record=record, note=note)
        record_note.save()
        return JsonResponse({"message": "Record note added successfully.", "note_id": record_note.id, "time": record_note.created_at.strftime("%Y-%m-%d %H:%M:%S"), "note":note
            }, status=201)
    except Record.DoesNotExist:
        return JsonResponse({"error": "Record not found."}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)
    except Exception as e:
        return JsonResponse({"error": f"An error occurred: {str(e)}"}, status=500)
    
@csrf_exempt
def set_record_finished_status(request):
    """
    Set a record as finished.
    This view should be triggered via a POST request with the record ID.
    """
    if request.method != 'POST':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
    try:
        data = json.loads(request.body.decode('utf-8'))
        record_id = data.get('record_id')
        finished_counting = data.get('finished_counting', True)  # Default to True if not provided
        if not record_id:
            return JsonResponse({"error": "'record_id' is required."}, status=400)

        try:
            record = Record.objects.get(id=record_id)
            record.finished_counting = finished_counting
            record.save()
            return JsonResponse({"message": "Record marked as finished."}, status=200)
        except Record.DoesNotExist:
            return JsonResponse({"error": "Record not found."}, status=404)
    except Exception as e:
        return JsonResponse({"error": f"An error occurred: {str(e)}"}, status=500)