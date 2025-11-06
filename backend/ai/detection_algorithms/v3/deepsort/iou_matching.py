# vim: expandtab:ts=4:sw=4
from __future__ import absolute_import
import numpy as np
from . import linear_assignment
import torch
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

def iou(bbox, candidates):
    """Computer intersection over union.

    Parameters
    ----------
    bbox : ndarray
        A bounding box in format `(top left x, top left y, width, height)`.
    candidates : ndarray
        A matrix of candidate bounding boxes (one per row) in the same format
        as `bbox`.

    Returns
    -------
    ndarray
        The intersection over union in [0, 1] between the `bbox` and each
        candidate. A higher score means a larger fraction of the `bbox` is
        occluded by the candidate.

    """
    bbox_t = torch.as_tensor(bbox, dtype=torch.float32, device=DEVICE)
    cand_t = torch.as_tensor(candidates, dtype=torch.float32, device=DEVICE)

    bbox_tl = bbox_t[:2]
    bbox_br = bbox_t[:2] + bbox_t[2:]
    cand_tl = cand_t[:, :2]
    cand_br = cand_t[:, :2] + cand_t[:, 2:]

    tl = torch.stack([
        torch.maximum(bbox_tl[0], cand_tl[:, 0]),
        torch.maximum(bbox_tl[1], cand_tl[:, 1])
    ], dim=1)
    br = torch.stack([
        torch.minimum(bbox_br[0], cand_br[:, 0]),
        torch.minimum(bbox_br[1], cand_br[:, 1])
    ], dim=1)

    wh = torch.clamp(br - tl, min=0.0)
    inter = (wh[:, 0] * wh[:, 1])

    area_bbox = (bbox_t[2] * bbox_t[3])
    area_cand = (cand_t[:, 2] * cand_t[:, 3])
    iou_vec = inter / (area_bbox + area_cand - inter + 1e-12)
    return iou_vec.detach().cpu().numpy()


def iou_cost(tracks, detections, track_indices=None,
             detection_indices=None):
    """An intersection over union distance metric.

    Parameters
    ----------
    tracks : List[deep_sort.track.Track]
        A list of tracks.
    detections : List[deep_sort.detection.Detection]
        A list of detections.
    track_indices : Optional[List[int]]
        A list of indices to tracks that should be matched. Defaults to
        all `tracks`.
    detection_indices : Optional[List[int]]
        A list of indices to detections that should be matched. Defaults
        to all `detections`.

    Returns
    -------
    ndarray
        Returns a cost matrix of shape
        len(track_indices), len(detection_indices) where entry (i, j) is
        `1 - iou(tracks[track_indices[i]], detections[detection_indices[j]])`.

    """
    if track_indices is None:
        track_indices = np.arange(len(tracks))
    if detection_indices is None:
        detection_indices = np.arange(len(detections))

    cost_matrix = np.zeros((len(track_indices), len(detection_indices)), dtype=np.float32)
    for row, track_idx in enumerate(track_indices):
        if tracks[track_idx].time_since_update > 1:
            cost_matrix[row, :] = np.inf
            continue
        bbox = tracks[track_idx].to_tlwh()
        candidates = np.asarray([detections[i].tlwh for i in detection_indices], dtype=np.float32)
        cost_matrix[row, :] = 1.0 - iou(bbox, candidates)
    return cost_matrix
