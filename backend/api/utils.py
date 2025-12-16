from collections import defaultdict
import pandas as pd
from record.models import Record
from ai.models import AutoDetection, DetectionLines
from record.models import RecordLog
from datetime import timedelta
import requests
import os
import re
import numpy as np
import openpyxl
from openpyxl.utils import get_column_letter
from openpyxl.styles import Alignment

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

def get_auto_detection_results_from_df_zones(auto_df, min_time=0, max_time=600, lines_map_length=None):
    results = defaultdict(dict)
    auto_df = auto_df[(auto_df['time'] >= min_time) & (auto_df['time'] <= max_time)]
    THRESHOLD = 0.5
    auto_df = auto_df[auto_df["confidence"] >= THRESHOLD]
    auto_df = auto_df.sort_values(["time", "track_id"])
    grouped = auto_df.groupby('track_id')['time'].agg(['min', 'max'])
    grouped['duration'] = grouped["max"] - grouped["min"]
    grouped = grouped.reset_index()


    grouped = grouped[grouped["duration"] > 2]
    track_ids_of_interest = grouped["track_id"].unique()

    filtered_df = auto_df[auto_df['track_id'].isin(track_ids_of_interest)]
    groups = filtered_df.groupby("track_id")
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
                    results[line_index][time] = [0, [], [], []]
                results[line_index][time][0] += 1
                total += 1
                results[line_index][time][1].append(int(group["track_id"].iloc[0]))
                results[line_index][time][2].append(group["cls_id"].iloc[0])
                results[line_index][time][3].append(f"")
    results = {key: dict(sorted(value.items(), key=lambda item: item[0])) for key, value in results.items()}
    return results, total


def get_auto_detection_results_from_df_lines(auto_df, min_time=0, max_time=600, lines=None):
    if lines is None:
        raise ValueError("Lines parameter is required for line-based detection results.")
    # lines format: {line_key: list_of_points}

    results = defaultdict(dict)
    auto_df = auto_df[(auto_df['time'] >= min_time) & (auto_df['time'] <= max_time)]
    THRESHOLD = 0.5
    auto_df = auto_df[auto_df["confidence"] >= THRESHOLD]
    auto_df = auto_df.sort_values(["time", "track_id"])
    grouped = auto_df.groupby('track_id')['time'].agg(['min', 'max'])
    grouped['duration'] = grouped["max"] - grouped["min"]
    grouped = grouped.reset_index()


    grouped = grouped[grouped["duration"] > 2]
    track_ids_of_interest = grouped["track_id"].unique()

    filtered_df = auto_df[auto_df['track_id'].isin(track_ids_of_interest)]
    groups = filtered_df.groupby("track_id")
    total = 0
    for _, group in groups:
        # print("_", _)
        # Sort by time to ensure correct order
        group = group.sort_values("time")
        # Make sure the max time - min time > 2 seconds
        max_time = group["time"].max()
        min_time = group["time"].min()
        if (max_time - min_time) <= 2:
            continue
        xc = (group["x1"] + group["x2"]) / 2
        yc = (group["y1"] + group["y2"]) / 2
        time = group["time"].max()
        final_line_key = None
        final_line_key_mean_degree_angle = float("inf")
        for line_key, line_points in lines.items():


            line_x = line_points["x"]
            line_y = line_points["y"]
            mean_degree_angle = curve_parallelity(xc.values, yc.values, np.array(line_x), np.array(line_y))
            print(f"Track ID {_} - mean_angle_ {mean_degree_angle} max_time: {max_time}")
            if abs(mean_degree_angle) > 45:
                continue
            
            if mean_degree_angle < final_line_key_mean_degree_angle:
                final_line_key_mean_degree_angle = mean_degree_angle
                final_line_key = line_key
        
        print()
        print()
        print()
        if final_line_key is not None:
            
            if time not in results[final_line_key]:
                results[final_line_key][time] = [0, [], [], []]  
            results[final_line_key][time][0] += 1
            total += 1
            results[final_line_key][time][1].append(int(group["track_id"].iloc[0]))
            results[final_line_key][time][2].append(group["cls_id"].iloc[0])
            results[final_line_key][time][3].append(f"{final_line_key_mean_degree_angle:.2f}")
    results = {key: dict(sorted(value.items(), key=lambda item: item[0])) for key, value in results.items()}
    return results, total


def compute_tangents(x, y):
    x = np.asarray(x); y = np.asarray(y)
    dx = np.diff(x)
    dy = np.diff(y)
    tangents = np.stack([dx, dy], axis=1)
    norms = np.linalg.norm(tangents, axis=1, keepdims=True)
    return tangents / (norms + 1e-9)

def curve_parallelity(x1, y1, x2, y2):
    if len(x1) != len(y1) or len(x2) != len(y2) or len(x1) < 2:
        raise ValueError("Input curves must have the same length and contain at least two points.")
    resample_size = max(len(x1), len(x2))
    x1, y1 = resample_points(x1, y1, resample_size)
    x2, y2 = resample_points(x2, y2, resample_size)
    T1 = compute_tangents(x1, y1)
    T2 = compute_tangents(x2, y2)

    cos_sim = np.sum(T1 * T2, axis=1)
    
    angles = np.arccos(cos_sim)

    mean_angle = np.mean(angles)
    # mean angle in degrees
    mean_angle = np.degrees(mean_angle)
    return mean_angle


def resample_points(x, y, num_points):
    x = np.asarray(x, dtype=np.float32)
    y = np.asarray(y, dtype=np.float32)

    n = len(x)
    m = len(y)
    if n != m or n < 2:
        raise ValueError("x and y must have the same length and contain at least two points.")
    
    if n == num_points:
        return x, y
    
    pts = np.stack([x, y], axis=1)
    diffs = np.diff(pts, axis=0)
    seg_lengths = np.sqrt((diffs**2)).sum(axis=1)
    cumdist = np.insert(np.cumsum(seg_lengths), 0, 0)

    new_dist = np.linspace(0, cumdist[-1], num_points)
    new_x = np.interp(new_dist, cumdist, x)
    new_y = np.interp(new_dist, cumdist, y)
    return new_x, new_y

def get_counter_auto_detection_results(record_id, version, divide_time, min_time=0, max_time=0):
    """
    API endpoint to retrieve auto_detection counting results for a specific counter.
    Expects a GET request with 'counter_id' as a query parameter.
    """
    if not record_id:
        print("record_id is required")
        return False, 0
    record = Record.objects.filter(id=record_id).first()
    if not record:
        print("record not found")
        return False, 0
    auto_detection = AutoDetection.objects.filter(record=record, version=version, divide_time=divide_time).first()
    if not auto_detection:
        print("auto_detection not found")
        return False, 0
    counts_file = auto_detection.file_name
    if not os.path.exists(counts_file):
        print("counts_file not found")
        return False, 0
    try:
        detection_lines = DetectionLines.objects.filter(record=record).first()
        if not detection_lines:
            print("detection_lines not found")
            return False, 0
        lines = detection_lines.lines
        lines_map_length = {
            zone_name: len(list(filter(lambda x: x["tool"] == "zone", list_of_points))) for zone_name, list_of_points in lines.items()
        }
        # lines format: {line_name: [{"tool": "zone"/"direction", "points": [...]}, ...]}
        # points format: [x1, y1, x2, y2, ...]
        # we want: {line_name: {"x": [...], "y": [...]} }
        lines_direction = {
            line_name: {
                "x": [point for tool in list_of_points for idx, point in enumerate(tool["points"]) if idx % 2 == 0 and tool["tool"] == "direction"],
                "y": [point for tool in list_of_points for idx, point in enumerate(tool["points"]) if idx % 2 == 1 and tool["tool"] == "direction"],
            } for line_name, list_of_points in lines.items()
        }
        df = pd.read_csv(counts_file)
        if max_time == 0:
            max_time = 600
        if version == "v3":
            return get_auto_detection_results_from_df_zones(df, min_time, max_time, lines_map_length)
        elif version == "v4":
            return get_auto_detection_results_from_df_lines(df, min_time, max_time, lines_direction)
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print(tb)
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
    # TODO check this part right here:
    if max_time == 0:
        max_time = record.duration * 60
    record_end_time = record.start_time + timedelta(seconds=max_time)
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
    print(pandas_df)
    total = pandas_df.shape[0]
    return pandas_df, total

def get_results_comparison_df(record_id, version, divide_time, min_time=0, max_time=0):
    manual_counts, manaul_total = get_counter_manual_results(record_id, min_time=min_time, max_time=max_time)
    auto_counts, auto_total = get_counter_auto_detection_results(record_id, version, divide_time, min_time=min_time, max_time=max_time)
    iss_api_df, iss_total = get_iss_detections_pandas(record_id, min_time, max_time)
    return (manual_counts, manaul_total), (auto_counts, auto_total), (iss_api_df, iss_total)



def get_counting_raw(df):
    
    if df.empty:
        return pd.DataFrame()
    columns = ["time", "count"]
    for column in columns:
        if column not in df.columns:
            raise ValueError(f"Column '{column}' not found in DataFrame.")
    
    # time column should be datatype (datetime64[ns])
    if not pd.api.types.is_datetime64_any_dtype(df["time"]):
        df["time"] = pd.to_datetime(df["time"]).dt.tz_localize(None)
    
    df["time"] = pd.to_datetime(df["time"]).dt.tz_localize(None)
    
    # Divide the whole day into 15-minute intervals. Beginning from 00:00 to 23.45. But we need to
    # keep this in the US format: PM and AM
    df["hour"] = df["time"].dt.hour
    df["minute"] = df["time"].dt.minute
    start = df["time"].min().floor("15min")
    end = df["time"].max().ceil("15min")
    df["interval"] = df["time"].dt.floor("15min")
    counts = (
        df.groupby("interval")
        .size()
        .reindex(pd.date_range(start, end, freq="15min"), fill_value=0)
    )
    
    result = counts.reset_index()
    result.columns = ["interval_start", "count"]
    result["interval_start"] = result["interval_start"].dt.tz_localize("UTC").dt.tz_convert("America/Chicago")
    result["label"] = result["interval_start"].dt.strftime("%I:%M %p")
    return result


def get_manual_counting_excel(record_id):

    record = Record.objects.filter(id=record_id).first()
    if not record:
        raise ValueError("Record not found.")
    start_time = record.start_time
    manual_results, manual_total = get_counter_manual_results(record_id)
    final_results = pd.DataFrame({"interval_start":[]})
    for line_key, line_data in manual_results.items():
        results_before_df = {"time":[], "count":[]}
        for time, count in line_data.items():
            results_before_df["time"].append(start_time + timedelta(seconds=time))
            # print(start_time + timedelta(seconds=time))
            results_before_df["count"].append(count)
        results_before_df["time"] = (
            pd.Series(results_before_df["time"])
            .dt.tz_localize(None)
        )
        results_df_for_line_key = pd.DataFrame(results_before_df)
        raw_results_df_for_line_key = get_counting_raw(results_df_for_line_key)
        raw_results_df_for_line_key = raw_results_df_for_line_key.rename(
            columns={"count": line_key + " Count"}
        )
        raw_results_df_for_line_key["interval_start"] = pd.to_datetime(raw_results_df_for_line_key["interval_start"])
        final_results = pd.merge(
            final_results,
            raw_results_df_for_line_key[["interval_start", line_key + " Count"]],
            on="interval_start",
            how="outer"
        )
        
    
    results = final_results.sort_values("interval_start")
    numeric_cols = results.select_dtypes(include="number").columns
    results[numeric_cols] = results[numeric_cols].fillna(0)
    return results

def get_auto_detection_counting_excel(record_id, version, divide_time):
    auto_results, total = get_counter_auto_detection_results(record_id, version, divide_time)
    if not auto_results:
        raise ValueError("No auto detection results found.")
    record = Record.objects.filter(id=record_id).first()
    if not record:
        raise ValueError("Record not found.")
    start_time = record.start_time
    results = pd.DataFrame({"interval_start":[]})
    
    for line_key, line_data in auto_results.items():
        results_before_df = {"time":[], "count":[]}
        for time, data in line_data.items():
            results_before_df["time"].append(start_time + timedelta(seconds=time))
            results_before_df["count"].append(data[0])
        results_df_for_line_key = pd.DataFrame(results_before_df)
        raw_results_df_for_line_key = get_counting_raw(results_df_for_line_key)
        raw_results_df_for_line_key = raw_results_df_for_line_key.rename(
            columns={"count": line_key + " Count"}
        )
        results = pd.merge(
            results,
            raw_results_df_for_line_key[["interval_start", line_key + " Count"]],
            on="interval_start",
            how="outer"
        )
    
    results = results.sort_values("interval_start").fillna(0)
    return results

def get_iss_detections_counting_excel(record_id, min_time=0, max_time=0):
    iss_api_df, _ = get_iss_detections_pandas(record_id, min_time, max_time)
    if iss_api_df.empty:
        raise ValueError("No ISS API detection results found.")
    record = Record.objects.filter(id=record_id).first()
    if not record:
        raise ValueError("Record not found.")
    start_time = record.start_time
    results = pd.DataFrame({"interval_start":[]})
    movement_groups = iss_api_df.groupby("direction")
    for movement, group in movement_groups:
        results_before_df = {"time":[], "count":[]}
        time_counts = group['time'].value_counts().sort_index()
        for time, count in time_counts.items():
            results_before_df["time"].append(start_time)
            results_before_df["count"].append(count)
        results_df_for_movement = pd.DataFrame(results_before_df)
        raw_results_df_for_movement = get_counting_raw(results_df_for_movement)
        raw_results_df_for_movement = raw_results_df_for_movement.rename(
            columns={"count": movement + " Count"}
        )
        results = pd.merge(
            results,
            raw_results_df_for_movement[["interval_start", movement + " Count"]],
            on="interval_start",
            how="outer"
        )
        
    results = results.sort_values("interval_start").fillna(0)
    return results


def get_manual_count_excel_with_direction(record_id):
    """
    Write manual counting results to an Excel file with a two-row header:
    - Row 1: empty first cell, then a merged cell with the direction spanning all data columns
    - Row 2: actual column names (time, <Direction> Count, ...)
    This avoids pandas' MultiIndex->Excel limitation by writing headers with openpyxl.
    """
    record = Record.objects.filter(id=record_id).first()
    if not record:
        raise ValueError("Record not found.")
    direction = record.direction or "N/A"

    excel_df = get_manual_counting_excel(record_id)
    if excel_df is None or excel_df.empty:
        return excel_df

    # Ensure 'time' column name (some helpers call it 'interval_start')
    # prefer 'time' if present, otherwise rename 'interval_start' -> 'time' for output
    if "interval_start" in excel_df.columns and "time" not in excel_df.columns:
        excel_df = excel_df.rename(columns={"interval_start": "time"})

    # Prepare header groups: we'll put the 'direction' header above all columns except the first ('time')
    cols = excel_df.columns.tolist()
    if len(cols) < 1:
        raise ValueError("DataFrame has no columns to write.")

    # Build workbook and worksheet
    wb = openpyxl.Workbook()
    ws = wb.active

    # Row 1: first cell empty, merge remaining columns under direction
    first_data_col = 2  # column 1 will be 'time'
    last_data_col = first_data_col + (len(cols) - 1) - 1 + 1  # compute inclusive last column index
    # write empty top-left cell
    ws.cell(row=1, column=1, value="")
    # merge and write direction if there are data columns
    if len(cols) > 1:
        start_col_letter = get_column_letter(first_data_col)
        end_col_letter = get_column_letter(first_data_col + len(cols) - 2)
        merge_range = f"{start_col_letter}1:{end_col_letter}1"
        ws.merge_cells(merge_range)
        ws[f"{start_col_letter}1"] = direction
        ws[f"{start_col_letter}1"].alignment = Alignment(horizontal="center", vertical="center")
    else:
        # Only time column -> write direction above time (even though user wanted empty top-left,
        # in case of single column we keep top-left empty)
        pass

    # Row 2: write actual column names
    for j, col_name in enumerate(cols, start=1):
        cell = ws.cell(row=2, column=j, value=str(col_name))
        cell.alignment = Alignment(horizontal="center", vertical="center")

    # Row 3+: write data rows
    # Ensure pandas datetimes become python datetimes
    excel_df_copy = excel_df.copy()
    for c in excel_df_copy.select_dtypes(include=["datetime", "datetimetz"]).columns:
        excel_df_copy[c] = pd.to_datetime(excel_df_copy[c]).dt.tz_localize(None)

    for i, row in enumerate(excel_df_copy.itertuples(index=False), start=3):
        for j, value in enumerate(row, start=1):
            ws.cell(row=i, column=j, value=value)

    # Optionally set column widths
    for i, col in enumerate(cols, start=1):
        col_letter = get_column_letter(i)
        ws.column_dimensions[col_letter].width = max(12, min(30, len(str(col)) + 2))
    return wb


def get_auto_iss_count_excel_with_direction(record_id, version, divide_time):
    """
    Get an excel with two sheets:
    -- First sheet is auto excel results from get_auto_detection_counting_excel
    -- Seconds sheet is ISS excel results from get_iss_detections_counting_excel
    This avoids pandas' MultiIndex->Excel limitation by writing headers with openpyxl.
    """
    record = Record.objects.filter(id=record_id).first()
    if not record:
        raise ValueError("Record not found.")
    direction = record.direction or "N/A"

    auto_excel_df = get_auto_detection_counting_excel(record_id, version, divide_time)
    iss_excel_df = get_iss_detections_counting_excel(record_id)

    if auto_excel_df is None or auto_excel_df.empty:
        raise ValueError("No auto detection counting results found.")
    if iss_excel_df is None or iss_excel_df.empty:
        raise ValueError("No ISS detection counting results found.")

    # Prepare workbook
    wb = openpyxl.Workbook()
    ws_auto = wb.active
    ws_auto.title = "Auto Detection Counts"
    ws_iss = wb.create_sheet(title="ISS Detection Counts")

    # Helper to write a DataFrame to a worksheet with two-row header
    def write_df_with_direction_header(ws, df, direction):
        # Ensure 'time' column name (some helpers call it 'interval_start')
        if "interval_start" in df.columns and "time" not in df.columns:
            df = df.rename(columns={"interval_start": "time"})

        cols = df.columns.tolist()
        if len(cols) < 1:
            raise ValueError("DataFrame has no columns to write.")

        # Row 1: first cell empty, merge remaining columns under direction
        first_data_col = 2  # column 1 will be 'time'
        last_data_col = first_data_col + (len(cols) - 1) - 1 + 1  # compute inclusive last column index
        ws.cell(row=1, column=1, value="")
        if len(cols) > 1:
            start_col_letter = get_column_letter(first_data_col)
            end_col_letter = get_column_letter(first_data_col + len(cols) - 2)
            merge_range = f"{start_col_letter}1:{end_col_letter}1"
            ws.merge_cells(merge_range)
            ws[f"{start_col_letter}1"] = direction
            ws[f"{start_col_letter}1"].alignment = Alignment(horizontal="center", vertical="center")

        # Row 2: write actual column names
        for j, col_name in enumerate(cols, start=1):
            cell = ws.cell(row=2, column=j, value=str(col_name))
            cell.alignment = Alignment(horizontal="center", vertical="center")
        # Row 3+: write data rows
        df_copy = df.copy()
        for c in df_copy.select_dtypes(include=["datetime", "datetimetz"]).columns:
            df_copy[c] = pd.to_datetime(df_copy[c]).dt.tz_localize(None)
        for i, row in enumerate(df_copy.itertuples(index=False), start=3):
            for j, value in enumerate(row, start=1):
                ws.cell(row=i, column=j, value=value)

    write_df_with_direction_header(ws_auto, auto_excel_df, direction)
    write_df_with_direction_header(ws_iss, iss_excel_df, direction)
    return wb
    

def get_multiple_manual_counting_excel(records_ids):
    """
    Get the same results as get_manual_count_excel_with_direction for each of the records
    and merge them based on the time. They should be like the following:
    | EMPTY | Direction 1 (with a1 columns)| Direction 2 (with a2 columns) | ... | Direction n (an) columns |
    | EMPTY | Count movement 1 | Count movement 2 | ... | Count movement a1  ...| | Count movement 1 | ... | Count movement an |
    | Time | Count | Count | ... | Count |
    ...
    """
    combined_results = pd.DataFrame({"time":[]})
    directions = []
    record_column_info = []  # will store tuples (direction, num_cols, col_names)
    all_dfs = {}
    for record_id in records_ids:
        record = Record.objects.filter(id=record_id).first()
        if not record:
            continue
        direction = record.direction or f"N/A direction of record_id {record_id}"
        excel_df = get_manual_counting_excel(record_id)
        all_dfs[record_id] = excel_df
        if excel_df is None or excel_df.empty:
            continue
        if "interval_start" in excel_df.columns and "time" not in excel_df.columns:
            excel_df = excel_df.rename(columns={"interval_start": "time"})
        # count data columns for this record (exclude 'time')
        data_cols = [c for c in excel_df.columns if c != "time"]
        record_column_info.append((direction, len(data_cols), data_cols, record_id))
        directions.append(direction)
        # Rename columns to include direction to avoid collisions
        renamed_columns = {
            col: f"{direction} {col}" if col != "time" else col for col in excel_df.columns
        }
        excel_df = excel_df.rename(columns=renamed_columns)
        combined_results = pd.merge(
            combined_results,
            excel_df,
            on="time",
            how="outer"
        )
    if combined_results.empty:
        raise ValueError("No valid manual counting results found for the provided record IDs.")

    # ensure time is datetime and sort
    if "time" in combined_results.columns:
        combined_results["time"] = pd.to_datetime(combined_results["time"])
    combined_results = combined_results.sort_values("time").reset_index(drop=True)

    # Now write to Excel with two-row header and styling
    wb = openpyxl.Workbook()
    ws = wb.active

    # quick style objects
    from openpyxl.styles import PatternFill, Border, Side, Font
    thin = Side(border_style="thin", color="000000")
    border = Border(left=thin, right=thin, top=thin, bottom=thin)
    time_fill = PatternFill(start_color="FFF2CC", end_color="FFF2CC", fill_type="solid")  # light yellow
    fills = [
        PatternFill(start_color="DDEBF7", end_color="DDEBF7", fill_type="solid"),  # light blue
        PatternFill(start_color="F2F2F2", end_color="F2F2F2", fill_type="solid"),  # light gray
        PatternFill(start_color="E2EFDA", end_color="E2EFDA", fill_type="solid"),  # light green
        PatternFill(start_color="FCE4D6", end_color="FCE4D6", fill_type="solid"),  # light peach
    ]

    # Row 1: first cell empty
    ws.cell(row=1, column=1, value="")
    # Determine columns per direction group (order in combined_results.columns)
    cols = combined_results.columns.tolist()
    # Build mapping of direction -> (start_col_index, end_col_index, num_cols, record_id)
    mapping = []
    col_index = 1
    # find indices for 'time' then subsequent columns
    # ensure time is first; if not, move it to first in ordering
    if cols[0] != "time" and "time" in cols:
        cols.remove("time")
        cols.insert(0, "time")
    # calculate contiguous groups for each record using record_column_info order
    current_col = 2  # excel column index for first data column
    for direction, num_cols, data_cols, record_id in record_column_info:
        if num_cols == 0:
            continue
        # find the actual column names in combined_results corresponding to this direction
        full_col_names = [f"{direction} {c}" for c in data_cols]
        # find contiguous block start by searching for first occurrence among cols
        found_indices = [cols.index(name) + 1 for name in full_col_names if name in cols]
        if not found_indices:
            continue
        start_idx = min(found_indices)
        end_idx = max(found_indices)
        # store mapping as 1-based excel col indices
        mapping.append((direction, start_idx, end_idx, num_cols, record_id))
    # If mapping empty, try fallback: group by prefix direction in column order
    if not mapping:
        # scan cols and group by prefix before first space
        idx = 2
        seen_dirs = set()
        for c in cols[1:]:
            parts = str(c).split(" ", 1)
            dir_name = parts[0]
            if dir_name not in seen_dirs:
                # count how many consecutive columns start with this dir_name
                group_cols = [cc for cc in cols[1:] if str(cc).startswith(dir_name + " ")]
                if not group_cols:
                    continue
                start_idx = cols.index(group_cols[0]) + 1
                end_idx = cols.index(group_cols[-1]) + 1
                mapping.append((dir_name, start_idx, end_idx, len(group_cols), None))
                seen_dirs.add(dir_name)

    # Row 1: merge and write direction headers with alternating fills and borders per record block
    for idx, (direction, start_idx, end_idx, num_cols, record_id) in enumerate(mapping):
        start_letter = get_column_letter(start_idx)
        end_letter = get_column_letter(end_idx)
        merge_range = f"{start_letter}1:{end_letter}1"
        ws.merge_cells(merge_range)
        cell = ws.cell(row=1, column=start_idx, value=direction)
        cell.alignment = Alignment(horizontal="center", vertical="center")
        fill = fills[idx % len(fills)]
        # apply fill to merged header range
        for col in range(start_idx, end_idx + 1):
            hcell = ws.cell(row=1, column=col)
            hcell.fill = fill
            hcell.border = border
            hcell.font = Font(bold=True)
        # set column widths: total width 90 spread over the group's columns
        per_col_width = 90.0 / max(1, num_cols)
        for col in range(start_idx, end_idx + 1):
            letter = get_column_letter(col)
            ws.column_dimensions[letter].width = per_col_width

    # time column styling and width
    time_col_idx = cols.index("time") + 1 if "time" in cols else 1
    time_letter = get_column_letter(time_col_idx)
    ws.cell(row=1, column=time_col_idx).fill = time_fill  # top-left may be empty but color the cell
    ws.cell(row=2, column=time_col_idx).fill = time_fill
    ws.column_dimensions[time_letter].width = 20

    # Row 2: actual column names
    for j, col_name in enumerate(cols, start=1):
        cell = ws.cell(row=2, column=j, value=str(col_name))
        cell.alignment = Alignment(horizontal="center", vertical="center")
        # apply time fill
        if j == time_col_idx:
            cell.fill = time_fill
        else:
            # find which record block this column belongs to and apply corresponding fill
            for idx, (direction, start_idx, end_idx, num_cols, record_id) in enumerate(mapping):
                if start_idx <= j <= end_idx:
                    cell.fill = fills[idx % len(fills)]
                    break
        cell.border = border

    # Row 3+: data rows
    combined_results_copy = combined_results.copy()
    for c in combined_results_copy.select_dtypes(include=["datetime", "datetimetz"]).columns:
        combined_results_copy[c] = pd.to_datetime(combined_results_copy[c]).dt.tz_localize(None)
    n_rows = combined_results_copy.shape[0]
    for i, row in enumerate(combined_results_copy.itertuples(index=False), start=3):
        for j, value in enumerate(row, start=1):
            cell = ws.cell(row=i, column=j, value=value)
            # apply border
            cell.border = border
            # apply time column fill
            if j == time_col_idx:
                cell.fill = time_fill
            else:
                # fill by record block
                for idx, (direction, start_idx, end_idx, num_cols, record_id) in enumerate(mapping):
                    if start_idx <= j <= end_idx:
                        cell.fill = fills[idx % len(fills)]
                        break

    # Also add outer border around each record block (including header rows + data rows)
    last_data_row = 2 + n_rows
    for idx, (_, start_idx, end_idx, _, _) in enumerate(mapping):
        for r in range(1, last_data_row + 1):
            for c in range(start_idx, end_idx + 1):
                ws.cell(row=r, column=c).border = border
    return wb, all_dfs


def get_multiple_iss_counting_excel(records_ids):
    """
    Get the same results as get_manual_count_excel_with_direction for each of the records
    and merge them based on the time. They should be like the following:
    | EMPTY | Direction 1 (with a1 columns)| Direction 2 (with a2 columns) | ... | Direction n (an) columns |
    | EMPTY | Count movement 1 | Count movement 2 | ... | Count movement a1  ...| | Count movement 1 | ... | Count movement an |
    | Time | Count | Count | ... | Count |
    ...
    """
    combined_results = pd.DataFrame({"time":[]})
    directions = []
    record_column_info = []  # will store tuples (direction, num_cols, col_names)
    all_dfs = {}
    for record_id in records_ids:
        record = Record.objects.filter(id=record_id).first()
        if not record:
            continue
        direction = record.direction or f"N/A direction of record_id {record_id}"
        excel_df = get_iss_detections_counting_excel(record_id)
        all_dfs[record_id] = excel_df
        if excel_df is None or excel_df.empty:
            continue
        if "interval_start" in excel_df.columns and "time" not in excel_df.columns:
            excel_df = excel_df.rename(columns={"interval_start": "time"})
        # count data columns for this record (exclude 'time')
        data_cols = [c for c in excel_df.columns if c != "time"]
        record_column_info.append((direction, len(data_cols), data_cols, record_id))
        directions.append(direction)
        # Rename columns to include direction to avoid collisions
        renamed_columns = {
            col: f"{direction} {col}" if col != "time" else col for col in excel_df.columns
        }
        excel_df = excel_df.rename(columns=renamed_columns)
        combined_results = pd.merge(
            combined_results,
            excel_df,
            on="time",
            how="outer"
        )
    if combined_results.empty:
        raise ValueError("No valid manual counting results found for the provided record IDs.")

    # ensure time is datetime and sort
    if "time" in combined_results.columns:
        combined_results["time"] = pd.to_datetime(combined_results["time"])
    combined_results = combined_results.sort_values("time").reset_index(drop=True)

    # Now write to Excel with two-row header and styling
    wb = openpyxl.Workbook()
    ws = wb.active

    # quick style objects
    from openpyxl.styles import PatternFill, Border, Side, Font
    thin = Side(border_style="thin", color="000000")
    border = Border(left=thin, right=thin, top=thin, bottom=thin)
    time_fill = PatternFill(start_color="FFF2CC", end_color="FFF2CC", fill_type="solid")  # light yellow
    fills = [
        PatternFill(start_color="DDEBF7", end_color="DDEBF7", fill_type="solid"),  # light blue
        PatternFill(start_color="F2F2F2", end_color="F2F2F2", fill_type="solid"),  # light gray
        PatternFill(start_color="E2EFDA", end_color="E2EFDA", fill_type="solid"),  # light green
        PatternFill(start_color="FCE4D6", end_color="FCE4D6", fill_type="solid"),  # light peach
    ]

    # Row 1: first cell empty
    ws.cell(row=1, column=1, value="")
    # Determine columns per direction group (order in combined_results.columns)
    cols = combined_results.columns.tolist()
    # Build mapping of direction -> (start_col_index, end_col_index, num_cols, record_id)
    mapping = []
    col_index = 1
    # find indices for 'time' then subsequent columns
    # ensure time is first; if not, move it to first in ordering
    if cols[0] != "time" and "time" in cols:
        cols.remove("time")
        cols.insert(0, "time")
    # calculate contiguous groups for each record using record_column_info order
    current_col = 2  # excel column index for first data column
    for direction, num_cols, data_cols, record_id in record_column_info:
        if num_cols == 0:
            continue
        # find the actual column names in combined_results corresponding to this direction
        full_col_names = [f"{direction} {c}" for c in data_cols]
        # find contiguous block start by searching for first occurrence among cols
        found_indices = [cols.index(name) + 1 for name in full_col_names if name in cols]
        if not found_indices:
            continue
        start_idx = min(found_indices)
        end_idx = max(found_indices)
        # store mapping as 1-based excel col indices
        mapping.append((direction, start_idx, end_idx, num_cols, record_id))
    # If mapping empty, try fallback: group by prefix direction in column order
    if not mapping:
        # scan cols and group by prefix before first space
        idx = 2
        seen_dirs = set()
        for c in cols[1:]:
            parts = str(c).split(" ", 1)
            dir_name = parts[0]
            if dir_name not in seen_dirs:
                # count how many consecutive columns start with this dir_name
                group_cols = [cc for cc in cols[1:] if str(cc).startswith(dir_name + " ")]
                if not group_cols:
                    continue
                start_idx = cols.index(group_cols[0]) + 1
                end_idx = cols.index(group_cols[-1]) + 1
                mapping.append((dir_name, start_idx, end_idx, len(group_cols), None))
                seen_dirs.add(dir_name)

    # Row 1: merge and write direction headers with alternating fills and borders per record block
    for idx, (direction, start_idx, end_idx, num_cols, record_id) in enumerate(mapping):
        start_letter = get_column_letter(start_idx)
        end_letter = get_column_letter(end_idx)
        merge_range = f"{start_letter}1:{end_letter}1"
        ws.merge_cells(merge_range)
        cell = ws.cell(row=1, column=start_idx, value=direction)
        cell.alignment = Alignment(horizontal="center", vertical="center")
        fill = fills[idx % len(fills)]
        # apply fill to merged header range
        for col in range(start_idx, end_idx + 1):
            hcell = ws.cell(row=1, column=col)
            hcell.fill = fill
            hcell.border = border
            hcell.font = Font(bold=True)
        # set column widths: total width 90 spread over the group's columns
        per_col_width = 90.0 / max(1, num_cols)
        for col in range(start_idx, end_idx + 1):
            letter = get_column_letter(col)
            ws.column_dimensions[letter].width = per_col_width

    # time column styling and width
    time_col_idx = cols.index("time") + 1 if "time" in cols else 1
    time_letter = get_column_letter(time_col_idx)
    ws.cell(row=1, column=time_col_idx).fill = time_fill  # top-left may be empty but color the cell
    ws.cell(row=2, column=time_col_idx).fill = time_fill
    ws.column_dimensions[time_letter].width = 20

    # Row 2: actual column names
    for j, col_name in enumerate(cols, start=1):
        cell = ws.cell(row=2, column=j, value=str(col_name))
        cell.alignment = Alignment(horizontal="center", vertical="center")
        # apply time fill
        if j == time_col_idx:
            cell.fill = time_fill
        else:
            # find which record block this column belongs to and apply corresponding fill
            for idx, (direction, start_idx, end_idx, num_cols, record_id) in enumerate(mapping):
                if start_idx <= j <= end_idx:
                    cell.fill = fills[idx % len(fills)]
                    break
        cell.border = border

    # Row 3+: data rows
    combined_results_copy = combined_results.copy()
    for c in combined_results_copy.select_dtypes(include=["datetime", "datetimetz"]).columns:
        combined_results_copy[c] = pd.to_datetime(combined_results_copy[c]).dt.tz_localize(None)
    n_rows = combined_results_copy.shape[0]
    for i, row in enumerate(combined_results_copy.itertuples(index=False), start=3):
        for j, value in enumerate(row, start=1):
            cell = ws.cell(row=i, column=j, value=value)
            # apply border
            cell.border = border
            # apply time column fill
            if j == time_col_idx:
                cell.fill = time_fill
            else:
                # fill by record block
                for idx, (direction, start_idx, end_idx, num_cols, record_id) in enumerate(mapping):
                    if start_idx <= j <= end_idx:
                        cell.fill = fills[idx % len(fills)]
                        break

    # Also add outer border around each record block (including header rows + data rows)
    last_data_row = 2 + n_rows
    for idx, (_, start_idx, end_idx, _, _) in enumerate(mapping):
        for r in range(1, last_data_row + 1):
            for c in range(start_idx, end_idx + 1):
                ws.cell(row=r, column=c).border = border
    return wb, all_dfs



def get_multiple_auto_counting_excel(records_ids):
    """
    Aggregate auto-detection counting results by (version, divide_time).
    Produce one sheet per unique (version, divide_time) containing merged
    results for records that share that pair. Each sheet groups columns
    by record.direction (same styling as manual export).
    """
    # gather dfs per (version, divide_time)
    groups = {}  # (version, divide_time) -> list of tuples (record_id, direction, df)
    all_dfs = {}
    for record_id in records_ids:
        auto_detections = AutoDetection.objects.filter(record_id=record_id)
        for auto_detection in auto_detections:
            version = auto_detection.version
            divide_time = auto_detection.divide_time
            try:
                excel_df = get_auto_detection_counting_excel(record_id, version, divide_time)
                all_dfs[str(record_id) + "_" + str(version) + "_" + str(divide_time)] = excel_df
            except Exception:
                excel_df = None
            if excel_df is None or excel_df.empty:
                continue
            # normalize time column name
            if "interval_start" in excel_df.columns and "time" not in excel_df.columns:
                excel_df = excel_df.rename(columns={"interval_start": "time"})
            record = Record.objects.filter(id=record_id).first()
            direction = (record.direction or "N/A") if record else "N/A"
            key = (version, divide_time)
            groups.setdefault(key, []).append((record_id, direction, excel_df.copy()))

    if not groups:
        raise ValueError("No valid auto detection results found for the provided record IDs.")

    wb = openpyxl.Workbook()
    # keep default sheet to remove later if unused
    default_sheet = wb.active
    created_any = False

    # styling helpers reused from manual exporter
    from openpyxl.styles import PatternFill, Border, Side, Font
    thin = Side(border_style="thin", color="000000")
    border = Border(left=thin, right=thin, top=thin, bottom=thin)
    time_fill = PatternFill(start_color="FFF2CC", end_color="FFF2CC", fill_type="solid")
    fills = [
        PatternFill(start_color="DDEBF7", end_color="DDEBF7", fill_type="solid"),
        PatternFill(start_color="F2F2F2", end_color="F2F2F2", fill_type="solid"),
        PatternFill(start_color="E2EFDA", end_color="E2EFDA", fill_type="solid"),
        PatternFill(start_color="FCE4D6", end_color="FCE4D6", fill_type="solid"),
    ]

    def write_group_sheet(title, records_list):
        """
        records_list: list of (record_id, direction, df)
        returns: created worksheet
        """
        combined = pd.DataFrame({"time": []})
        record_column_info = []
        directions = []
        for record_id, direction, df in records_list:
            # ensure time column present
            if "interval_start" in df.columns and "time" not in df.columns:
                df = df.rename(columns={"interval_start": "time"})
            data_cols = [c for c in df.columns if c != "time"]
            record_column_info.append((direction, len(data_cols), data_cols, record_id))
            directions.append(direction)
            # rename to avoid collisions
            renamed = {col: f"{direction} {col}" if col != "time" else col for col in df.columns}
            df2 = df.rename(columns=renamed)
            combined = pd.merge(combined, df2, on="time", how="outer")
        if combined.empty:
            return None

        # normalize time dtype and sort
        if "time" in combined.columns:
            combined["time"] = pd.to_datetime(combined["time"])
        combined = combined.sort_values("time").reset_index(drop=True)

        ws = wb.create_sheet(title=title[:31])
        # Row1 blank cell
        ws.cell(row=1, column=1, value="")
        cols = combined.columns.tolist()
        # ensure time first
        if cols and cols[0] != "time" and "time" in cols:
            cols.remove("time"); cols.insert(0, "time")

        # build mapping as in manual function
        mapping = []
        for direction, num_cols, data_cols, record_id in record_column_info:
            if num_cols == 0:
                continue
            full_col_names = [f"{direction} {c}" for c in data_cols]
            found_indices = [cols.index(name) + 1 for name in full_col_names if name in cols]
            if not found_indices:
                continue
            mapping.append((direction, min(found_indices), max(found_indices), num_cols, record_id))
        if not mapping:
            # fallback grouping by prefix
            seen = set()
            for c in cols[1:]:
                prefix = str(c).split(" ", 1)[0]
                if prefix in seen:
                    continue
                group_cols = [cc for cc in cols[1:] if str(cc).startswith(prefix + " ")]
                if not group_cols:
                    continue
                start_idx = cols.index(group_cols[0]) + 1
                end_idx = cols.index(group_cols[-1]) + 1
                mapping.append((prefix, start_idx, end_idx, len(group_cols), None))
                seen.add(prefix)

        # write merged headers per mapping
        for idx, (direction, start_idx, end_idx, num_cols, rid) in enumerate(mapping):
            start_letter = get_column_letter(start_idx)
            end_letter = get_column_letter(end_idx)
            ws.merge_cells(f"{start_letter}1:{end_letter}1")
            cell = ws.cell(row=1, column=start_idx, value=direction)
            cell.alignment = Alignment(horizontal="center", vertical="center")
            fill = fills[idx % len(fills)]
            for col in range(start_idx, end_idx + 1):
                hcell = ws.cell(row=1, column=col)
                hcell.fill = fill; hcell.border = border; hcell.font = Font(bold=True)
                ws.column_dimensions[get_column_letter(col)].width = max(8, 90.0 / max(1, num_cols))

        # time column styling
        time_col_idx = cols.index("time") + 1 if "time" in cols else 1
        ws.cell(row=1, column=time_col_idx).fill = time_fill
        ws.cell(row=2, column=time_col_idx).fill = time_fill
        ws.column_dimensions[get_column_letter(time_col_idx)].width = 20

        # row2 header names
        for j, col_name in enumerate(cols, start=1):
            cell = ws.cell(row=2, column=j, value=str(col_name))
            cell.alignment = Alignment(horizontal="center", vertical="center")
            if j == time_col_idx:
                cell.fill = time_fill
            else:
                for idx, (_, start_idx, end_idx, _, _) in enumerate(mapping):
                    if start_idx <= j <= end_idx:
                        cell.fill = fills[idx % len(fills)]; break
            cell.border = border

        # data rows
        combined_copy = combined.copy()
        for c in combined_copy.select_dtypes(include=["datetime", "datetimetz"]).columns:
            combined_copy[c] = pd.to_datetime(combined_copy[c]).dt.tz_localize(None)
        for i, row in enumerate(combined_copy.itertuples(index=False), start=3):
            for j, value in enumerate(row, start=1):
                cell = ws.cell(row=i, column=j, value=value)
                cell.border = border
                if j == time_col_idx:
                    cell.fill = time_fill
                else:
                    for idx, (_, start_idx, end_idx, _, _) in enumerate(mapping):
                        if start_idx <= j <= end_idx:
                            cell.fill = fills[idx % len(fills)]; break
        last_row = 2 + combined_copy.shape[0]
        # outer border per group
        for (_, start_idx, end_idx, _, _) in mapping:
            for r in range(1, last_row + 1):
                for c in range(start_idx, end_idx + 1):
                    ws.cell(row=r, column=c).border = border

        return ws

    # Create a sheet per (version, divide_time) group
    summary_rows = [["Sheet Name", "Version", "Divide Time", "Records Included"]]
    for (version, divide_time), recs in groups.items():
        sheet_title = f"Auto_v{version}_d{divide_time}"
        created_ws = write_group_sheet(sheet_title, recs)
        if created_ws is not None:
            created_any = True
            summary_rows.append([created_ws.title, version, divide_time, ", ".join(str(rid) for rid, _, _ in recs)])

    # add summary sheet
    ws_summary = wb.create_sheet(title="Auto Summary")
    for r in summary_rows:
        ws_summary.append(r)
    for i in range(1, len(summary_rows[0]) + 1):
        ws_summary.column_dimensions[get_column_letter(i)].width = 30

    # remove default sheet if unused
    if not created_any and default_sheet and default_sheet.title == "Sheet":
        # keep summary only
        pass
    elif default_sheet and default_sheet.title == "Sheet":
        wb.remove(default_sheet)

    return wb, all_dfs


def compare_two_df(df1, df2):
    """
    Compare two dataframes where df1 is ground-truth and df2 is the one to check.
    Only compare columns that contain one of the movement keywords: "left", "right", "through".
    Columns are expected to be named like "<direction> <movement> ...", e.g. "east left Count".
    Output: openpyxl.Workbook with two sheets:
      - "Comparison Summary": per-matched-column totals and error metrics
      - "Per-Time Differences": time-aligned row-by-row differences for matched columns
    """
    from openpyxl import Workbook

    # normalize time column name
    def _ensure_time(df):
        if "time" in df.columns:
            d = df.copy()
        elif "interval_start" in df.columns:
            d = df.rename(columns={"interval_start": "time"}).copy()
        else:
            raise ValueError("Input DataFrame must contain 'time' or 'interval_start' column.")
        d["time"] = pd.to_datetime(d["time"], errors="coerce")
        return d

    A = _ensure_time(df1)
    B = _ensure_time(df2)

    # lower-case column name mapping (original -> lower)
    def _has_movement(col):
        low = str(col).lower()
        return any(k in low for k in ("left", "right", "through"))

    cols_a = [c for c in A.columns if c != "time" and _has_movement(c)]
    cols_b = [c for c in B.columns if c != "time" and _has_movement(c)]

    if not cols_a:
        raise ValueError("No movement columns found in ground-truth (df1).")

    # parse direction and movement from column name
    def _parse(col):
        s = str(col).strip()
        low = s.lower()
        movement = next((k for k in ("left", "right", "through") if k in low), None)
        # assume direction is first token before a space
        parts = s.split()
        direction = parts[0] if parts else s
        return direction.strip().lower(), movement

    # build matches: for each col in A find best matching col in B (same direction & movement)
    matches = []
    for ca in cols_a:
        dir_a, mov_a = _parse(ca)
        # exact candidate: contains same direction token and movement token
        cand = next((cb for cb in cols_b if dir_a in str(cb).lower() and (mov_a in str(cb).lower() if mov_a else True)), None)
        if not cand:
            # fallback: any column that contains the movement token
            cand = next((cb for cb in cols_b if mov_a and mov_a in str(cb).lower()), None)
        matches.append((ca, cand, dir_a, mov_a))

    # merge on time (outer) and compute diffs
    merged = pd.merge(A[["time"] + cols_a], B[["time"] + (cols_b if cols_b else [])], on="time", how="outer", suffixes=("_A", "_B"))
    merged = merged.sort_values("time").reset_index(drop=True)

    # Replace NaNs in numeric columns with 0 for diff computation
    for c in merged.columns:
        if c == "time":
            continue
        merged[c] = pd.to_numeric(merged[c], errors="coerce").fillna(0.0)

    summary_rows = [["Column_A", "Column_B", "Direction", "Movement", "Total_A", "Total_B", "Total_Diff (A-B)", "Sum_Abs_Diff", "MSE", "Pct_Diff_vs_A"]]
    per_time_frames = []

    for ca, cb, direction, movement in matches:
        key_a = ca if ca in merged.columns else f"{ca}_A" if f"{ca}_A" in merged.columns else None
        key_b = None
        if cb:
            key_b = cb if cb in merged.columns else f"{cb}_B" if f"{cb}_B" in merged.columns else None
        if key_a is None:
            # cannot compute without A
            continue
        if key_b is None:
            # create zero column for B
            merged[f"__zero_{ca}__"] = 0.0
            key_b = f"__zero_{ca}__"

        diff_col = f"{direction} {movement or ''} Diff ({ca} - {cb or 'MISSING'})"
        merged[diff_col] = merged[key_a].astype(float) - merged[key_b].astype(float)

        total_a = float(merged[key_a].sum())
        total_b = float(merged[key_b].sum())
        total_diff = total_a - total_b
        sum_abs = float(merged[diff_col].abs().sum())
        mse = float((merged[diff_col] ** 2).mean())
        pct = (total_diff / total_a * 100.0) if total_a != 0 else (float("inf") if total_diff != 0 else 0.0)

        summary_rows.append([ca, cb or "", direction, movement or "", total_a, total_b, total_diff, sum_abs, mse, pct])
        per_time_frames.append(merged[["time", diff_col]].copy())

    # build output workbook
    out_wb = Workbook()
    try:
        out_wb.remove(out_wb.active)
    except Exception:
        pass

    ws_sum = out_wb.create_sheet(title="Comparison Summary")
    for r in summary_rows:
        ws_sum.append(r)
    # autosize columns
    for i in range(1, len(summary_rows[0]) + 1):
        try:
            ws_sum.column_dimensions[get_column_letter(i)].width = 18
        except Exception:
            pass

    if per_time_frames:
        merged_pt = per_time_frames[0].copy()
        for dfp in per_time_frames[1:]:
            merged_pt = pd.merge(merged_pt, dfp, on="time", how="outer")
        merged_pt = merged_pt.sort_values("time").reset_index(drop=True)
        ws_pt = out_wb.create_sheet(title="Per-Time Differences")
        # header
        headers = merged_pt.columns.tolist()
        ws_pt.append(headers)
        # rows
        for row in merged_pt.itertuples(index=False):
            ws_pt.append(list(row))
        for i in range(1, len(headers) + 1):
            try:
                ws_pt.column_dimensions[get_column_letter(i)].width = 18
            except Exception:
                pass

    return out_wb
    