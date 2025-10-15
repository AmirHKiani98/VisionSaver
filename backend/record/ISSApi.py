import requests
from datetime import datetime
import pandas as pd
class ISSApi():
    """
    Send the requests for retrieving information
    """

    def __init__(self, ip: str, camera_number: int, start_time: datetime, end_time: datetime):
        self.ip = ip
        self.camera_number = camera_number
        self.start_time = start_time
        self.end_time = end_time
    
    def get_detections_json(self):
        """
        using the arguments to form a url like: http://192.168.42.169/api/v1/cameras/1/detections?start-time=2025-05-10T12:00:00&end-time=2025-05-11T13:00:00
        """
        url = f"http://{self.ip}/api/v1/cameras/{self.camera_number}/detections"
        params = {
            "start-time": self.start_time.strftime("%Y-%m-%dT%H:%M:%S"),
            "end-time": self.end_time.strftime("%Y-%m-%dT%H:%M:%S")
        }
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()  # Raise an error for bad responses
            return response.json()["detections"]  # Assuming the API returns JSON data
        except requests.RequestException as e:
            print(f"Error fetching detections: {e}")
            return None

    def get_detections_pandas(self):
        """
        Get the detections from this class using self.get_detections_json but format it into a pandas dataframe
        """
        data_json = self.get_detections_json()
        if data_json is None:
            return pd.DataFrame()
        pandas_df = pd.DataFrame(data_json)
        pandas_df["direction"] = pandas_df["direction"].apply(
            lambda x: "through" if x == "Through" else "left" if x == "LeftTurn" else "right" if x == "RightTurn" else x
        )
        return pandas_df
