class Counter:
    """
    Per-frame zone counting is a no-op for v7.
    Trajectory classification happens at aggregation time in api/utils.py:
    each vehicle's full centroid path is analyzed to classify its movement
    as left, through, or right based on entry/exit heading vectors.
    """

    @staticmethod
    def count_zones(x1, y1, x2, y2, zones):
        return False, -1, -1

    @staticmethod
    def count_directions():
        return True
