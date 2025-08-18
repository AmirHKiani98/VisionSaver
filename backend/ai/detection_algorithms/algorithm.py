import os
import pandas as pd
from typing import Tuple, Optional, Dict, Any
from django.conf import settings
from django.db.models import Q
from ai.models import AutoDetection

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

    def get_result(self,
            record_id: int,
            divide_time: float,
            detector_init: Optional[Dict[str, Any]] = None,
            batch_size: int = 8,
            queue_size: int = 32) -> Tuple[pd.DataFrame, str, str]:
        """
        Returns: (df, file_path, source)
          source ∈ {"cache", "computed"}
        """
        # 1) Try cache (AutoDetection)
        ac = AutoDetection.objects.filter(
            Q(record_id=record_id) & Q(version=self.version) & Q(divide_time=divide_time)
        ).order_by("-time").first()

        if ac and ac.file_name and os.path.exists(ac.file_name):
            df = pd.read_csv(ac.file_name)
            return df, ac.file_name, "cache"

        # 2) Compute (abstract handles multiprocessing)
        ModelCls = self._import_model()
        model = ModelCls(record_id=record_id, divide_time=divide_time)

        # The model’s base class will orchestrate MP; we must pass cls_path for the worker import.
        cls_path = f"ai.detection_algorithms.{self.version}.model.Model"
        df, out_file = model.run(
            cls_path=cls_path,
            batch_size=batch_size,
            queue_size=queue_size,
            detector_init=detector_init or {}
        )

        # 3) Upsert AutoDetection
        AutoDetection.objects.update_or_create(
            record_id=record_id,
            version=self.version,
            divide_time=divide_time,
            defaults={"file_name": out_file},
        )

        return df, out_file, "computed"
