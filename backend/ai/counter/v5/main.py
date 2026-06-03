class Counter:
    """
    Per-frame zone counting is a no-op for v5.
    Crossing events are detected at aggregation time in api/utils.py
    by checking whether consecutive centroid positions cross a drawn line.
    """

    @staticmethod
    def count_zones(x1, y1, x2, y2, zones):
        return False, -1, -1

    @staticmethod
    def count_directions():
        return True
