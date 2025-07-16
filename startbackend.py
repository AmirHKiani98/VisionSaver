import os
import sys
import dotenv
import uvicorn

def resource_path(relative_path):
    """
    Get absolute path to resource, works for dev and PyInstaller.
    """
    if hasattr(sys, "_MEIPASS"):
        base_path = sys._MEIPASS  # type: ignore
    else:
        base_path = os.path.abspath(".")

    return os.path.join(base_path, relative_path)

if hasattr(sys, "_MEIPASS"):
    print(f"Running in frozen mode. Base path: {sys._MEIPASS}") # type: ignore
else:
    print(f"Running in dev mode. Base path: {os.path.abspath('.')}")

def find_hc_to_app_env_folders(start_path):
    hc_to_app_env_folders = []
    for root, dirs, files in os.walk(start_path):
        if ".hc_to_app_env" in files:
            hc_to_app_env_folders.append(os.path.abspath(root))
    return hc_to_app_env_folders

sys.path.insert(0, resource_path("backend"))
# Locate .hc_to_app_env
hc_to_app_env_folders = find_hc_to_app_env_folders("../..")
if not hc_to_app_env_folders:
    print("No .hc_to_app_env folders found.")
    sys.exit(1)

print("Found .hc_to_app_env folders:", hc_to_app_env_folders)
print("Using base path:", resource_path("."))

# Load .env file
env_path = resource_path(os.path.join(hc_to_app_env_folders[0], ".hc_to_app_env"))
if not os.path.exists(env_path):
    print(f".hc_to_app_env file not found at {env_path}")
    sys.exit(1)

dotenv.load_dotenv(dotenv_path=env_path, override=True)
# Check for apps/ffmpeg existence
ffmpeg_path = resource_path("apps/ffmpeg")
if os.path.exists(ffmpeg_path):
    print("apps/ffmpeg exists:", ffmpeg_path)
else:
    print("apps/ffmpeg not found at:", ffmpeg_path)
    
# Log relevant environment variables
print("Loaded environment variables:")
for key in sorted(os.environ.keys()):
    if key.startswith("BACKEND_SERVER_") or key.startswith("STREAM_FUNCTION_") or key.startswith("RECORD_FUNCTION_"):
        print(f"{key} = {os.environ[key]}")

# Add base path to sys.path to expose backend/processor/settings.py
sys.path.insert(0, resource_path("."))

print("Looking for settings at:", resource_path("backend/processor/settings.py"))
print("Exists:", os.path.exists(resource_path("backend/processor/settings.py")))

print("Looking for settings at:", resource_path("settings.py"))
print("Exists:", os.path.exists(resource_path("settings.py")))
# Validate processor.settings import
try:
    import processor.settings  # type: ignore
    print("processor.settings is importable.")
except ModuleNotFoundError as e:
    print("ERROR: processor.settings not found")
    print(e)
    sys.exit(1)

internal_backend_path = resource_path("_internal/backend")
if internal_backend_path not in sys.path:
    sys.path.insert(0, internal_backend_path)

# Set DJANGO_SETTINGS_MODULE
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "processor.settings")

# Read backend host/port from environment or use fallback
backend_server_domain = os.getenv("BACKEND_SERVER_DOMAIN", "localhost")
backend_server_port = os.getenv("BACKEND_SERVER_PORT", "8000")

# Validate domain
if not backend_server_domain or backend_server_domain.strip() == "":
    print("ERROR: BACKEND_SERVER_DOMAIN is not set or empty")
    sys.exit(1)

# Validate port
if not backend_server_port or not backend_server_port.isdigit() or not (0 < int(backend_server_port) < 65536):
    print(f"ERROR: Invalid port number '{backend_server_port}'")
    sys.exit(1)

# Prepare Django command
asgi_path = "backend.processor.asgi:application"
host = backend_server_domain
port = int(backend_server_port)

print(f"Starting Uvicorn server at http://{host}:{port}")
uvicorn.run(asgi_path, host=host, port=port, log_level="info")

# Running the streamer server
stream_server_port = int(os.getenv("STREAM_SERVER_PORT", 2500))
stream_server_domain = os.getenv("STREAM_SERVER_DOMAIN", "localhost")

streamer_asgi_path = "backend.apps.streamer.asgi_mpeg:app"
print(f"Starting Streamer server at http://{stream_server_domain}:{stream_server_port}")
uvicorn.run(streamer_asgi_path, host=stream_server_domain, port=stream_server_port, log_level="info")