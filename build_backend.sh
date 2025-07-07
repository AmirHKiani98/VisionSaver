#!/bin/bash

set -e  # Exit on any error

# Define backend binary output name (PyInstaller default is the .py filename)
BINARY_NAME="startbackend"

# Clean up previous build output
if [ -d "cameravision/resources/backend" ]; then
  echo "🧹 Removing old backend directory..."
  rm -rf cameravision/resources/backend
fi

# Detect OS
OS=$(uname)
echo "🖥️ Detected OS: $OS"

# Set resource paths (absolute if needed)
FFMPEG_PATH="backend/apps/ffmpeg"
TEMPLATES_PATH="backend/templates"
STATIC_PATH="backend/static"
DB_PATH="backend/db.sqlite3"

# Define PyInstaller args
PYINSTALLER_ARGS=(
  --noconsole
  --onefile
  --name "$BINARY_NAME"
  --add-data "${FFMPEG_PATH}:apps/ffmpeg"
  --add-data "${TEMPLATES_PATH}:templates"
  --add-data "${STATIC_PATH}:static"
  --add-data "${DB_PATH}:."
  --collect-all cv2
  --collect-all pandas
  --collect-all corsheaders
)

# Build with PyInstaller
echo "📦 Building with PyInstaller..."
pyinstaller "${PYINSTALLER_ARGS[@]}" startbackend.py

# Verify build success
if [ ! -f "dist/$BINARY_NAME" ]; then
  echo "❌ Build failed: binary not found in dist/"
  exit 1
fi

# Move build output
echo "📂 Moving $BINARY_NAME to cameravision/resources/backend/"
mkdir -p cameravision/resources/backend
mv "dist/$BINARY_NAME" cameravision/resources/backend/

# Clean up PyInstaller artifacts
echo "🧼 Cleaning up build artifacts..."
rm -rf dist build "$BINARY_NAME.spec"

echo "✅ Backend build complete."
