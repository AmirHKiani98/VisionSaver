from django.shortcuts import render
import requests
from datetime import datetime

# Create your views here.

def get_information(ip, start_time: datetime, camera_channel=None, end_time=None):
    """
    Get information from the camera.
    :param ip: The IP address of the camera.
    :param start_time: The start time as a datetime object.
    :param camera_channel: Optional camera channel to specify which camera to get information from.
    :param end_time: Optional end time as a datetime object.
    :return: JSON response with camera information or error message.
    """
    # Format datetime to ISO 8601 string
    start_time_str = start_time.isoformat()
    params = {'start-time': start_time_str}
    if end_time:
        params['end-time'] = end_time.isoformat()

    if camera_channel:
        link_url = f"http://{ip}/api/v1/cameras/{camera_channel}/bin-statistics"
    for i in range(1, 5):
        pass # TODO implement

    response = requests.get(link_url, params=params)
    if response.status_code == 200:
        return response.json()
    else:
        return {"error": "Failed to retrieve information"}

 