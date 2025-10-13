#!/usr/bin/env pwsh
# Quick fix script for the Apache folder structure issue

# Activate Python virtual environment
& .\.venv\Scripts\Activate.ps1

# Kill any running processes that might be locking files
Write-Host "Killing any running instances of the app..."
Get-Process -Name camarchive -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Create proper directory structure
Write-Host "Creating proper Apache directory structure..."
$appsDir = "cameravision/resources/backend/apps"
$apacheDir = "$appsDir/apache24"
$confDir = "$apacheDir/conf"
$binDir = "$apacheDir/bin"

# Create directories if they don't exist
New-Item -Path $appsDir -ItemType Directory -Force
New-Item -Path $apacheDir -ItemType Directory -Force
New-Item -Path $confDir -ItemType Directory -Force
New-Item -Path $binDir -ItemType Directory -Force

# Copy Apache files from _internal folder structure
Write-Host "Copying Apache files from _internal folder..."
$sourceConfDir = "cameravision/resources/backend/_internal/backend/apps/apache24/conf"
$sourceBinDir = "cameravision/resources/backend/_internal/backend/apps/apache24/bin"

if (Test-Path "$sourceConfDir/httpd.conf") {
    Copy-Item -Path "$sourceConfDir/httpd.conf" -Destination "$confDir/" -Force
    Write-Host "Copied httpd.conf to $confDir/"
} else {
    Write-Host "WARNING: httpd.conf not found in $sourceConfDir/"
}

if (Test-Path "$sourceBinDir/httpd.exe") {
    Copy-Item -Path "$sourceBinDir/httpd.exe" -Destination "$binDir/" -Force
    Write-Host "Copied httpd.exe to $binDir/"
} else {
    Write-Host "WARNING: httpd.exe not found in $sourceBinDir/"
}

# Copy the files to the packaged app directory as well
if (Test-Path "dist/v1.0.1/win-unpacked/resources/backend/_internal/backend/apps/apache24") {
    Write-Host "Copying to packaged app directory..."
    $packagedAppsDir = "dist/v1.0.1/win-unpacked/resources/backend/apps"
    $packagedApacheDir = "$packagedAppsDir/apache24"
    $packagedConfDir = "$packagedApacheDir/conf"
    $packagedBinDir = "$packagedApacheDir/bin"

    New-Item -Path $packagedAppsDir -ItemType Directory -Force
    New-Item -Path $packagedApacheDir -ItemType Directory -Force
    New-Item -Path $packagedConfDir -ItemType Directory -Force
    New-Item -Path $packagedBinDir -ItemType Directory -Force

    $packagedSourceConfDir = "dist/v1.0.1/win-unpacked/resources/backend/_internal/backend/apps/apache24/conf"
    $packagedSourceBinDir = "dist/v1.0.1/win-unpacked/resources/backend/_internal/backend/apps/apache24/bin"

    if (Test-Path "$packagedSourceConfDir/httpd.conf") {
        Copy-Item -Path "$packagedSourceConfDir/httpd.conf" -Destination "$packagedConfDir/" -Force
        Write-Host "Copied httpd.conf to $packagedConfDir/"
    }

    if (Test-Path "$packagedSourceBinDir/httpd.exe") {
        Copy-Item -Path "$packagedSourceBinDir/httpd.exe" -Destination "$packagedBinDir/" -Force
        Write-Host "Copied httpd.exe to $packagedBinDir/"
    }
}

Write-Host "Done!"