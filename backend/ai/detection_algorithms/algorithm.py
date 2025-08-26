import os
import pandas as pd
from typing import Tuple
from ai.models import AutoDetection
from django.conf import settings
logger = settings.APP_LOGGER
class DetectionAlgorithm:
    """
    High-level entrypoint:
     - If AutoDetection exists for (record_id, version, divide_time) and file is present → return cached DataFrame.
     - Else → instantiate model subclass and call .run() (MP owned by abstract).
             → store/refresh AutoDetection with produced CSV.
    """
    def __init__(self, version: str = "v1"):
        self.version = version

    def _import_model(self):
        import importlib
        module = importlib.import_module(f"ai.detection_algorithms.{self.version}.model")
        return getattr(module, "Model")

    def run(self, record_id: int, divide_time: float, **kwargs) -> Tuple[pd.DataFrame]:
        model_class = self._import_model()
        model = model_class(record_id, divide_time)
        df = model.run(**kwargs)
        df.to_csv(f"{settings.MEDIA_ROOT}/detections_{record_id}_{self.version}_{divide_time}.csv", index=False)
        AutoDetection.objects.update_or_create(
            record_id=record_id,
            version=self.version,
            divide_time=divide_time,
            defaults={"file": f"detections_{record_id}_{self.version}_{divide_time}.csv"}
        )
        return df
