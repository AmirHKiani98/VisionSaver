#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status

ROOT_BUILD_DIR="dist"
# Clean previous root-level build directory if it exists
if [ -d "$ROOT_BUILD_DIR" ]; then
  echo "🗑️ Removing existing root build directory: $ROOT_BUILD_DIR"
  rm -rf "$ROOT_BUILD_DIR"
fi

BINARY_NAME="startbackend"
# Clean previous build
if [ -d "cameravision/resources/backend" ]; then
  echo "🧹 Removing existing backend directory..."
  rm -rf cameravision/resources/backend
fi

# Detect OS
OS=$(uname)
echo "🖥️ Detected OS: $OS"

# PyInstaller arguments
PYINSTALLER_ARGS=(
  --noconsole
  --onefile
  --name "$BINARY_NAME"
  --add-data "backend:backend"  # <-- this brings in processor/*
  --add-data "backend/apps/ffmpeg:apps/ffmpeg"
  # --add-data "backend/templates:templates"
  # --add-data "backend/static:static"
  --add-data "backend/db.sqlite3:."
  --collect-all cv2
  --collect-all pandas
  --collect-all corsheaders
)

# Build
echo "📦 Building with PyInstaller..."
pyinstaller "${PYINSTALLER_ARGS[@]}" startbackend.py

# Move to resources
echo "📂 Moving built binary to cameravision/resources/backend..."
mkdir -p cameravision/resources/backend
mv "dist/$BINARY_NAME" cameravision/resources/backend/

# Clean build artifacts
echo "🧼 Cleaning up..."
rm -rf dist build "$BINARY_NAME.spec"

echo "✅ Done! Backend is ready."
