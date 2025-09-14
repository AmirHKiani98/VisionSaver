import dotenv
from django.conf import settings
import numpy as np
dotenv.load_dotenv(settings.ENV_PATH)

logger = settings.APP_LOGGER

def resample_curve(x, y, n_points=50):
    dx = np.diff(x)
    dy = np.diff(y)
    s = np.sqrt(dx**2 + dy**2)
    arc_length = np.concatenate(([0], np.cumsum(s)))

    s_target = np.linspace(0, arc_length[-1], n_points)

    x_uniform = np.interp(s_target, arc_length, x)
    y_uniform = np.interp(s_target, arc_length, y)

    return x_uniform, y_uniform


def parallelism_score(x1, y1, x2, y2):
    if len(x1) != len(x2):
        raise ValueError("Curves must have the same number of points")
    if len(y1) != len(y2):
        raise ValueError("Curves must have the same number of points")
    if len(x1) < 2 or len(x2) < 2:
        raise ValueError("Curves must have at least two points")
    if len(y1) < 2 or len(y2) < 2:
        raise ValueError("Curves must have at least two points")
    dx1, dy1 = np.gradient(x1), np.gradient(y1)
    dx2, dy2 = np.gradient(x2), np.gradient(y2)

    t1 = np.vstack([dx1, dy1]).T
    t1 /= np.linalg.norm(t1, axis=1)[:, None]
    t2 = np.vstack([dx2, dy2]).T
    t2 /= np.linalg.norm(t2, axis=1)[:, None]

    dot = np.sum(t1 * t2, axis=1)
    dot = np.clip(dot, -1, 1)
    angles = np.arccos(dot)

    score = 1 - np.mean(angles) / (np.pi / 2)  # 1 = parallel, 0 = orthogonal
    return score