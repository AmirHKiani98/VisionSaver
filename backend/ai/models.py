from django.db import models

# Create your models here.

class AIModel(models.Model):
    """
    Model to represent an AI model.
    """
    id = models.AutoField(primary_key=True, help_text="Unique identifier for the AI model.")
    name = models.CharField(max_length=100, help_text="Name of the AI model.")
    version = models.CharField(max_length=50, help_text="Version of the AI model.")
    description = models.TextField(blank=True, null=True, help_text="Description of the AI model.")
    created_at = models.DateTimeField(auto_now_add=True, help_text="Timestamp when the model was created.")
    updated_at = models.DateTimeField(auto_now=True, help_text="Timestamp when the model was last updated.")

    def __str__(self):
        return f"{self.name} (v{self.version})"

class CarDetectionInstance(models.Model):
    """
    Model to represent a car detection model.
    """
    id = models.AutoField(primary_key=True, help_text="Unique identifier for the car detection model.")
    ai_model = models.ForeignKey(AIModel, on_delete=models.CASCADE, related_name='car_detections')
    record = models.ForeignKey('record.Record', on_delete=models.CASCADE, related_name='car_detections')
    time = models.PositiveIntegerField(help_text="The time in seconds into the record when this detection was made.")
    bounding_box = models.JSONField(help_text="Bounding box coordinates for the detected car.")
    confidence_threshold = models.FloatField(default=0.5, help_text="Confidence threshold for car detection.")
    created_at = models.DateTimeField(auto_now_add=True, help_text="Timestamp when the model was created.")

class TurnDetectionInstance(models.Model):
    """
    Model to represent a turn detection model.
    """
    id = models.AutoField(primary_key=True, help_text="Unique identifier for the turn detection model.")
    ai_model = models.ForeignKey(AIModel, on_delete=models.CASCADE, related_name='turn_detections')
    record = models.ForeignKey('record.Record', on_delete=models.CASCADE, related_name='turn_detections')
    car_detection_instance = models.ForeignKey(
        CarDetectionInstance, on_delete=models.CASCADE, related_name='turn_detections', help_text="Reference to the car detection instance."
    )
    time = models.PositiveIntegerField(help_text="The time in seconds into the record when this detection was made.")
    turn_type = models.CharField(max_length=50, help_text="Type of turn detected (e.g., left, right).")
    confidence_threshold = models.FloatField(default=0.5, help_text="Confidence threshold for turn detection.")
    created_at = models.DateTimeField(auto_now_add=True, help_text="Timestamp when the model was created.")

class DetectionLines(models.Model):
    """
    Model to represent detection lines for car and turn detection.
    """
    id = models.AutoField(primary_key=True, help_text="Unique identifier for the detection lines.")
    record = models.ForeignKey('record.Record', on_delete=models.CASCADE, related_name='detection_lines')

    def default_lines(): # type: ignore
        return {
            
        }

    lines = models.JSONField(
        default=default_lines,
        help_text="Coordinates of the detection lines."
    )
    created_at = models.DateTimeField(auto_now_add=True, help_text="Timestamp when the model was created.")

class ModifiedAutoDetection(models.Model):
    """
    Model to represent a modified auto counter for vehicles.
    """
    id = models.AutoField(primary_key=True, help_text="Unique identifier for the modified auto counter.")
    record = models.ForeignKey('record.Record', on_delete=models.CASCADE, related_name='modified_auto_counters')
    time = models.DateField(help_text="The time in seconds into the record when this count was made.", auto_now_add=True)
    version = models.CharField(max_length=10, default='v1', help_text="Version of the auto counter algorithm.")
    file_name = models.TextField(help_text="File name associated with the count data.")
    divide_time = models.FloatField(default=0.1, help_text="Time interval for dividing counts.")

class AutoDetection(models.Model):
    """
    Model to represent an auto counter for vehicles.
    """
    id = models.AutoField(primary_key=True, help_text="Unique identifier for the auto counter.")
    record = models.ForeignKey('record.Record', on_delete=models.CASCADE, related_name='auto_counters')
    time = models.DateField(help_text="The time in seconds into the record when this count was made.", auto_now_add=True)
    file_name = models.TextField(help_text="File name associated with the count data.")
    divide_time = models.FloatField(default=0.1, help_text="Time interval for dividing counts.")
    version = models.CharField(max_length=10, default='v1', help_text="Version of the auto counter algorithm.")
    detection_lines = models.ForeignKey(DetectionLines, on_delete=models.CASCADE, related_name='auto_detections', help_text="Reference to the detection lines used for counting.", null=True, blank=True)

class AutoCount(models.Model):
    """
    Model to represent individual auto counts for vehicles.
    """
    id = models.AutoField(primary_key=True, help_text="Unique identifier for the auto count.")
    record = models.ForeignKey('record.Record', on_delete=models.CASCADE, related_name='auto_counts')
    time = models.DateField(help_text="The time in seconds into the record when this count was made.", auto_now_add=True)
    file_name = models.TextField(help_text="File name associated with the count data.")
    version = models.CharField(max_length=10, default='v1', help_text="Version of the auto counter algorithm.")
    divide_time = models.FloatField(default=0.1, help_text="Time interval for dividing counts.")
    lines = models.ForeignKey(DetectionLines, on_delete=models.CASCADE, related_name='auto_counts', help_text="Reference to the detection lines used for counting.")

class AutoDetectionCheckpoint(models.Model):
    """
    Model to represent checkpoints in the auto detection process.
    """
    id = models.AutoField(primary_key=True, help_text="Unique identifier for the auto detection checkpoint.")
    record = models.ForeignKey('record.Record', on_delete=models.CASCADE, related_name='auto_detection_checkpoints')
    created_time = models.DateField(help_text="The created date time", auto_now_add=True)
    version = models.CharField(max_length=10, default='v1', help_text="Version of the auto counter algorithm.")
    divide_time = models.FloatField(default=0.1, help_text="Time interval for dividing counts.")
    last_frame_captured = models.IntegerField(default=0, help_text="The last frame number that was processed.")
    detection_lines = models.ForeignKey(DetectionLines, on_delete=models.CASCADE, related_name='auto_detection_checkpoints', help_text="Reference to the detection lines used for counting.", null=True, blank=True)