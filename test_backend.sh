#!/bin/bash

# Detect the operating system
OS=$(uname)

# Run the appropriate backend executable based on the OS
if [[ "$OS" == "Darwin" ]]; then
    # macOS
    ./cameravision/resources/backend/startbackend
elif [[ "$OS" == "Linux" ]]; then
    echo "This script is not configured for Linux."
    exit 1
elif [[ "$OS" =~ "MINGW" || "$OS" =~ "CYGWIN" ]]; then
    # Windows (Git Bash or Cygwin)
    ./cameravision/resources/backend/startbackend.exe
else
    echo "Unsupported operating system: $OS"
    exit 1
fi