import json
import os
from django.http import JsonResponse

from .models import DetectionLines, ModifiedAutoDetection, AutoDetection
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from record.models import Record
from ai.detection_modifier_algorithms.algorithm import AlgorithmModificationDetection
from ai.detection_algorithms.algorithm import DetectionAlgorithm
import threading
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
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
        #logger.warning(f"Adding lines for record ID: {record_id}, lines: {lines}")
        detection_object = detection_object[0]
        detection_object.lines = lines
        detection_object.save()

        return JsonResponse({'status': 'success', 'lines': lines}, status=201)
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=405)

@csrf_exempt
def get_lines(request):
    """
    Retrieve detection lines for a specific record.
    """
    if request.method == 'POST':
        data = json.loads(request.body)
        record_id = data.get('record_id')
        try:
            try:
                record = Record.objects.get(id=record_id)
            except Record.DoesNotExist:
                #logger.error(f"Record not found for record ID: {record_id}")
                return JsonResponse({'error': 'Record not found'}, status=404)
            detection_object = DetectionLines.objects.get_or_create(record=record)[0]
            lines = detection_object.lines
            return JsonResponse({'status': 'success', 'lines': lines}, status=200)
        except DetectionLines.DoesNotExist:
            #logger.error(f"Detection lines not found for record ID: {record_id}")
            return JsonResponse({'error': 'Detection lines not found for this record'}, status=404)
    else:
        #logger.error("Invalid request method for get_lines")
        return JsonResponse({'error': 'Invalid request method'}, status=405)

@csrf_exempt
def run_car_detection(request):
    """
    Run car detection on a specific record.
    """
    if request.method == 'POST':
        import multiprocessing
        import threading
        import tempfile
        
        data = json.loads(request.body)
        record_id = data.get('record_id')
        divide_time = data.get('divide_time', 0.1)  # Default to 10 seconds if not provided
        version = data.get('version', 'v1')  # Default to version 'v1'

        try:
            record = Record.objects.get(id=record_id)
        except Record.DoesNotExist:
            return JsonResponse({'error': 'Record not found'}, status=404)

        # Send initial progress update to confirm WebSocket is working
        logger.info(f"Starting car detection for record {record_id} with divide_time {divide_time}")
        detection_lines = DetectionLines.objects.filter(record=record)
        if not detection_lines.exists():
            return JsonResponse({'error': 'No detection lines found for this record. Please add lines before running detection.'}, status=400)
        detection_lines = detection_lines.first() # type: ignore
        # Step 1: Create the algorithm instance
        algo = DetectionAlgorithm(record_id=record_id, divide_time=divide_time, version=version, lines=detection_lines)
        
        t = threading.Thread(target=algo.run)
        t.daemon = True
        t.start()
        
        return JsonResponse({'status': 'success', 'message': 'Car detection started'}, status=200)
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=405)
    
def run_modifier_detection(record_id, divide_time, version='v1'):
    """
    Retrieve auto counter for a specific record and divide time.
    """
    ADZ = AlgorithmModificationDetection(
        version=version,
        record_id=record_id,
        divide_time=divide_time,
    )
    return ADZ.get_result()
