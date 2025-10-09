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

# Build with code signing disabled
echo "Building for Windows (without code signing)..."
npm run build
CSC_IDENTITY_AUTO_DISCOVERY=false npx electron-builder --win --dir --config.win.signAndEditExecutable=false

echo "Build process completed."

# Add pause at the end to keep the window open
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  echo "Press any key to continue..."
  read -n 1 -s
else
  echo "Press Enter to continue..."
  read
fi