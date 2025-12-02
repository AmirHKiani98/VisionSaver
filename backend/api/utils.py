from collections import defaultdict
import pandas as pd
from record.models import Record
from ai.models import AutoDetection, DetectionLines
from record.models import RecordLog
from datetime import timedelta
import requests
import os
import re

def get_ip_from_rtsp(rtsp_link):
    return re.findall(r"rtsp://(\d+\.\d+\.\d+\.\d+)", rtsp_link)[0]
def get_movement_index(movement):
    if "through" in movement.lower():
        return 0
    elif "left" in movement.lower():
        return 1
    elif "right" in movement.lower():
        return 2
    return -1 

def get_auto_detection_results_from_df(auto_df, min_time=0, max_time=0, lines_map_length=None):
    results = defaultdict(dict)
    auto_df = auto_df[(auto_df['time'] >= min_time) & (auto_df['time'] <= max_time)]
    THRESHOLD = 0.5
    auto_df = auto_df[auto_df["confidence"] >= THRESHOLD]
    auto_df = auto_df.sort_values(["time", "track_id"])
    groups = auto_df.groupby('track_id')
    total = 0
    for _, group in groups:
        detected = group[group["in_area"]]
        unique_line_indexes = detected["line_index"].unique().tolist()
        for line_index in unique_line_indexes:
            zone_detected = detected[detected["line_index"] == line_index]["zone_index"].unique()
            if len(zone_detected) == lines_map_length.get(line_index, 0) and list(zone_detected) == sorted(zone_detected):
                # Check the sort of the nu_zone_detected too
                # e.g. [2, 1, 3] is not accetable. Only [1,2,3]
                time = detected[detected["line_index"] == line_index]["time"].max()
                if time not in results[line_index]:
                    results[line_index][time] = [0, [], []]
                results[line_index][time][0] += 1
                total += 1
                results[line_index][time][1].append(int(group["track_id"].iloc[0]))
                results[line_index][time][2].append(group["cls_id"].iloc[0])
    results = {key: dict(sorted(value.items(), key=lambda item: item[0])) for key, value in results.items()}
    return results, total

def get_counter_auto_detection_results(record_id, version, divide_time, min_time=0, max_time=0):
    """
    API endpoint to retrieve auto_detection counting results for a specific counter.
    Expects a GET request with 'counter_id' as a query parameter.
    """
    if not record_id:
        return False, 0
    record = Record.objects.filter(id=record_id).first()
    if not record:
        return False, 0
    auto_detection = AutoDetection.objects.filter(record=record, version=version, divide_time=divide_time).first()
    if not auto_detection:
        return False, 0
    counts_file = auto_detection.file_name
    if not os.path.exists(counts_file):
        return False, 0
    try:
        detection_lines = DetectionLines.objects.filter(record=record).first()
        if not detection_lines:
            return False, 0
        lines = detection_lines.lines
        lines_map_length = {
            zone_name: len(list(filter(lambda x: x["tool"] == "zone", list_of_points))) for zone_name, list_of_points in lines.items()
        }
        
        df = pd.read_csv(counts_file)
        if max_time == 0:
            max_time = float("inf")
        return get_auto_detection_results_from_df(df, min_time, max_time, lines_map_length)
    except Exception as e:
        import traceback
        tb = traceback.format_exec()
        return False, 0


def get_counter_manual_results(record_id,min_time=0, max_time=0):
    """
    API endpoint to retrieve manual counting results for a specific counter.
    """
    record = Record.objects.filter(id=record_id).first()
    if not record:
        return False, 0
    
    record_logs = RecordLog.objects.filter(record=record).order_by('time')
        
    if not record_logs.exists():
        return False, 0

    # Making a pandas DataFrame from the record logs
    df = pd.DataFrame(list(record_logs.values('time', 'turn_movement')), columns=['time', 'turn_movement'])
    
    # print("times", df["time"])
    if max_time == 0:
        max_time = float("inf")
    df = df[(df["time"] >= min_time) & (df["time"] <= max_time)]

    df = df.sort_values(["time"])
    results = defaultdict(dict)
    groups = df.groupby('turn_movement')
    total = 0
    for turn_movement, group in groups:
        for _, row in group.iterrows():
            time = row['time']
            if time not in results[turn_movement]:
                results[turn_movement][time] = 0
            results[turn_movement][time] += 1
            total += 1

    results = {key: dict(sorted(value.items(), key=lambda item: item[0])) for key, value in results.items()}
    return results, total

def get_iss_detections_json(record_id, min_time=0, max_time=0):
    """
    using the arguments to form a url like: http://192.168.42.169/api/v1/cameras/1/detections?start-time=2025-05-10T12:00:00&end-time=2025-05-11T13:00:00
    min_time: the minimum `seconds` that should be added to the start time of the recording
    max_time: the maximum `seconds` that should be added to the end time of the record
    """
    record = Record.objects.filter(id=record_id).first()
    if not record:
        return False
    ip = get_ip_from_rtsp(record.camera_url)
    record_start_time = record.start_time
    record_start_time = record_start_time + timedelta(seconds=min_time)
    record_end_time = record.start_time + timedelta(minutes=record.duration) + timedelta(seconds=max_time)
    url = f"http://{ip}/api/v1/cameras/{record.camera_id}/detections"
    params = {
        "start-time": record_start_time.strftime("%Y-%m-%dT%H:%M:%S"),
        "end-time": record_end_time.strftime("%Y-%m-%dT%H:%M:%S")
    }
    try:
        response = requests.get(url, params=params)
        response.raise_for_status() 
        return response.json()["detections"] 
    except requests.RequestException as e:
        print(f"Error fetching detections: {e}")
        return None

def get_iss_detections_pandas(record_id, min_time=0, max_time=0):
    """
    Get the detections from this class using get_detections_json but format it into a pandas dataframe
    """
    data_json = get_iss_detections_json(record_id, min_time, max_time)

    if data_json is None:
        return pd.DataFrame(), 0
    pandas_df = pd.DataFrame(data_json)
    
    if pandas_df.empty:
        return pandas_df, 0
    pandas_df["direction"] = pandas_df["direction"].apply(
        lambda x: "through" if x == "Through" else "left" if x == "LeftTurn" else "right" if x == "RightTurn" else x
    )
    pandas_df = pandas_df[~pandas_df["zoneName"].str.contains("ADV")]
    total = pandas_df.shape[0]
    return pandas_df, total

def get_results_comparison_df(record_id, version, divide_time, min_time=0, max_time=0):
    manual_counts, manaul_total = get_counter_manual_results(record_id, min_time=min_time, max_time=max_time)
    auto_counts, auto_total = get_counter_auto_detection_results(record_id, version, divide_time, min_time=min_time, max_time=max_time)
    iss_api_df, iss_total = get_iss_detections_pandas(record_id, min_time, max_time)
    return (manual_counts, manaul_total), (auto_counts, auto_total), (iss_api_df, iss_total)
