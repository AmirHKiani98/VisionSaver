from collections import defaultdict
import pandas as pd
from record.models import Record
from ai.models import AutoDetection, DetectionLines
from record.models import RecordLog
import os

def get_movement_index(movement):
    if "through" in movement.lower():
        return 0
    elif "left" in movement.lower():
        return 1
    elif "right" in movement.lower():
        return 2
    return -1 

def get_counter_auto_detection_results(record_id, version, divide_time, min_time=0, max_time=0):
    """
    API endpoint to retrieve auto_detection counting results for a specific counter.
    Expects a GET request with 'counter_id' as a query parameter.
    """
    if not record_id:
        print("Record id", record_id)
        return False
    record = Record.objects.filter(id=record_id).first()
    if not record:
        print("No record found")
        return False
    auto_detection = AutoDetection.objects.filter(record=record, version=version, divide_time=divide_time).first()
    counts_file = auto_detection.file_name
    if not os.path.exists(counts_file):
        print("Counts file does not exist")
        return False
    try:
        detection_lines = DetectionLines.objects.filter(record=record).first()
        if not detection_lines:
            print("No detection lines found")
            return False
        lines = detection_lines.lines
        lines_map_length = {
            zone_name: len(list(filter(lambda x: x["tool"] == "zone", list_of_points))) for zone_name, list_of_points in lines.items()
        }
        results = defaultdict(dict)
        df = pd.read_csv(counts_file)
        df = df[(df['time'] >= min_time) & (df['time'] <= max_time)]
        df = df.sort_values(["time", "track_id"])
        groups = df.groupby('track_id')
        
        for _, group in groups:
            detected = group[group["in_area"]]
            unique_line_indexes = detected["line_index"].unique().tolist()
            for line_index in unique_line_indexes:
                nu_zone_detected = detected[detected["line_index"] == line_index]["zone_index"].nunique()
                if nu_zone_detected == lines_map_length.get(line_index, 0):
                    time = detected[detected["line_index"] == line_index]["time"].max()
                    if time not in results[line_index]:
                        results[line_index][time] = 0
                    results[line_index][time] += 1
        results = {key: dict(sorted(value.items(), key=lambda item: item[0])) for key, value in results.items()}
        return results
    except Exception as e:
        import traceback
        tb = traceback.format_exec()
        print(tb)
        return False

def get_counter_manual_results(record_id,min_time=0, max_time=0):
    """
    API endpoint to retrieve manual counting results for a specific counter.
    """
    record = Record.objects.filter(id=record_id).first()
    if not record:
        print("No record found")
        return False
    
    record_logs = RecordLog.objects.filter(record=record).order_by('time')
        
    if not record_logs.exists():
        print("No record logs found")
        return False

    # Making a pandas DataFrame from the record logs
    df = pd.DataFrame(list(record_logs.values('time', 'turn_movement')), columns=['time', 'turn_movement'])
    df = df[(df["time"] >= min_time) & (df["time"] <= max_time)]
    df = df.sort_values(["time"])
    results = defaultdict(dict)
    groups = df.groupby('turn_movement')

    for turn_movement, group in groups:
        for _, row in group.iterrows():
            time = row['time']
            if time not in results[turn_movement]:
                results[turn_movement][time] = 0
            results[turn_movement][time] += 1

    results = {key: dict(sorted(value.items(), key=lambda item: item[0])) for key, value in results.items()}
    return results