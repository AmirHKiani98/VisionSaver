import json
import os
from django.http import JsonResponse

from .models import DetectionLines
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from record.models import Record
from ai.detection_modifier_algorithms.algorithm import AlgorithmModificationDetection
from ai.detection_algorithms.algorithm import DetectionAlgorithm
import threading

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
        from ai.utils import test_websocket_progress
        
        data = json.loads(request.body)
        record_id = data.get('record_id')
        divide_time = data.get('divide_time', 0.1)  # Default to 10 seconds if not provided
        version = data.get('version', 'v1')  # Default to version 'v1'
        try:
            record = Record.objects.get(id=record_id)
        except Record.DoesNotExist:
            return JsonResponse({'error': 'Record not found'}, status=404)

        # Send initial progress update to confirm WebSocket is working
        test_websocket_progress(record_id, divide_time, version, 1.0)
        logger.info(f"Starting car detection for record {record_id} with divide_time {divide_time}")

        # Step 1: Create the algorithm instance
        algo = DetectionAlgorithm(version=version)
        
        # Step 2: Create a result path for the detection output
        result_path = tempfile.mktemp(suffix="_detect_result.txt")
        
        # Step 3: Run the detection using algo's run_detection_mp method
        # This method handles the multiprocessing internally and is pickable
        result_path = algo.run_detection_mp(
            record_id, 
            divide_time, 
            {"batch_size": 8, "queue_size": 32, "model_path": "yolov8n.pt"}
        )
        
        # Step 4: Process the result in the main process to update ORM
        # Using a thread here is fine because we're in the main process with Django initialized
        def process_result():
            # The run_detection_mp method already joined the process internally
            
            # Check if the detection process completed successfully
            if os.path.exists(result_path):
                with open(result_path, "r") as f:
                    content = f.read().strip()
                
                if content == "ERROR":
                    logger.error(f"Detection process failed for record {record_id}")
                    return
            
            # Now update the database with the results (this runs in the main process)
            file_path, source = algo.get_result(record_id, divide_time, {"batch_size": 8, "queue_size": 32, "model_path": "yolov8n.pt"})
            
            if file_path:
                logger.info(f"Successfully processed detection results for record {record_id}, file: {file_path}")
            else:
                logger.error(f"Failed to process detection results for record {record_id}")
                
        # Use a thread in the main process to handle the database update
        t = threading.Thread(target=process_result)
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

@csrf_exempt
def start_modifier(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
    try:
        data = json.loads(request.body)
        record_id = data.get('record_id')
        divide_time = data.get('divide_time', 0.1)
        version = data.get('version', 'v1')
        # run with threading
        #logger.info(f"Starting auto counting for record ID: {record_id}, divide_time: {divide_time}, version: {version}")
        thread = threading.Thread(target=run_modifier_detection, args=(record_id, divide_time, version))
        thread.start()
        return JsonResponse({"status": "success", "message": "Auto counting started"}, status=200)
    except Exception as e:
        logger.error(f"Error in start_modifier: {str(e)}")
        return JsonResponse({"error": "Internal Server Error"}, status=500)