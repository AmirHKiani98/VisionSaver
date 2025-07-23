from django.shortcuts import render

# Create your views here.
from ultralytics import YOLO

def load_model():
    """
    Load the YOLO model and return a response.
    """
    model = YOLO('yolov8n.pt')  # Load a pre-trained YOLO model
    return model