import json
from django.http import JsonResponse

from .models import DetectionLines
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from record.models import Record
from ai.models import DetectionProcess
from ai.detection_modifier_algorithms.algorithm import AlgorithmModificationDetection
from ai.detection_algorithms.algorithm import DetectionAlgorithm

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
def check_if_detection_in_process(request):
    """
    Check if a detection process is running for a specific record, divide_time, and version.
    """
    if request.method == 'POST':
        data = json.loads(request.body)
        record_id = data.get('record_id')
        divide_time = data.get('divide_time')
        version = data.get('version')
        try:
            record = Record.objects.get(id=record_id)
        except Record.DoesNotExist:
            return JsonResponse({'error': 'Record not found'}, status=404)
        detection_process= DetectionProcess.objects.filter(
            record=record,
            divide_time=divide_time,
            version=version,
            done=False
        ).order_by('-created_at').first()
        logger.info(f"Check detection process for record {record_id}, divide_time {divide_time}, version {version}: {'running' if detection_process else 'not running'}")
        if detection_process:
            autodetection_checkpoint = detection_process.autodetection_checkpoint
            progress = autodetection_checkpoint.last_frame_captured / autodetection_checkpoint.total_frames if autodetection_checkpoint and autodetection_checkpoint.total_frames > 0 else 0
            return JsonResponse({'running': True, 'progress': progress}, status=200)
        else:
            return JsonResponse({'running': False}, status=200)
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=405)


@csrf_exempt
def run_car_detection(request):
    """
    Run car detection on a specific record.
    """
    if request.method == 'POST':
        import threading
        
        data = json.loads(request.body)
        record_id = data.get('record_id')
        divide_time = data.get('divide_time', 0.1)  # Default to 10 seconds if not provided
        version = data.get('version', 'v1')  # Default to version 'v1'

        try:
            record = Record.objects.get(id=record_id)
        except Record.DoesNotExist:
            return JsonResponse({'error': 'Record not found'}, status=404)

        # Check if a detection process is already running for this record, divide_time, and version
        detection_process= DetectionProcess.objects.filter(
            record=record,
            divide_time=divide_time,
            version=version,
            done=False
        ).order_by("-created_at").first()
        if detection_process:
            return JsonResponse({'error': 'A detection process is already running for this record with the specified divide_time and version.'}, status=400)


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

@csrf_exempt
def check_if_detection_exists(request):
    """
    Check if detection results exist for a specific record and divide time.
    """
    if request.method == 'POST':
        data = json.loads(request.body)
        record_id = data.get('record_id')
        divide_time = data.get('divide_time')
        version = data.get('version', 'v1')
        
        try:
            record = Record.objects.get(id=record_id)
        except Record.DoesNotExist:
            return JsonResponse({'error': 'Record not found'}, status=404)
        
        from ai.models import AutoDetectionCheckpoint
        
        detection_process = AutoDetectionCheckpoint.objects.filter(
            record=record,
            divide_time=divide_time,
            version=version,
            last_frame_captured__gt=0,
        ).first()
        logger.info(f"Check if detection exists for record {record_id}, divide_time {divide_time}, version {version}: {'exists' if detection_process else 'does not exist'}")
        
        if detection_process:
            return JsonResponse({'exists': True}, status=200)
        else:
            return JsonResponse({'exists': False}, status=200)
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=405)

@csrf_exempt
def list_detection_processes(request):
    """
    List all active detection processes.
    """
    if request.method == 'GET':
        from ai.models import DetectionProcess
        processes = DetectionProcess.objects.filter(done=False)
        process_list = []
        for process in processes:
            process_list.append({
                'id': process.id,
                'record_id': process.record.id,
                'version': process.version,
                'divide_time': process.divide_time,
                'pid': process.pid,
                'created_at': process.created_at,
            })
        return JsonResponse({'status': 'success', 'processes': process_list}, status=200)
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=405)

@csrf_exempt
def terminate_detection_process(request):
    """
    Terminate a specific detection process.
    """
    if request.method == 'POST':
        data = json.loads(request.body)
        record_id = data.get('record_id')
        divide_time = data.get('divide_time')
        version = data.get('version', 'v1')
        
        from ai.models import DetectionProcess
        from django.utils import timezone
        
        try:
            # Find the process to terminate
            process = DetectionProcess.objects.filter(
                record_id=record_id,
                divide_time=divide_time,
                version=version,
                done=False
            ).order_by('-created_at').first()
            
            if not process:
                raise DetectionProcess.DoesNotExist()
            
                
            # Set the termination flag in the database
            process.terminate_requested = True
            process.terminate_requested_at = timezone.now()
            process.save(update_fields=['terminate_requested', 'terminate_requested_at'])
            
            logger.info(f"Termination request set for process {process.id} with pid {process.pid}")
            
            return JsonResponse({
                'status': 'success', 
                'message': f'Termination signal sent to process {process.id}. The process will stop at the next opportunity.'
            }, status=200)
            
        except DetectionProcess.DoesNotExist:
            logger.debug(f"Process not found for record_id={record_id}, divide_time={divide_time}, version={version}")
            return JsonResponse({'error': 'Detection process not found'}, status=404)
        except Exception as e:
            logger.error(f"Error terminating process: {str(e)}")
            return JsonResponse({'error': f'Error terminating process: {str(e)}'}, status=500)
    else:
        logger.debug("Invalid request method")
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