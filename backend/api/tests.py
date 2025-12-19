from django.test import TestCase
import logging
import dotenv
from django.conf import settings
from api.utils import get_counter_auto_detection_results, get_results_comparison_df, get_manual_counting_excel, get_auto_detection_counting_excel, get_manual_count_excel_with_direction
logging.getLogger('ultralytics').setLevel(logging.WARNING)
dotenv.load_dotenv(settings.ENV_PATH)

class ApiTests(TestCase):
    def setUp(self):
        # Set up run before every test method.
        record_id = 92
        version = "v4"
        divide_time = 0.05
        self.record_id = record_id
        self.version = version
        self.divide_time = divide_time

    def test_get_counter_auto_detection_results(self):
        # Example test case
        print("Testing get_counter_auto_detection_results...")
        results = get_counter_auto_detection_results(self.record_id, self.version, self.divide_time)
        if results is False:
            self.fail("get_counter_auto_detection_results returned False")
        assert isinstance(results, dict)
        print("Results:", results)
    

    def test_get_results_comparison_df(self):
        (manual_counts, manual_total), (auto_counts, auto_total), (iss_api_df, iss_total) = get_results_comparison_df(self.record_id,  self.version, self.divide_time)
        print("Manual total:", manual_total, "Auto total:", auto_total, "ISS total:", iss_total)
        # assert manual_total > 0
        # assert auto_total > 0
        # assert iss_total > 0


    def test_curve_parallelity(self):
        from ai.utils import parallelism_score
        import numpy as np
        # Two parallel lines
        x1 = np.linspace(0, 100, num=50)
        y1 = x1 * 2 + 5
        x2 = np.linspace(0, 10, num=50)
        y2 = x2 * (-2) + 5
        score_parallel = parallelism_score(x1, y1, x2, y2)
        print("Parallel lines score:", score_parallel)
    

    def test_manual_raw_counts(self):
        raw_counts = get_manual_counting_excel(self.record_id)
        print("Manual raw counts:\n", raw_counts)

    def test_auto_raw_counts(self):
        auto_counts = get_auto_detection_counting_excel(self.record_id, self.version, self.divide_time)
        print("Auto raw counts:\n", auto_counts)

    def test_manual_count_excel_with_direction(self):
        excel_data = get_manual_count_excel_with_direction(self.record_id)
        print(excel_data)
        print("Manual count Excel data with direction retrieved successfully.")
    
    def test_get_multiple_manual_counting_excel(self):
        from api.utils import get_multiple_manual_counting_excel
        record_ids = [92, 93, 94, 95]
        excel_data, all_dfs_in_one = get_multiple_manual_counting_excel(record_ids)
        
        
        print(all_dfs_in_one)
