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

def count_function(x1, y1, x2, y2, line_types):
    x_c, y_c = (x1 + x2) / 2, (y1 + y2) / 2
    point = Point(x_c, y_c)

    in_area = False
    line_idx = -1

    
    for line_key, line_type_list in line_types.items(): # type: ignore
        for line_type, geom in line_type_list:
            if line_type == 'closed' and geom.contains(point):
                in_area = True
                line_idx = line_key
                break
        if in_area:
            break

    return in_area, line_idx # Example function

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
