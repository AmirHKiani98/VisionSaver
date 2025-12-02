from django.test import TestCase
import logging
import dotenv
from django.conf import settings
from api.utils import get_counter_auto_detection_results, get_results_comparison_df
logging.getLogger('ultralytics').setLevel(logging.WARNING)
dotenv.load_dotenv(settings.ENV_PATH)

class ApiTests(TestCase):
    def setUp(self):
        # Set up run before every test method.
        record_id = 248
        version = "v2"
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
