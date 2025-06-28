#!/bin/bash
if command -v ffmpeg >/dev/null 2>&1; then
    echo "ffmpeg is already installed."
    exit 0
fi
# Download ffmpeg-release-essentials.zip using curl
curl -L "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip" -o "$HOME/Downloads/ffmpeg.zip"

powershell.exe -Command "Expand-Archive -Path \"$env:USERPROFILE\\Downloads\\ffmpeg.zip\" -DestinationPath \"$env:USERPROFILE\\ffmpeg\""

# Find the bin directory inside the extracted ffmpeg folder
FFMPEG_BIN=$(find "$HOME/ffmpeg" -type d -name bin | head -n 1)

# Add ffmpeg bin directory to PATH for the current session
export PATH="$FFMPEG_BIN:$PATH"

