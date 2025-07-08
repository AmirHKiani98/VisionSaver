#!/bin/bash

# Navigate to the project directory
cd "$(dirname "$0")/cameravision" || exit 1

# Remove dist and out directories if they exist
if [ -d "dist" ]; then
  echo "Removing dist directory..."
  rm -rf dist
fi

if [ -d "out" ]; then
  echo "Removing out directory..."
  rm -rf out
fi

# Detect the operating system and run the appropriate build command
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  echo "Building for Windows..."
  npm run build:win:portable
elif [[ "$OSTYPE" == "darwin"* ]]; then
  echo "Building for macOS..."
  npm run build:mac:portable
else
  echo "Unsupported operating system: $OSTYPE"
  exit 1
fi

echo "Build process completed."