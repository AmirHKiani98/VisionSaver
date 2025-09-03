from shapely.geometry import Point, LineString, Polygon
import numpy as np
def get_line_types(lines, tolerance=0.1):
    line_types: dict[str, list] = {}
    if not lines:
        return line_types
    for line_key, lines in lines.items():
        line_types[line_key] = []
        for line in lines:
            points = np.asarray(line["points"], dtype=np.float32).reshape(-1, 2)
            first_point = points[0]
            last_point = points[-1]
            dist = float(np.linalg.norm(last_point - first_point))
            if dist < tolerance:
                poly = Polygon(points)
                line_types[line_key].append(["closed", poly])
            else:
                segs = [LineString([p, q]) for p, q in zip(points[:-1], points[1:])]
                line_types[line_key].append(["straight", segs])
    return line_types

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