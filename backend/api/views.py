import json
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from record.models import Record, RecordLog
from collections import defaultdict
import re
import pandas as pd
from django.utils.dateparse import parse_datetime
import os
import subprocess
from ai.models import AutoCounter
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

# Create your views here.



from django.http import HttpResponse
from django.conf import settings
def health_check(request):
    return HttpResponse("OK", status=200)
logger = settings.APP_LOGGER
@csrf_exempt
def store_record_schedule(request):
    """
    Add a recording to do (should be triggered via cronjob) for the system.
    """
    # The request should be a POST containing the following information:
    # - camera_url - the camera_url of the RTSP stream to record
    # - duration - the duration of the recording in seconds
    # - start_time - the start time of the recording in ISO format (default to now)
    if request.method != 'POST':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
    try:
        if request.content_type == 'application/json':
            data = json.loads(request.body.decode('utf-8'))
        else:
            data = request.POST
        camera_url = data.get('camera_url')
        duration = data.get('duration')
        start_time = data.get('start_time')
        #print("Start time:", start_time, "type:", type(start_time))
        token = data.get('token')
        if not start_time:
            start_time = timezone.now()
        else:
            dt = parse_datetime(start_time)
            #print(dt)
            if dt is None:
                try:
                    from datetime import datetime
                    dt = datetime.strptime(start_time, "%Y-%m-%d %H:%M")
                except Exception:
                    return JsonResponse({"error": "Invalid start_time format."}, status=400)
            start_time = dt

        if not camera_url or not duration or not start_time:
            return JsonResponse(
                {
                    "error": (
                        "'camera_url', 'duration', and 'start_time' are required fields."
                    )
                },
                status=400
            )

        Record.objects.create(
            camera_url=camera_url,
            duration=duration,
            start_time=start_time,
            token=token,
            in_process=False,
            done=False,
            record_type='costar' if "admin:admin" in camera_url else 'supervisor'
        )
        return JsonResponse({"message": "Recording todo added successfully."}, status=200)
    except Exception as e:
        return JsonResponse({"error": f"An error occurred: {str(e)}"}, status=500)

def parse_camera_url(url):
            match = re.match(r'rtsp://([^/]+)/(.+)', url)
            if match:
                ip = match.group(1)
                stream = match.group(2)
                return ip, stream
            return url, ""
@csrf_exempt
def get_record_schedule(request):
    """
    Get the recording schedule.
    """
    #logger.info("get_record_schedule called")
    if request.method != 'GET':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
    try:
        # Helper to extract ip and stream from camera_url
        #logger.info("Fetching record schedule")
        raw_records = Record.objects.all().values()
        #logger.info(f"Raw records fetched: {len(raw_records)}")
        df = pd.DataFrame(list(raw_records))
        if df.empty:
            return JsonResponse({"records": []}, status=200)
        df['ip'], df['stream'] = zip(*df['camera_url'].apply(parse_camera_url))
        all_api = pd.read_csv(settings.BASE_DIR / "addons" / "all_ips.csv")
        if not all_api.empty:
            all_api = all_api.rename(columns={"id": "corridor_id"})
            df = df.merge(all_api, on='ip', how='left')
            df = df.rename(columns={"stream": "camera_stream"})
        else:
            df['camera_stream'] = df['stream']
        
        # Group by camera_url and aggregate the records
        grouped_records = df.groupby('token').agg(
            ip=('ip', lambda x: sorted(list(set(x)))),
            start_time=('start_time', 'first'),
            duration=('duration', 'first'),
            in_process=('in_process', 'first'),
            done=('done', 'first'),
            token=('token', 'first'),
            intersection=('intersection', lambda x: sorted(list(set(x))) if not pd.isnull(x).all() else []),
            finished_counting_all=('finished_counting', lambda x: all(x) if len(x) > 0 else False),
            records_id=('id', lambda x: sorted(list(x)))
        ).reset_index(drop=True)
        

        records = grouped_records.to_dict(orient='records')

        return JsonResponse({"records": list(records)}, status=200)
    except Exception as e:
        #logger.error("Error in get_record_schedule:", str(e))
        return JsonResponse({"error": f"An error occurred: {str(e)}"}, status=500)

@csrf_exempt
def delete_record_schedule(request):
    """
    Delete a recording schedule by token.
    """
    if request.method != 'DELETE':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
    try:
        data = json.loads(request.body.decode('utf-8'))
        token = data.get('token')
        if not token:
            return JsonResponse({"error": "'token' is required."}, status=400)

        record = Record.objects.filter(token=token)
        if not record:
            return JsonResponse({"error": "Record not found."}, status=404)

        record.delete()
        return JsonResponse({"message": "Record deleted successfully."}, status=200)
    except Exception as e:
        return JsonResponse({"error": f"An error occurred: {str(e)}"}, status=500)
    


def get_record_status(request, token):
    """
    Get the status of a recording by token.
    """
    if request.method != 'GET':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
    try:
        record = Record.objects.filter(token=token)
        if not record:
            return JsonResponse({"error": "Record not found."}, status=404)

        # if any in process, return in_process=True
        in_process = record.filter(in_process=True).exists()
        # if error is not null or empty, return error 
        error = record.filter(error__isnull=False).exists()
        # if all records are done, return done=True
        done = all(r.done for r in record)
        response_data = {
            "in_process": in_process,
            "done": done,
            "error": error
        }
        return JsonResponse(response_data, status=200)
    except Exception as e:
        return JsonResponse({"error": f"An error occurred: {str(e)}"}, status=500)


def download_db(request):
    """
    Download the database as a JSON file.
    """
    if request.method != 'GET':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
    try:
        records = Record.objects.all().values()
        records_logs = RecordLog.objects.all().values()
        records_list = list(records)
        records_logs_list = list(records_logs)
        data = {
            "records": records_list,
            "record_logs": records_logs_list
        }
        response = JsonResponse(data, safe=False)
        response['Content-Disposition'] = 'attachment; filename="db.json"'
        return response
    except Exception as e:
        return JsonResponse({"error": f"An error occurred: {str(e)}"}, status=500)


def get_ips(request):
    """
    Get all unique IPs from the records, searching across multiple columns.
    """
    if request.method != 'GET':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)

    try:
        # Read the CSV file
        data = pd.read_csv(settings.BASE_DIR / "addons" / "all_ips.csv")
        
        # Check if the file is empty
        if data.empty:
            return JsonResponse({"ips": []}, status=200)
        data = data[data["working"].str.lower() == "yes"]
        # Ensure columns are treated as strings to handle various formats
        data['ip'] = data['ip'].astype(str)
        data['id'] = data['id'].astype(str)
        data['intersection'] = data['intersection'].astype(str)
        id_ip = data[["id", "ip"]].values.tolist()
        intersection_ip = data[["intersection", "ip"]].values.tolist()
        ip_ip = data[["ip", "intersection"]].values.tolist()
        all_data_ip = id_ip + intersection_ip + ip_ip
        all_df = pd.DataFrame(all_data_ip, columns=["name", "ip"])

        # Get the search query from request parameters
        query = request.GET.get('query', '').lower()
        if not query:
            return JsonResponse({"name": [], "ip": []}, status=200)
        
        # Filter the DataFrame based on exact match of the query
        mask = all_df["name"].str.contains(rf'\b{re.escape(query)}\b', case=False, na=False)
        
        # Return matching rows as an array of dictionaries
        matching_data = all_df[mask]
        # Sort alphabetically by 'name'
        matching_data = matching_data.sort_values(by='name', ascending=True)
        return JsonResponse({"name": matching_data["name"].values.tolist(), "ip": matching_data["ip"].values.tolist()}, status=200)

    except Exception as e:
        return JsonResponse({"error": f"Failed to read ips.csv: {str(e)}"}, status=500)

@csrf_exempt
def edit_record(request):
    """
    Edit a record by token.
    """
    if request.method != 'POST':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
    try:
        data = json.loads(request.body.decode('utf-8'))
        token = data.get('token')
        duration = data.get('duration')
        start_time = data.get('start_time')

        if not duration and not start_time:
            return JsonResponse(
                {
                    "error": (
                        "'camera_url', Either or both of'duration' and 'start_time' are required fields."
                    )
                },
                status=400
            )

        record_qs = Record.objects.filter(token=token)
        if not record_qs.exists():
            return JsonResponse({"error": "Record not found."}, status=404)

        # Update all records with this token
        if not start_time:
            updated_count = record_qs.update(
                duration=duration,
            )
        elif not duration:
            updated_count = record_qs.update(
                start_time=start_time,
            )
        else:
            updated_count = record_qs.update(
                duration=duration,
                start_time=start_time,
            )
        if updated_count == 0:
            return JsonResponse({"error": "No records were updated."}, status=404)
        # If we reach here, the update was successful
        return JsonResponse({"message": f"{updated_count} record(s) updated successfully."}, status=200)
    except Exception as e:
        return JsonResponse({"error": f"An error occurred: {str(e)}"}, status=500)
    
    
@csrf_exempt
def import_video(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
    try:        
        
        for key in request.FILES:
            video_file = request.FILES[key]
            idx = key.split('_')[-1]
            meta = json.loads(request.POST.get(f'meta_{idx}', '{}'))
            camera_url = meta.get('ip')
            duration = meta.get('duration')
            start_time = meta.get('start_time')
            token = meta.get('token', None)
            if not camera_url or not duration or not start_time:
                return JsonResponse(
                    {
                        "error": (
                            "'ip', 'duration', and 'start_time' are required fields."
                        )
                    },
                    status=400
                )
            Record.objects.create(
                camera_url=camera_url,
                duration=duration,
                start_time=start_time,
                token=token,
                in_process=False,
                done=True,
                record_type='import'
            )
            record_id = Record.objects.latest('id').id
            ffmpeg_env = str(settings.FFMPEG_PATH)
            ffmpeg_path = ffmpeg_env if os.path.isabs(ffmpeg_env) else os.path.join(str(settings.BASE_DIR), ffmpeg_env)
            mkv_path = os.path.join(settings.MEDIA_ROOT, f"{record_id}.mkv")
            with open(mkv_path, 'wb+') as destination:
                for chunk in video_file.chunks():
                    destination.write(chunk)

            # Transcode to mp4 using ffmpeg
            mp4_path = os.path.join(settings.MEDIA_ROOT, f"{record_id}.mp4")
            subprocess.run([
                ffmpeg_path, '-i', mkv_path, '-c:v', 'copy', '-c:a', 'copy', mp4_path
            ], check=True)
        return JsonResponse({"message": "Records imported successfully."}, status=200)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON format."}, status=400)
    except Exception as e:
        return JsonResponse({"error": f"An unexpected error occurred: {str(e)}"}, status=500)
    
@csrf_exempt
def get_record_counts(request):
    """
    Get the counts for a specific record.
    """
    if request.method != 'POST':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
    try:
        data = json.loads(request.body.decode('utf-8'))
        record_id = data.get('record_id')
        if not record_id:
            return JsonResponse({"error": "'record_id' is required."}, status=400)
        record = Record.objects.filter(id=record_id).first()
        if not record:
            return JsonResponse({"error": "Record not found."}, status=404)
        auto_count = AutoCounter.objects.filter(record=record).first()
        if not auto_count:
            return JsonResponse({"counts": {}}, status=200)
        counts_file = auto_count.file_name
        if not os.path.exists(counts_file):
            return JsonResponse({"counts": {}}, status=200)
        try:
            df = pd.read_csv(counts_file)
            _dict = {}
            groupby_time = df.groupby('time')
            length = len(groupby_time)
            i = 0
            channel_layer = get_channel_layer()
            group_name = f"counter_loading_progress_{record_id}"
            for time, group in groupby_time:
                
                loading_progress = i / length
                # Check for close message in channel layer
                try:
                    if channel_layer is not None:
                        async_to_sync(channel_layer.group_send)(
                            group_name,
                            {
                                "type": "send_progress",
                                "progress": loading_progress,
                            }
                        )
                        # Check if close message received
                        close_message = async_to_sync(channel_layer.group_receive)(group_name)
                        if close_message and close_message.get('type') == 'close':
                            return JsonResponse({"message": "Processing cancelled"}, status=200)
                except Exception as channel_error:
                    logger.error(f"Channel error: {channel_error}")
                    # Continue processing even if channel communication fails
                    pass
                i += 1
                
                _dict[time] = group.to_dict(orient='records')
            return JsonResponse({"counts": _dict}, status=200)
        except Exception as file_error:
            return JsonResponse({"error": f"Failed to read counts file: {str(file_error)}"}, status=500)
    except Exception as e:
        return JsonResponse({"error": f"An error occurred: {str(e)}"}, status=500)

@csrf_exempt
def get_counts_at_time(request):
    """
    Get the counts for a specific record at a given time.
    """
    if request.method != 'POST':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
    try:
        data = json.loads(request.body.decode('utf-8'))
        record_id = data.get('record_id')
        time = data.get('time')
        if not record_id or not time:
            return JsonResponse({"error": "'record_id' and 'time' are required."}, status=400)
        record = Record.objects.filter(id=record_id).first()
        if not record:
            return JsonResponse({"error": "Record not found."}, status=404)
        auto_count = AutoCounter.objects.filter(record=record).first()
        if not auto_count:
            return JsonResponse({"counts": {}}, status=200)
        counts_file = auto_count.file_name
        if not os.path.exists(counts_file):
            return JsonResponse({"counts": {}}, status=200)
        try:
            df = pd.read_csv(counts_file)
            
            # Find the closest timestamp to the given time
            df['time_diff'] = abs(df['time'] - float(time))
            group = df[df['time_diff'] == df['time_diff'].min()]

            if group.empty:
                return JsonResponse({"counts": []}, status=200)
            counts = group.to_dict(orient='records')
            return JsonResponse({"counts": counts}, status=200)
        except Exception as file_error:
            return JsonResponse({"error": f"Failed to read counts file: {str(file_error)}"}, status=500)
    except Exception as e:
        return JsonResponse({"error": f"An error occurred: {str(e)}"}, status=500)