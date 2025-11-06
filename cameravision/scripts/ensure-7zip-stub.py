import os
import shutil
import sys

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
stub_src = os.path.join(project_root, "stubs", "7zip-bin")
dest = os.path.join(project_root, "node_modules", "builder-util", "node_modules", "7zip-bin")

def fail(msg, code=1):
    print(msg, file=sys.stderr)
    sys.exit(code)

try:
    if not os.path.exists(stub_src):
        fail(f"Stub source not found: {stub_src}")

    if os.path.exists(dest):
        print(f"7zip-bin stub already present at: {dest}")
        sys.exit(0)

    os.makedirs(os.path.dirname(dest), exist_ok=True)
    shutil.copytree(stub_src, dest)
    print(f"Copied 7zip-bin stub to: {dest}")
    sys.exit(0)
except Exception as e:
    fail(f"Failed to ensure 7zip-bin stub: {e}")