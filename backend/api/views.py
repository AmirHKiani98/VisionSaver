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
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import numpy as np
from ai.models import AutoDetection, AutoDetectionCheckpoint, DetectionProcess, ModifiedAutoDetection
import traceback
from api.utils import get_counter_auto_detection_results, get_counter_manual_results, get_movement_index
import cv2
import base64
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
            finished_detecting_all=('finished_detecting', lambda x: all(x) if len(x) > 0 else False),
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
        from ai.models import AutoDetection
        auto_count = AutoDetection.objects.filter(record=record).first()
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
            group_name = f"detection_loading_progress_{record_id}"
            for time, group in groupby_time:
                
                loading_progress = i / length
                # Check for close message in channel layer
                try:
                    if channel_layer is not None:
                        async_to_sync(channel_layer.group_send)(
                            group_name,
                            {
                                "type": "send.progress",
                                "progress": loading_progress,
                            }
                        )
                        # Check if close message received
                        close_message = async_to_sync(channel_layer.group_receive)(group_name)
                        if close_message and close_message.get('type') == 'close':
                            return JsonResponse({"message": "Processing cancelled"}, status=200)
                except Exception as channel_error:
                    #logger.error(f"Channel error: {channel_error}")
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
    Get counts at a specific time for a record.
    """
    logger.debug(f"Request method: {request.method}")
    
    if request.method == 'POST':
        data = json.loads(request.body)
        record_id = data.get('record_id')
        time = data.get('time')
        version = data.get('version', 'v2')
        divide_time = data.get('divide_time', 0.1)
        
        logger.debug(f"Request data: {data}")
        
        if not record_id or time is None:
            return JsonResponse({'error': 'Missing required parameters'}, status=400)
        
        try:
            # Try ModifiedAutoDetection first
            auto_detection = AutoDetection.objects.filter(record_id=record_id, divide_time=divide_time, version=version).first()
            if auto_detection and os.path.exists(auto_detection.file_name):
                df = pd.read_csv(auto_detection.file_name)
                if df.empty:
                    return JsonResponse({'counts': [], 'max_time': 0}, status=200)
                
                counts_at_time = df[(df['time'] >= time) & (df['time'] <= time + 10)]
                max_count_time = counts_at_time['time'].max() if not counts_at_time.empty else float(time) + 10
                if counts_at_time.empty:
                    return JsonResponse({'detections': [], 'max_time': max_count_time}, status=200)
                
                detections = counts_at_time.to_dict(orient='records')
                return JsonResponse({'detections': detections, 'max_time': max_count_time}, status=200)
            else:
                return JsonResponse({'error': 'The data does not exist'}, status=405)
        except (AutoDetection.DoesNotExist, ModifiedAutoDetection.DoesNotExist):
            logger.error(f"Error: {traceback.format_exc()}")
            return JsonResponse({'error': 'No detection data found'}, status=404)
        except Exception as e:
            logger.error(f"Error in get_counts_at_time: {traceback.format_exc()}")
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)


@csrf_exempt
def count_exists(request):
    """
    Check if detecting exists for a specific record.
    """
    logger.debug(f"Request method: {request.method}")
    if request.method != 'POST':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
    try:
        data = json.loads(request.body.decode('utf-8'))
        record_id = data.get('record_id')
        divide_time = float(data.get('divide_time', 0.1))  # Default to 0.1 if not provided
        version = data.get('version', 'v1')
        if not record_id:
            return JsonResponse({"error": "'record_id' is required."}, status=400)
        record = Record.objects.filter(id=record_id).first()
        if not record:
            return JsonResponse({"error": "Record not found."}, status=404)
        from ai.models import AutoDetection

        auto_count = AutoDetection.objects.filter(record=record, divide_time=divide_time, version=version).first()
        if auto_count:
            return JsonResponse({"exists": True, "divide_time": auto_count.divide_time}, status=200)
        else:
            return JsonResponse({"exists": False}, status=200)
    except Exception as e:
        return JsonResponse({"error": f"An error occurred: {str(e)}"}, status=500)

@csrf_exempt
def modified_detection_exists(request):
    """
    Check if modified counting exists for a specific record.
    """
    if request.method != 'POST':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
    try:
        data = json.loads(request.body.decode('utf-8'))
        record_id = data.get('record_id')
        divide_time = float(data.get('divide_time', 0.1))  # Default to 0.1 if not provided
        version = data.get('version', 'v1')
        if not record_id:
            return JsonResponse({"error": "'record_id' is required."}, status=400)
        record = Record.objects.filter(id=record_id).first()
        if not record:
            return JsonResponse({"error": "Record not found."}, status=404)
        from ai.models import ModifiedAutoDetection
        modified_auto_count = ModifiedAutoDetection.objects.filter(record=record, version=version, divide_time=divide_time).first()
        if modified_auto_count and os.path.exists(modified_auto_count.file_name):
            return JsonResponse({"exists": True, "divide_time": modified_auto_count.divide_time}, status=200)
        else:
            return JsonResponse({"exists": False}, status=200)
    except Exception as e:
        return JsonResponse({"error": f"An error occurred: {str(e)}"}, status=500)

@csrf_exempt
def get_modified_detections_at_time(request):
    """
    Retrieve car detections for a specific record.
    """
    if request.method == 'POST':
        data = json.loads(request.body)
        record_id = data.get('record_id')
        divide_time = data.get('divide_time', 0.1)
        version = data.get('version', 'v1')
        time = data.get('time', 0)
        
        modified_auto_counter_object = ModifiedAutoDetection.objects.filter(record_id=record_id, divide_time=divide_time, version=version).first()
        if not modified_auto_counter_object:
            return JsonResponse({"error": "The data does not exist"}, status=405)
        modified_auto_counter = pd.read_csv(modified_auto_counter_object.file_name)
        if modified_auto_counter.empty:
            return JsonResponse({"detections": [], "max_time": 0}, status=200)
        
        modified_auto_counter_range = modified_auto_counter[(modified_auto_counter['time'] >= time) & (modified_auto_counter['time'] <= time + 10)]
        max_auto_counter_time = modified_auto_counter_range['time'].max()
        if modified_auto_counter_range.empty:
            return JsonResponse({"detections": [], "max_time": max_auto_counter_time}, status=200)
        detections = modified_auto_counter_range.to_dict(orient='records')
        return JsonResponse({"detections": detections, "max_time": max_auto_counter_time}, status=200)
    
        

    else:
        return JsonResponse({'error': 'Invalid request method'}, status=405)


@csrf_exempt
def remove_detection(request):
    """
    Remove a specific detection from the Auto Detection for a record.
    """
    if request.method == 'POST':
        data = json.loads(request.body)
        record_id = data.get('record_id')
        version = data.get('version', 'v1')
        divide_time = data.get('divide_time', 0.1)
        auto_detection = AutoDetection.objects.filter(record_id=record_id, version=version, divide_time=divide_time).first()
        if auto_detection:
            file_path = auto_detection.file_name
            if os.path.exists(file_path):
                os.remove(file_path)
            auto_detection.delete()
        detection_process = DetectionProcess.objects.filter(record_id=record_id, version=version, divide_time=divide_time).first()
        if detection_process:
            detection_process.delete()
        autodetection_checkpoints = AutoDetectionCheckpoint.objects.filter(record_id=record_id, version=version, divide_time=divide_time).first()
        if autodetection_checkpoints:
            autodetection_checkpoints.delete()
        return JsonResponse({"message": "Detection removed successfully"}, status=200)
    else:
        return JsonResponse({"error": "Method Not Allowed"}, status=405)

@csrf_exempt
def remove_modified_detection(request):
    """
    Remove a specific modified detection from the Modified Auto Detection for a record.
    """
    if request.method == 'POST':
        data = json.loads(request.body)
        record_id = data.get('record_id')
        version = data.get('version', 'v1')
        divide_time = data.get('divide_time', 0.1)
        modified_auto_detection = ModifiedAutoDetection.objects.filter(record_id=record_id, version=version, divide_time=divide_time).first()
        if not modified_auto_detection:
            return JsonResponse({"error": "Modified auto detection not found"}, status=404)
        modified_auto_detection.delete()
        return JsonResponse({"message": "Modified detection removed successfully"}, status=200)
    else:
        return JsonResponse({"error": "Method Not Allowed"}, status=405)

@csrf_exempt
def get_counter_manual_auto_results(request):
    """
    Get manual and auto counter results for a specific record.
    """
    if request.method != 'POST':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
    try:
        data = json.loads(request.body.decode('utf-8'))
        record_id = data.get('record_id')
        if not record_id:
            return JsonResponse({"error": "'record_id' is required."}, status=400)

        version = data.get('version')
        if not version:
            return JsonResponse({"error": "'version' is required."}, status=400)
    
        divide_time = data.get('divide_time')
        if not divide_time:
            return JsonResponse({"error": "'divide_time' is required."}, status=400)

        try:
            divide_time = float(divide_time)
        except ValueError:
            return JsonResponse({"error": "'divide_time' must be a number."}, status=400)
        
        auto_detection_counts = get_counter_auto_detection_results(record_id, version, divide_time)
        if not auto_detection_counts:
            return JsonResponse({"error": "Failed to retrieve results."}, status=500)
        
        datasets = []
        total_counts = {}
        max_time = float("-inf")
        manual_results = get_counter_manual_results(record_id)
        if not manual_results:
            manual_results = {}
            
        # Process auto detection counts
        auto_df_dict = {"time": [], "count": [], "line": []}
        for line_key, counts_dict in auto_detection_counts.items():
            new_dataset = {"id": len(datasets) + 1, "label": "Auto " + line_key, "data":[]}
            total_counts["Auto " + line_key] = 0
            for time_str, count in counts_dict.items():
                time_float = float(time_str)
                total_counts["Auto " + line_key] += count
                new_dataset["data"].append({"x": time_float, "y": count})
                for _ in range(count):
                    auto_df_dict["time"].append(time_float)
                    auto_df_dict["count"].append(1)  # Each point represents 1 count
                    auto_df_dict["line"].append(get_movement_index(line_key))
                
                if time_float > max_time:
                    max_time = time_float
                        
            datasets.append(new_dataset)
            
        auto_df = pd.DataFrame(auto_df_dict)
        
        # Process manual results
        manual_df_dict = {"time": [], "count": [], "line": []}
        for turn_movements_key, count_dict in manual_results.items():
            new_dataset = {"id": len(datasets) + 1, "label": "Manual " + turn_movements_key, "data":[]}
            total_counts["Manual " + turn_movements_key] = 0
            
            for time_str, count in count_dict.items():
                time_float = float(time_str)
                total_counts["Manual " + turn_movements_key] += count
                new_dataset["data"].append({"x": time_float, "y": count})
                for _ in range(count):
                    manual_df_dict["time"].append(time_float)
                    manual_df_dict["count"].append(1)
                    manual_df_dict["line"].append(get_movement_index(turn_movements_key))
                
                if time_float > max_time:
                    max_time = time_float
                        
            datasets.append(new_dataset)
            
        manual_df = pd.DataFrame(manual_df_dict)
        
        # Initialize metrics to track matching performance
        matches = 0
        missed_detections = 0
        false_positives = 0

        # Safety check for empty DataFrames
        if manual_df.empty or auto_df.empty:
            # No comparison possible, return just the datasets we have
            return JsonResponse({
                "datasets": datasets,
                "total_counts": total_counts,
                "max_time": max_time,
                "missed_detections": [],
                "false_positives": [],
                "metrics": {
                    "matches": 0,
                    "missed_detections": 0 if manual_df.empty else len(manual_df),
                    "false_positives": 0 if auto_df.empty else len(auto_df),
                    "recall": 0,
                    "precision": 0,
                    "f1_score": 0
                }
            }, status=200)

        # Keep track of which rows have been matched
        manual_matched = np.zeros(len(manual_df), dtype=bool)
        auto_matched = np.zeros(len(auto_df), dtype=bool)

        # Time threshold for considering a match (in seconds)
        time_difference_threshold = 3

        # Direction/line match requirement
        require_direction_match = True

        # For each manual detection, find the closest auto detection within the time threshold
        for manual_idx, manual_row in manual_df.iterrows():
            manual_time = manual_row["time"]
            manual_line = manual_row["line"]
            
            # Calculate time differences for all auto detections
            time_diffs = np.abs(auto_df["time"] - manual_time)
            
            # Create masks for filtering
            time_mask = time_diffs <= time_difference_threshold
            unmatched_mask = ~auto_matched
            
            # Add direction matching if required
            if require_direction_match:
                direction_mask = auto_df["line"] == manual_line
                match_mask = time_mask & direction_mask & unmatched_mask
            else:
                match_mask = time_mask & unmatched_mask
            
            # Find matches
            if np.any(match_mask):
                # Get indices where the mask is True
                match_indices = np.where(match_mask)[0]
                
                # Find the one with minimum time difference
                if len(match_indices) > 0:
                    time_diffs_subset = time_diffs.iloc[match_indices]
                    best_match_idx = match_indices[np.argmin(time_diffs_subset)]
                    
                    # Mark as matched
                    matches += 1
                    manual_matched[manual_idx] = True
                    auto_matched[best_match_idx] = True
            else:
                # No match found - this is a missed detection
                missed_detections += 1

        # Count false positives (auto detections without manual counterparts)
        false_positives = np.sum(~auto_matched)

        # Calculate metrics
        total_manual_counts = len(manual_df)
        total_auto_counts = len(auto_df)
        recall = matches / total_manual_counts if total_manual_counts > 0 else 0
        precision = matches / total_auto_counts if total_auto_counts > 0 else 0
        f1_score = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0

        # Generate "not found" list for visualization
        not_found_manual = []
        for idx, row in manual_df[~manual_matched].iterrows():
            not_found_manual.append({"x": row["time"], "y": 1, "type": "missed_detection"})

        not_found_auto = []
        for idx, row in auto_df[~auto_matched].iterrows():
            not_found_auto.append({"x": row["time"], "y": 1, "type": "false_positive"})

        # Return results
        return JsonResponse({
            "datasets": datasets,
            "total_counts": total_counts,
            "max_time": max_time,
            "missed_detections": not_found_manual,
            "false_positives": not_found_auto,
            "metrics": {
                "matches": int(matches),
                "missed_detections": int(missed_detections),
                "false_positives": int(false_positives),
                "recall": float(recall),
                "precision": float(precision),
                "f1_score": float(f1_score)
            }
        }, status=200)
        
    except Exception as file_error:
        logger.error(f"Failed to process results: {str(file_error)}", exc_info=True)
        return JsonResponse({"error": f"Failed to process results: {str(file_error)}"}, status=500)

@csrf_exempt
def get_frame_at_time(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
    try:
        data = json.loads(request.body.decode('utf-8'))
        record_id = data.get('record_id')
        time = data.get('time')
        if record_id is None or time is None:
            return JsonResponse({"error": "'record_id' and 'time' are required."}, status=400)
        record = Record.objects.filter(id=record_id).first()
        if not record:
            return JsonResponse({"error": "Record not found."}, status=404)
        video_path = os.path.join(settings.MEDIA_ROOT, f"{record_id}.mp4")
        if not os.path.exists(video_path):
            return JsonResponse({"error": "Video file not found."}, status=404)
        
        # Use OpenCV to capture the frame at the specified time
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_number = int(fps * float(time))
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
        ret, frame = cap.read()
        cap.release()
        
        if not ret:
            return JsonResponse({"error": "Could not retrieve frame."}, status=500)
        
        # Encode the frame as JPEG
        _, buffer = cv2.imencode('.jpg', frame)
        jpg_as_text = base64.b64encode(buffer).decode('utf-8')
        
        return JsonResponse({"frame": jpg_as_text}, status=200)
    except Exception as e:
        return JsonResponse({"error": f"An error occurred: {str(e)}"}, status=500)