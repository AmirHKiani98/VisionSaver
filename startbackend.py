# startbackend.py
# --------------------------------------------
# Robust launcher for Django (processor.asgi) + Streamer (apps.streamer.asgi_mpeg)
# Works in both dev and PyInstaller "frozen" (_MEIPASS) modes.
# - Ensures correct sys.path so `import processor.settings` succeeds.
# - Guards against double-starts on ports 5051/2501.
# - Loads env from nearest .hc_to_app_env.
# --------------------------------------------

import os
import sys
import threading
import subprocess
import socket
from typing import Optional

# ----------------------------
# Paths & helpers
# ----------------------------
def resource_path(relative_path: str) -> str:
    """
    Get absolute path to resource, works for dev and PyInstaller.
    """
    base_path = getattr(sys, "_MEIPASS", os.path.abspath("."))
    return os.path.join(base_path, relative_path)

def log(msg: str) -> None:
    try:
        # Keep logs single-line friendly for your external log reader
        print(msg, flush=True)
    except Exception:
        pass

if hasattr(sys, "_MEIPASS"):
    log(f"Running in frozen mode. Base path: {sys._MEIPASS}")  # type: ignore[attr-defined]
else:
    log(f"Running in dev mode. Base path: {os.path.abspath('.')}")

# Prefer the internal packaged backend first (PyInstaller layout)
INTERNAL_ROOT = resource_path("_internal")
INTERNAL_BACKEND = resource_path("_internal/backend")
OUTER_BACKEND = resource_path("backend")

# Ensure Python can import `processor` (i.e., ...\_internal\backend\processor\*)
# We choose the "processor.*" import style consistently throughout.
for p in (INTERNAL_BACKEND, INTERNAL_ROOT, OUTER_BACKEND):
    if os.path.isdir(p) and p not in sys.path:
        sys.path.insert(0, p)

# ----------------------------
# Find and load .hc_to_app_env
# ----------------------------
def find_hc_to_app_env_folders(start_path: str) -> list[str]:
    hc_to_app_env_folders: list[str] = []
    # Search up to two levels up from base to handle various bundle layouts
    roots_to_try = [
        start_path,
        os.path.abspath(os.path.join(start_path, "..")),
        os.path.abspath(os.path.join(start_path, "../..")),
        os.path.abspath(os.path.join(start_path, "../../..")),
    ]
    seen = set()
    for root in roots_to_try:
        if not os.path.isdir(root):
            continue
        for r, _dirs, files in os.walk(root):
            if ".hc_to_app_env" in files:
                full = os.path.abspath(r)
                if full not in seen:
                    seen.add(full)
                    hc_to_app_env_folders.append(full)
    return hc_to_app_env_folders

hc_to_app_env_candidates = find_hc_to_app_env_folders(resource_path("."))
if not hc_to_app_env_candidates:
    log("No .hc_to_app_env folders found.")
else:
    log(f"Found .hc_to_app_env folders: {hc_to_app_env_candidates}")

log(f"Using base path: {resource_path('.')}")

# Load environment variables (dotenv)
try:
    import dotenv  # type: ignore
    if hc_to_app_env_candidates:
        env_path = os.path.join(hc_to_app_env_candidates[0], ".hc_to_app_env")
        if os.path.exists(env_path):
            dotenv.load_dotenv(dotenv_path=env_path, override=True)
        else:
            log(f".hc_to_app_env file not found at {env_path}")
    else:
        log("Skipping dotenv load (no candidates).")
except Exception as e:
    log(f"[WARN] dotenv load failed: {e}")

# Optional ffmpeg check (informational)
ffmpeg_path = resource_path("apps/ffmpeg")
if os.path.exists(ffmpeg_path):
    log(f"apps/ffmpeg exists: {ffmpeg_path}")
else:
    log(f"apps/ffmpeg not found at: {ffmpeg_path}")

# Log a few relevant envs
for k in sorted(os.environ.keys()):
    if k.startswith(("BACKEND_SERVER_", "STREAM_FUNCTION_", "RECORD_FUNCTION_", "STREAM_SERVER_")):
        log(f"{k} = {os.environ[k]}")

# ----------------------------
# Django settings import path
# ----------------------------
DJANGO_SETTINGS = "processor.settings"          # keep consistent everywhere
ASGI_APP = "processor.asgi:application"         # used by uvicorn.run

log(f"Looking for settings at: {resource_path('backend/processor/settings.py')} "
    f"Exists: {os.path.exists(resource_path('backend/processor/settings.py'))}")
log(f"Looking for settings at: {resource_path('settings.py')} "
    f"Exists: {os.path.exists(resource_path('settings.py'))}")

# Validate that processor.settings is importable before starting servers
try:
    __import__("processor.settings")
    log("processor.settings is importable.")
except Exception as e:
    log("ERROR: processor.settings not found")
    log(str(e))
    sys.exit(1)

# Set Django settings module
os.environ.setdefault("DJANGO_SETTINGS_MODULE", DJANGO_SETTINGS)

# ----------------------------
# Config (with defaults)
# ----------------------------
def env_str(name: str, default: str) -> str:
    v = os.getenv(name, default)
    return v if isinstance(v, str) and v.strip() != "" else default

BACKEND_SERVER_DOMAIN = env_str("BACKEND_SERVER_DOMAIN", "localhost")
BACKEND_SERVER_PORT = env_str("BACKEND_SERVER_PORT", "5051")

STREAM_SERVER_DOMAIN = env_str("STREAM_SERVER_DOMAIN", "localhost")
STREAM_SERVER_PORT = env_str("STREAM_SERVER_PORT", "2501")

# Validate ports:
def _parse_port(p: str, fallback: int) -> int:
    try:
        n = int(p)
        if 0 < n < 65536:
            return n
    except Exception:
        pass
    return fallback

BACKEND_PORT = _parse_port(BACKEND_SERVER_PORT, 5051)
STREAM_PORT = _parse_port(STREAM_SERVER_PORT, 2501)

if not BACKEND_SERVER_DOMAIN:
    log("ERROR: BACKEND_SERVER_DOMAIN is not set or empty")
    sys.exit(1)

# ----------------------------
# Port guards (avoid double bind)
# ----------------------------
def port_in_use(host: str, port: int) -> bool:
    try:
        with socket.create_connection((host, int(port)), timeout=0.5):
            return True
    except OSError:
        return False

start_django = not port_in_use(BACKEND_SERVER_DOMAIN, BACKEND_PORT)
if not start_django:
    log(f"Backend port already in use; not starting another Django server on {BACKEND_SERVER_DOMAIN}:{BACKEND_PORT}.")

start_streamer = not port_in_use(STREAM_SERVER_DOMAIN, STREAM_PORT)
if not start_streamer:
    log(f"Streamer port already in use; not starting another Streamer on {STREAM_SERVER_DOMAIN}:{STREAM_PORT}.")

# ----------------------------
# Server runners
# ----------------------------
def run_django() -> None:
    import uvicorn  # imported here to keep module import cheap if we exit early
    log(f"Starting Django at http://{BACKEND_SERVER_DOMAIN}:{BACKEND_PORT}")
    # workers=1 to avoid PyInstaller + multiprocessing quirks
    uvicorn.run(ASGI_APP, host=BACKEND_SERVER_DOMAIN, port=BACKEND_PORT, log_level="info", workers=1)

def run_streamer() -> None:
    import uvicorn
    log(f"Starting Streamer at http://{STREAM_SERVER_DOMAIN}:{STREAM_PORT}")
    uvicorn.run("apps.streamer.asgi_mpeg:app", host=STREAM_SERVER_DOMAIN, port=STREAM_PORT, log_level="info", workers=1)

def run_cronjob() -> None:
    # Keep this isolated; if it fails, do not bring down servers
    try:
        # Use current Python (PyInstaller embedded) to run module
        subprocess.run([sys.executable, "-m", "processor.cronjob"], check=True, capture_output=True)
    except subprocess.CalledProcessError as e:
        stdout = (e.stdout or b"").decode(errors="replace").strip()
        stderr = (e.stderr or b"").decode(errors="replace").strip()
        code = e.returncode
        msg = stderr or stdout or "No stderr output"
        log(f"[CRONJOB ERROR] Exit code {code}, with error: {msg}")
    except Exception as e:
        log(f"[CRONJOB ERROR] {e}")

# ----------------------------
# Thread orchestration
# ----------------------------
threads: list[threading.Thread] = []

if start_django:
    threads.append(threading.Thread(target=run_django, daemon=True))
if start_streamer:
    threads.append(threading.Thread(target=run_streamer, daemon=True))

# Cronjob can always run; it does not bind ports
threads.append(threading.Thread(target=run_cronjob, daemon=True))

for t in threads:
    t.start()

# Keep the main thread alive
try:
    for t in threads:
        t.join()
except KeyboardInterrupt:
    log("Shutting down servers.")
    sys.exit(0)
