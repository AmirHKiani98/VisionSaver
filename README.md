# CamArchive

CamArchive is a cross-platform desktop application built with **React**, **Electron**, and **Django**. It is designed to collect, record, and manage camera vision data for research and internship projects.

## Features

- **Live Camera Streaming:** View RTSP camera feeds directly in the app.
- **Scheduled Recording:** Automatically record streams based on a schedule.
- **Custom Recording:** Record streams on demand and save to local storage.
- **Centralized Logging:** Unified logging system for backend and frontend.
- **Cross-Platform:** Runs on Windows, macOS, and Linux.
- **Electron Integration:** Backend and frontend bundled for easy deployment.
- **Environment Configuration:** Uses `.hc_to_app_env` for environment variables.

## Technologies Used

- **Frontend:** React, TailwindCSS, Vite, Electron
- **Backend:** Django, Django REST Framework
- **Streaming/Recording:** OpenCV, FFmpeg
- **Packaging:** PyInstaller, electron-builder

## Project Structure

```
CamArchive/
├── backend/                # Django backend (API, cronjobs, models)
│   ├── processor/          # Django settings and core logic
│   ├── cronjob/            # Scheduled recording logic
│   ├── record/             # RTSP stream handling
│   └── logger.py           # Centralized logger class
├── cameravision/           # Electron + React frontend
│   ├── src/                # React source code
│   ├── resources/          # Static files, backend binaries, .env
│   └── package.json        # Electron build config
├── apps/ffmpeg/            # FFmpeg binaries (not bundled with backend)
├── build_backend.sh        # Backend build script (PyInstaller)
├── build_frontend.sh       # Frontend build script (Electron)
├── build.sh                # Master build script
└── README.md
```

## Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/yourusername/CamArchive.git
   cd CamArchive
   ```

2. **Set up environment variables:**
   - Edit `cameravision/resources/.hc_to_app_env` with your settings.

3. **Install dependencies:**
   - **Backend:**  
     ```sh
     cd backend
     pip install -r requirements.txt
     ```
   - **Frontend:**  
     ```sh
     cd cameravision
     npm install
     ```

4. **Build the application:**
   ```sh
   ./build.sh
   ```

5. **Run the app:**
   - Use Electron to start the desktop app.
   - Django backend runs as a separate process managed by Electron.

## Usage

- Access the app via the Electron window.
- Configure camera streams and recording schedules in the UI.
- Recorded files are saved to the configured cache/media directory.

## Notes

- **FFmpeg binaries** are located in `apps/ffmpeg` and are included via Electron's `extraResources`.
- **Backend RAM usage** can be minimized by using PyInstaller's `--onedir` mode and only running the Django server.
- **Logs** are stored in a persistent `logs/` directory next to the executable.

## Author

Amirhossein Kiani

##