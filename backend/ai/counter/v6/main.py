class Counter:
    """
    Per-frame zone counting is a no-op for v6.
    OD (origin-destination) matching happens at aggregation time in api/utils.py:
    a vehicle is counted for a portal only when its centroid path crosses that
    portal's entry line and then its exit line within the match window.
    """

    @staticmethod
    def count_zones(x1, y1, x2, y2, zones):
        return False, -1, -1

    @staticmethod
    def count_directions():
        return True
