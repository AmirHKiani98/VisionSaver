import os
import sys
from django.core.management import execute_from_command_line
import dotenv

def resource_path(relative_path):
    try:
        # Check if running in a PyInstaller bundled environment
        base_path = sys._MEIPASS # type: ignore
    except AttributeError:
        # Fallback to the current working directory
        base_path = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base_path, relative_path)

def find_hc_to_app_env_folders(start_path):
    hc_to_app_env_folders = []
    for root, dirs, files in os.walk(start_path):
        if ".hc_to_app_env" in files:
            hc_to_app_env_folders.append(os.path.abspath(root))
    return hc_to_app_env_folders
hc_to_app_env_folders = find_hc_to_app_env_folders("..")

if not hc_to_app_env_folders:
    print("❌ No .hc_to_app_env folders found.")
    sys.exit(1)
print("✅ Found .hc_to_app_env folders:", hc_to_app_env_folders)
# DEBUG print
print("Using base path:", resource_path("."))

# Load .hc_to_app_env from the first found folder
env_path = resource_path(os.path.join(hc_to_app_env_folders[0], ".hc_to_app_env"))
if not os.path.exists(env_path):
    print(f"❌ .hc_to_app_env file not found at {env_path}")
    sys.exit(1)

dotenv.load_dotenv(dotenv_path=env_path, override=True)

# Debugging: Print all loaded environment variables
print("✅ Loaded environment variables:")
for key, value in os.environ.items():
    if key.startswith("BACKEND_SERVER_") or key.startswith("STREAM_FUNCTION_") or key.startswith("RECORD_FUNCTION_"):
        print(f"{key} = {value}")

print("✅ BACKEND_SERVER_DOMAIN =", os.getenv("BACKEND_SERVER_DOMAIN"))
print("✅ BACKEND_SERVER_PORT =", os.getenv("BACKEND_SERVER_PORT"))
# Add backend path into sys.path
sys.path.insert(0, resource_path("backend"))

# Confirm processor.settings is visible
try:
    import processor.settings # type: ignore
    print("✅ processor.settings is importable.")
except ModuleNotFoundError as e:
    print("❌ ERROR: processor.settings not found")
    print(e)
    sys.exit(1)

# Set correct Django settings module
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "processor.settings")

# Ensure BACKEND_SERVER_DOMAIN and BACKEND_SERVER_PORT are set
backend_server_domain = os.getenv("BACKEND_SERVER_DOMAIN", "localhost")  # Default to localhost
backend_server_port = os.getenv("BACKEND_SERVER_PORT", "8000")  # Default to port 8000

# Validate environment variables
if backend_server_domain is None or backend_server_domain.strip() == "":
    print("❌ ERROR: BACKEND_SERVER_DOMAIN is not set or empty")
    sys.exit(1)

if backend_server_port is None or backend_server_port.strip() == "":
    print("❌ ERROR: BACKEND_SERVER_PORT is not set or empty")
    sys.exit(1)

if not backend_server_port.isdigit() or not (0 < int(backend_server_port) < 65536):
    print(f"❌ ERROR: Invalid port number '{backend_server_port}'")
    sys.exit(1)

# Ensure sys.argv contains valid arguments
sys.argv = ["manage.py", "runserver", "--noreload", f"{backend_server_domain}:{backend_server_port}"]

# Run Django development server
execute_from_command_line(sys.argv)
