from django.shortcuts import render
import json
from django.http import JsonResponse
from .models import DetectionLines
from django.views.decorators.csrf import csrf_exempt
# Create your views here.

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
        lines = data.get('lines', {})

        created_lines = []
        for turn_type, line_types in lines.items():
            for line_type, coords_list in line_types.items():
                for coords in coords_list:
                    detection_line = DetectionLines.objects.create(
                        type_of_turn=turn_type,
                        record_id=record_id,
                        line_coordinates=coords,
                        type_of_line=line_type
                    )
                    created_lines.append({
                        'id': detection_line.id,
                        'type_of_turn': detection_line.type_of_turn,
                        'type_of_line': detection_line.type_of_line,
                        'line_coordinates': detection_line.line_coordinates
                    })

        return JsonResponse({'status': 'success', 'created_lines': created_lines}, status=201)
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=405)