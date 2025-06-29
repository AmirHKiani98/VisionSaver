from django.db import models

# Create your models here.

class Recording(models.Model):
    """
    Model to represent a recording of an RTSP stream.
    """
    url = models.URLField(max_length=200, help_text="The URL of the RTSP stream.")
    start_time = models.DateTimeField(
        auto_now_add=True,
        help_text="The time when the recording started."
    )
    duration = models.PositiveIntegerField(help_text="Duration of the recording in seconds.")
    done = models.BooleanField(default=False, help_text="Indicates if the recording is completed.")
    in_process = models.BooleanField(default=False, help_text="Indicates if the recording is currently in process.")
    error = models.TextField(
        blank=True,
        null=True,
        help_text="Error message if the recording failed."
    )
    
    assigned_to = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="The user or system assigned to handle this recording."
    )
    def __str__(self):
        return (
            f"Recording from {self.url} starting at {self.start_time} "
            f"for {self.duration} seconds"
        )
