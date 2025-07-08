from django.db import models

# Create your models here.

class Record(models.Model):
    """
    Model to represent a Record of an RTSP stream.
    """
    id = models.AutoField(primary_key=True, help_text="Unique identifier for the Record.")
    camera_url = models.URLField(max_length=200, help_text="The camera_url of the RTSP stream.")
    start_time = models.DateTimeField(
        help_text="The time when the Record started."
    )
    duration = models.PositiveIntegerField(help_text="Duration of the Record in seconds.")
    done = models.BooleanField(default=False, help_text="Indicates if the Record is completed.")
    record_type = models.CharField(
        max_length=50,
        choices=[
            ('supervisor', 'SP'),
            ('costar', 'CS')
        ],
        default='supervisor',
        help_text="Type of the Record, e.g., video, audio, or both."
    )
    in_process = models.BooleanField(default=False, help_text="Indicates if the Record is currently in process.")
    error = models.TextField(
        blank=True,
        null=True,
        help_text="Error message if the Record failed."
    )
    token = models.CharField(
        max_length=150, blank=True, null=True,
        help_text="A unique token for the Record, used for authentication or identification.")

    assigned_to = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="The user or system assigned to handle this Record."
    )
    def __str__(self):
        return (
            f"Record from {self.camera_url} starting at {self.start_time} "
            f"for {self.duration} seconds"
        )


class RecordLog(models.Model):
    """
    Model to represent a log entry for a Record.
    Record: A Record object that this log entry is associated with.
    time: The time (s) into the record when the log entry was created.
    """
    id = models.AutoField(primary_key=True, help_text="Unique identifier for the RecordLog.")
    record = models.ForeignKey(Record, on_delete=models.CASCADE, related_name='logs')
    time = models.PositiveIntegerField(
        help_text="The time in seconds into the record when this log entry was created."
    )
    turn_movement = models.CharField(
        max_length=100,
        help_text="The key of the input that triggered this log entry."
    )
