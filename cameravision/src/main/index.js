import { app, shell, BrowserWindow, ipcMain, Tray, Menu } from 'electron'
import { join, resolve } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

const { exec, execFile } = require('child_process');
const waitOn = require('wait-on');

import icon from '../../resources/icon.png'
import dotenv from 'dotenv';
// Adjust the path to point to the correct .env location
dotenv.config({ path: join(__dirname, '../../../.env') });
console.log("Current file path:", __filename);
console.log("Current directory:", __dirname);

// --- Django startup path fix ---
const projectRoot = resolve(__dirname, '../../../');
const pythonPath = join(projectRoot, '.venv', 'Scripts', 'python.exe');
const managePyPath = join(projectRoot, 'backend', 'manage.py');
console.log('Resolved Python path:', pythonPath);
console.log('Resolved manage.py path:', managePyPath);

ipcMain.handle('get-env', () => ({
  ...process.env
}));

const domain = process.env.BACKEND_SERVER_DOMAIN;
const port = process.env.BACKEND_SERVER_PORT;
const url = `http://${domain}:${port}`;
console.log(`Django server URL: ${url}`);
// Start Django server with absolute paths
const djangoProcess = exec(`"${pythonPath}" "${managePyPath}" runserver`, (error) => {
  if (error) {
    console.error('Django error:', error);
  }
});

// Ensure Django server is killed when Electron app quits
app.on('before-quit', () => {
  if (djangoProcess && !djangoProcess.killed) {
    console.log('Killing Django server...');
    djangoProcess.kill();
  }
});

// Wait for Django server to be ready
waitOn({ resources: [url] }, (err) => {
  console.log('Waiting for Django server to be ready...');
  if (err) {
    console.error('Django server failed to start:', err);
    process.exit(1);
  }
  // // Start Vite and Electron app
  // const viteProcess = exec('vite');
  // viteProcess.stdout.on('data', (data) => {
  //   console.log(`Vite: ${data}`);
  // });

  // viteProcess.stderr.on('data', (data) => {
  //   console.error(`Vite error: ${data}`);
  // });

  // const electronProcess = exec('electron .');
  // electronProcess.stdout.on('data', (data) => {
  //   console.log(`Electron: ${data}`);
  // });

  // electronProcess.stderr.on('data', (data) => {
  //   console.error(`Electron error: ${data}`);
  // });
});

djangoProcess.stdout && djangoProcess.stdout.on('data', (data) => {
  console.log(`Django: ${data}`);
});

djangoProcess.stderr && djangoProcess.stderr.on('data', (data) => {
  console.error(`Django error: ${data}`);
});

let tray = null
let win = null

function createWindow() {
  win = new BrowserWindow({
    width: 1050,
    height: 720,
    show: false,
    autoHideMenuBar: true,
    icon: icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  win.on('ready-to-show', () => {
    win.show()

  })

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Minimize to tray on close
  win.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault()
      win.hide()
    }
    return false
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  // Create tray icon
  tray = new Tray(join(__dirname, '../../resources/icon.png'))
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => { win.show() } },
    {
      label: 'Quit', click: () => {
        app.isQuiting = true
        app.quit()
      }
    }
  ])
  tray.setToolTip('Camera Vision')
  tray.setContextMenu(contextMenu)
  tray.on('double-click', () => {
    win.show()
  })
})

// Prevent app from quitting when all windows are closed
app.on('window-all-closed', () => {
  // Do not quit app when all windows are closed
})
