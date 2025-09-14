from shapely.geometry import Point, LineString, Polygon
import numpy as np
def get_line_types(points, tolerance=0.1):
    points = np.asarray(points, dtype=np.float32).reshape(-1, 2)
    first_point = points[0]
    last_point = points[-1]
    dist = float(np.linalg.norm(last_point - first_point))
    if dist < tolerance:
        poly = Polygon(points)
        return ["closed", poly]
    else:
        segs = [LineString([p, q]) for p, q in zip(points[:-1], points[1:])]
        return ["straight", segs]

def count_zone(x1, y1, x2, y2, zones):
    x_c, y_c = (x1 + x2) / 2, (y1 + y2) / 2
    point = Point(x_c, y_c)
    in_area = False
    final_line_key = -1
    for line_key, zone_points in zones.items(): # type: ignore
        for points in zone_points:
            points = np.asarray(points, dtype=np.float32).reshape(-1, 2)
            if not np.array_equal(points[0], points[-1]):
                points = np.vstack([points, points[0]])
            geom = Polygon(points )
            if geom.contains(point):
                    in_area = True
                    final_line_key = line_key
                    break
            if in_area:
                break
    return in_area, final_line_key

def line_points_to_xy(line_points, video_width, video_height):
    """
    Convert normalized line points to pixel coordinates.
    :param line_points: List of normalized points [x1, y1, x2, y2, ...]
    :param video_height: Height of the video frame
    :param video_width: Width of the video frame
    :return: List of tuples representing pixel coordinates [(x1, y1), (x2, y2), ...]
    """
    xy_points = []
    for i in range(0, len(line_points), 2):
        x = int(line_points[i] * video_width)
        y = int(line_points[i + 1] * video_height)
        xy_points.append((x, y))
    return xy_points
