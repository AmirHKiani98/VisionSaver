#!/bin/bash

# Determine the OS
OS=$(uname)

# Navigate to the Electron project folder
cd cameravision

# Run the appropriate build command
if [[ "$OS" == "Darwin" ]]; then
  echo "Building Electron app for macOS..."
  npm run build:mac
elif [[ "$OS" == "Linux" ]]; then
  echo "Building Electron app for Linux..."
  npm run build:linux
elif [[ "$OS" == "MINGW64_NT"* || "$OS" == "CYGWIN_NT"* ]]; then
  echo "Building Electron app for Windows..."
  npm run build:win
else
  echo "Unsupported OS: $OS"
  exit 1
fi
