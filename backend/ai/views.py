from django.shortcuts import render
import json
from django.http import JsonResponse
from .models import DetectionLines
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from record.models import Record
# Create your views here.

logger = settings.APP_LOGGER
def load_model():
    """
    Load the YOLO model and return a response.
    """
    from ultralytics import YOLO


    model = YOLO('yolov8n.pt')  # Load a pre-trained YOLO model
    return model

@csrf_exempt
def add_line(request):
    """
    Handle the request to add a line.
    """
    if request.method == 'POST':
        data = json.loads(request.body)

        record_id = data.get('record_id')
        record = Record.objects.get(id=record_id)
        if not record:
            return JsonResponse({'error': 'Record not found'}, status=404)

        lines = data.get('lines', {})
        detection_object = DetectionLines.objects.get_or_create(
            record=record
        )
        detection_object = detection_object[0]
        detection_object.lines = lines
        detection_object.save()

        return JsonResponse({'status': 'success', 'lines': lines}, status=201)
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=405)
    
def get_lines(request):
    """
    Retrieve detection lines for a specific record.
    """
    if request.method == 'POST':
        data = json.loads(request.body)
        record_id = data.get('record_id')
        try:
            detection_object = DetectionLines.objects.get(record__id=record_id)
            lines = detection_object.lines
            return JsonResponse({'status': 'success', 'lines': lines}, status=200)
        except DetectionLines.DoesNotExist:
            return JsonResponse({'error': 'Detection lines not found for this record'}, status=404)
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=405)

