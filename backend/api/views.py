from django.shortcuts import render
from django.http import JsonResponse
from django.utils import timezone
# Create your views here.


def add_recording_todo(request):
    """
    Add a recording to do (should be triggered via cronjob) for the system.
    """
    # The request should be a POST containing the following information:
    # - url - the URL of the RTSP stream to record
    # - duration - the duration of the recording in seconds
    # - start_time - the start time of the recording in ISO format (default to now)
    if request.method != 'POST':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
    try:
        data = request.POST
        url = data.get('url')
        duration = data.get('duration')
        start_time = data.get('start_time')
        if not start_time:
            start_time = timezone.now().isoformat()

        if not url or not duration or not start_time:
            return JsonResponse(
                {
                    "error": (
                        "'url', 'duration', and 'start_time' are required fields."
                    )
                },
                status=400
            )

        
        # For now, we will just return a success message.

        return JsonResponse({"message": "Recording todo added successfully."}, status=200)
    except Exception as e:
        return JsonResponse({"error": f"An error occurred: {str(e)}"}, status=500)
