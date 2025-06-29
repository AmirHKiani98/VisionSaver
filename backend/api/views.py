from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
import json

# Create your views here.

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
        print(f"Received data: {data}")
        if not start_time:
            start_time = timezone.now().isoformat()

        if not camera_url or not duration or not start_time:
            return JsonResponse(
                {
                    "error": (
                        "'camera_url', 'duration', and 'start_time' are required fields."
                    )
                },
                status=400
            )

        # For now, we will just return a success message.
        return JsonResponse({"message": "Recording todo added successfully."}, status=200)
    except Exception as e:
        return JsonResponse({"error": f"An error occurred: {str(e)}"}, status=500)
