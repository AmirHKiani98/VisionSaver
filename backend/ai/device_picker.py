# ai/device.py
import os, platform, subprocess, shutil, importlib.util

def _has_nvidia_cuda():
    # Fast path: torch cuda
    try:
        import torch
        if torch.cuda.is_available():
            return True
    except Exception:
        pass
    # Fallback: nvidia-smi present and working
    if shutil.which("nvidia-smi"):
        try:
            res = subprocess.run(["nvidia-smi", "-L"],
                                 stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            return res.returncode == 0 and "GPU" in (res.stdout or "")
        except Exception:
            pass
    return False

def _has_amd_windows():
    # Lightweight vendor probe (no extra deps). Windows only.
    if platform.system() != "Windows":
        return False
    try:
        res = subprocess.run(["wmic", "path", "win32_VideoController", "get", "Name"],
                             stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True)
        out = (res.stdout or "").upper()
        return ("AMD" in out) or ("RADEON" in out)
    except Exception:
        return False

def _has_directml():
    # Only claim DML if torch-directml is importable AND can create a device
    if importlib.util.find_spec("torch_directml") is None:
        return False
    try:
        import torch_directml as dml # type: ignore
        _ = dml.device()  # construct a DirectML device
        return True
    except Exception:
        return False

def pick_backend():
    """
    Returns one of: 'cuda', 'dml', 'cpu'.
    Honors optional env override AI_DEVICE ('cuda'|'dml'|'cpu').
    """
    forced = os.getenv("AI_DEVICE")
    if forced in {"cuda", "dml", "cpu"}:
        return forced

    if _has_nvidia_cuda():
        return "cuda"
    if _has_directml():
        return "dml"
    return "cpu"

def gpu_summary_string():
    # Nice to log in startup
    try:
        if platform.system() == "Windows":
            res = subprocess.run(["wmic", "path", "win32_VideoController", "get", "Name"],
                                 stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True)
            return (res.stdout or "").strip()
        else:
            # Linux/mac fallback (best-effort)
            if shutil.which("lspci"):
                res = subprocess.run(["bash","-lc","lspci | grep -i 'vga\\|3d\\|display'"],
                                     stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True)
                return (res.stdout or "").strip()
    except Exception:
        pass
    return "Unknown GPU"
