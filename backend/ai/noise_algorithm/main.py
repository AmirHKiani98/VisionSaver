import pandas as pd
import json
import time
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from collections import defaultdict

CANCEL_REQUESTED = set()

def request_cancel(version: str):
    # CANCEL_REQUESTED.add(str(version))
    pass

def clear_cancel(version: str):
    # CANCEL_REQUESTED.discard(str(version))
    pass

def get_frame_from_url(ip: str, vendor: str, streams_api:dict):
    """
    Capture a single frame from an IP camera URL
    """
    import cv2
    vendor = vendor.lower()
    if vendor not in streams_api:
        print(f"Unsupported vendor: {vendor}")
        print(f"Supported vendors: {list(streams_api.keys())}")
        raise ValueError("Unsupported vendor")
    url = streams_api[vendor].format(ip=ip)
    
    cap = cv2.VideoCapture(url)
    ret, frame = cap.read()
    cap.release()
    if ret:
        return frame
    else:
        raise ValueError("Could not read frame from IP camera URL")
    
def get_urls_from_file():
    """
    Read IP camera URLs from a text file and return as a list
    """
    file_address = r"L:\TO_Traffic\TMC\TMCGIS\compelete_intersections.csv"
    df = pd.read_csv(file_address)
    df = df[(df["Device DNS"].str.contains("-tap")) | (df["Device DNS"].str.contains("-ptz"))]
    df = df[["IP Address", "Signal ID", "Longitude", "Latitude", "Vendor"]].rename(columns={
        "IP Address": "ip",
        "Signal ID": "signal_id",
        "Longitude": "longitude",
        "Latitude": "latitude",
        "Vendor": "vendor"
    })
    return df

def run_noise_detection(version="v1"):
    version = str(version)
    clear_cancel(version)
    streams_api_path = r"L:\TO_Traffic\TMC\TMCGIS\streams_api.json"
    with open(streams_api_path, "r") as f:
        streams_api = json.load(f)
    urls = get_urls_from_file()
    results = defaultdict(lambda: [0, 0])
    errors = []
    """
    Import "model/{version}/model.py" dynamically based on the version parameter
    """
    model_module = __import__(f"ai.noise_algorithm.model.{version}.model", fromlist=[""])
    model = model_module
    runs = 5
    channel_layer = get_channel_layer()
    group_name = f"checking_camera_progress_{version}"  # matches consumer
    urls_length = len(urls)
    max_number = urls_length * runs
    ran_number = 0
    for run in range(runs):
        if version in CANCEL_REQUESTED:
            break
        for index, row in urls.iterrows():
            # if version in CANCEL_REQUESTED:
            #     break
            ran_number += 1
            progress = int((ran_number / max_number) * 100)
            if channel_layer is not None:
                async_to_sync(channel_layer.group_send)(group_name, {"type": "send_progress", "progress": progress})
            time.sleep(0.01)  # To avoid overwhelming the cameras
            try:
                frame = get_frame_from_url(row["ip"], row["vendor"], streams_api)
                noise_level = model.noise_detection(frame)
                avg, count = results[row["signal_id"]]
                new_avg = (avg * count + noise_level) / (count + 1)
                print(f"Signal ID: {row['signal_id']}, Noise Level: {noise_level}, New Avg: {new_avg}")
                results[row["signal_id"]] = [new_avg, count + 1]
                if avg > 0.5 and new_avg <= 0.5 and channel_layer is not None:
                    async_to_sync(channel_layer.group_send)(group_name, {"type": "send_progress","progress": progress, "remove_potential_camera": row["signal_id"]})
                elif new_avg >= 0.5 and avg <= 0.5 and channel_layer is not None:
                    async_to_sync(channel_layer.group_send)(group_name, {"type": "send_progress","progress": progress, "potential_camera": row["signal_id"]})
            except Exception as e:
                print(f"Error processing Signal ID {row['signal_id']}: {e}")
                errors.append({
                    "signal_id": row["signal_id"],
                    "ip": row["ip"],
                    "longitude": row["longitude"],
                    "latitude": row["latitude"],
                    "vendor": row["vendor"],
                    "error": str(e),
                })
    if channel_layer is not None:
        async_to_sync(channel_layer.group_send)(group_name, {"type": "send_progress", "progress": 100})
    return {"results": results, "errors": errors}