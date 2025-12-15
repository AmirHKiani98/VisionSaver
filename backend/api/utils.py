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
    for record_id in records_ids:
        record = Record.objects.filter(id=record_id).first()
        if not record:
            continue
        direction = record.direction or "N/A"
        directions.append(direction)
        excel_df = get_manual_counting_excel(record_id)
        if excel_df is None or excel_df.empty:
            continue
        if "interval_start" in excel_df.columns and "time" not in excel_df.columns:
            excel_df = excel_df.rename(columns={"interval_start": "time"})
        # Rename columns to include direction
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

    # Now write to Excel with two-row header
    wb = openpyxl.Workbook()
    ws = wb.active

    # Row 1: first cell empty, then merged cells for each direction
    ws.cell(row=1, column=1, value="")
    current_col = 2
    for direction in directions:
        direction_cols = [col for col in combined_results.columns if col.startswith(direction) and col != "time"]
        if not direction_cols:
            continue
        start_col_letter = get_column_letter(current_col)
        end_col_letter = get_column_letter(current_col + len(direction_cols) - 1)
        merge_range = f"{start_col_letter}1:{end_col_letter}1"
        ws.merge_cells(merge_range)
        ws[f"{start_col_letter}1"] = direction
        ws[f"{start_col_letter}1"].alignment = Alignment(horizontal="center", vertical="center")
        current_col += len(direction_cols)

    # Row 2: actual column names
    for j, col_name in enumerate(combined_results.columns, start=1):
        cell = ws.cell(row=2, column=j, value=str(col_name))
        cell.alignment = Alignment(horizontal="center", vertical="center")

    # Row 3+: data rows
    combined_results_copy = combined_results.copy()
    for c in combined_results_copy.select_dtypes(include=["datetime", "datetimetz"]).columns:
        combined_results_copy[c] = pd.to_datetime(combined_results_copy[c]).dt.tz_localize(None)
    for i, row in enumerate(combined_results_copy.itertuples(index=False), start=3):
        for j, value in enumerate(row, start=1):
            ws.cell(row=i, column=j, value=value)
    return wb