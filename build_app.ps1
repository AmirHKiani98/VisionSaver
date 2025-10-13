#!/usr/bin/env pwsh
# Main build script for VisionSaver application

# Kill any running processes that might be locking files
Write-Host "Killing any running instances of the app..."
Get-Process -Name camarchive -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Set the binary name for the backend
$BINARY_NAME = "startbackend"

# Activate Python virtual environment
& .\.venv\Scripts\Activate.ps1

Write-Host "Step 1: Building backend with PyInstaller..."
# Clean previous builds
if (Test-Path "cameravision/resources/backend") {
    Remove-Item -Recurse -Force "cameravision/resources/backend" -ErrorAction SilentlyContinue
}

if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
}

# Make sure all files are released
Start-Sleep -Seconds 2

# Build the backend using PyInstaller
Write-Host "Building with PyInstaller..."
pyinstaller --name $BINARY_NAME --onedir --clean --distpath dist --add-data "backend:backend" startbackend.py

# Move built binary to cameravision/resources/backend
Write-Host "Moving built binary to cameravision/resources/backend..."
New-Item -Path "cameravision/resources/backend" -ItemType Directory -Force
Copy-Item -Recurse "dist/$BINARY_NAME/*" -Destination "cameravision/resources/backend/"

Write-Host "Backend build complete!"

# Now build the Electron app
Write-Host "Step 2: Building Electron app..."
Push-Location cameravision
npm run build

Write-Host "Step 3: Packaging Electron app for Windows..."
npm run build:win

Pop-Location
Write-Host "Build and packaging complete! Check the dist folder for the packaged application."