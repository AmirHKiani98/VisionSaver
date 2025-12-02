# nn_matching.py (GPU-enabled distances, no CuPy)
# vim: expandtab:ts=4:sw=4
import torch

from ai.device_picker import pick_backend
_backend = pick_backend()
DEVICE = torch.device('cuda') if _backend == 'cuda' else torch.device('cpu')

def _pdist(a, b):
    """Pair-wise squared distances on GPU (torch)."""
    a = torch.as_tensor(a, dtype=torch.float32, device=DEVICE)
    b = torch.as_tensor(b, dtype=torch.float32, device=DEVICE)
    if a.numel() == 0 or b.numel() == 0:
        return torch.zeros((a.shape[0], b.shape[0]), device=DEVICE)
    a2 = (a * a).sum(dim=1)
    b2 = (b * b).sum(dim=1)
    # r2_ij = ||a_i||^2 + ||b_j||^2 - 2 a_i·b_j
    r2 = -2.0 * (a @ b.T) + a2[:, None] + b2[None, :]
    return torch.clamp(r2, min=0.0)

def _cosine_distance(a, b, data_is_normalized=False):
    """Pair-wise cosine distance on GPU (torch)."""
    a = torch.as_tensor(a, dtype=torch.float32, device=DEVICE)
    b = torch.as_tensor(b, dtype=torch.float32, device=DEVICE)
    if not data_is_normalized:
        a = a / (a.norm(dim=1, keepdim=True) + 1e-12)
        b = b / (b.norm(dim=1, keepdim=True) + 1e-12)
    return 1.0 - (a @ b.T)

def _nn_euclidean_distance(x, y):
    """Smallest euclidean distance per column (GPU), returns torch.Tensor."""
    distances = _pdist(x, y)
    return torch.clamp_min(distances, 0.0).min(dim=0).values  # (M,)

def _nn_cosine_distance(x, y):
    """Smallest cosine distance per column (GPU), returns torch.Tensor."""
    distances = _cosine_distance(x, y)
    return distances.min(dim=0).values  # (M,)

class NearestNeighborDistanceMetric(object):
    """
    GPU-accelerated version that preserves the original API:
    - .distance(...) returns a NumPy array for downstream Hungarian on CPU.
    """
    def __init__(self, metric, matching_threshold, budget=None):
        if metric not in ("euclidean", "cosine"):
            raise ValueError("Invalid metric; must be either 'euclidean' or 'cosine'")
        self.metric_name = metric  # remember the string
        self.matching_threshold = matching_threshold
        self.budget = budget
        self.samples = {}

    def partial_fit(self, features, targets, active_targets):
        # Same logic as original, store raw features; we’ll tensorize on use.
        for feature, target in zip(features, targets):
            self.samples.setdefault(target, []).append(feature)
            if self.budget is not None:
                self.samples[target] = self.samples[target][-self.budget:]
        self.samples = {k: self.samples[k] for k in active_targets}

    def distance(self, features, targets):
        """
        Returns NumPy cost matrix of shape [len(targets), len(features)].
        Build on GPU, then move to CPU for SciPy Hungarian downstream.
        """
        # tensorize once
        features_t = torch.as_tensor(features, dtype=torch.float32, device=DEVICE)
        cost_matrix_t = torch.empty((len(targets), features_t.shape[0]), device=DEVICE)

        for i, target in enumerate(targets):
            samps = self.samples.get(target, [])
            if len(samps) == 0:
                # No samples → fill with large distance (or zeros, adjust as needed)
                cost_matrix_t[i, :] = 0.0
                continue
            samples_t = torch.as_tensor(samps, dtype=torch.float32, device=DEVICE)

            if self.metric_name == "cosine":
                d = _nn_cosine_distance(samples_t, features_t)         # (M,)
            else:
                d = _nn_euclidean_distance(samples_t, features_t)      # (M,)
            cost_matrix_t[i, :] = d

        return cost_matrix_t.detach().cpu().numpy()
