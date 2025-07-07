import { app, shell, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron'
import { join, resolve } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import appIcon from '../../resources/icon.png?asset' // Use .png for tray icon
const { execFile } = require('child_process')
const waitOn = require('wait-on')

import dotenv from 'dotenv'
// Adjust the path to point to the correct .env location
dotenv.config({ path: join(__dirname, '../../resources/.hc_to_app_env') })

// --- Django startup path fix ---
const frontRoot = resolve(__dirname, '../../')

const backendBinary = is.dev
  ? join(
      frontRoot,
      'resources',
      'backend',
      process.platform === 'darwin' ? 'startbackend' : 'startbackend.exe'
    ) // dev mode: local binary
  : join(
      process.resourcesPath,
      'resources',
      'backend',
      process.platform === 'darwin' ? 'startbackend' : 'startbackend.exe'
    ) // production: in packaged app

const djangoProcess = execFile(backendBinary, (error) => {
  if (error) {
    console.error('Django error:', error)
  } else {
    console.log('Django server started successfully.')
  }
})

ipcMain.handle('get-env', () => ({
  ...process.env
}))

const domain = process.env.BACKEND_SERVER_DOMAIN
const port = process.env.BACKEND_SERVER_PORT
const url = `http://${domain}:${port}`
console.log(`Django server URL: ${url}`)

// Ensure Django server is killed when Electron app quits
app.on('before-quit', () => {
  app.isQuiting = true
  if (djangoProcess && !djangoProcess.killed) {
    console.log('Killing Django server...')
    djangoProcess.kill()
  }
})

// Wait for Django server to be ready
waitOn({ resources: [url] }, (err) => {
  console.log('Waiting for Django server to be ready...')
  if (err) {
    console.error('Django server failed to start:', err)
    process.exit(1)
  }
})

djangoProcess.stdout &&
  djangoProcess.stdout.on('data', (data) => {
    console.log(`Django: ${data}`)
  })

djangoProcess.stderr &&
  djangoProcess.stderr.on('data', (data) => {
    console.error(`Django error: ${data}`)
  })

// Use .ico for app icon (Windows), .png for tray
const iconIco = join(__dirname, '../../resources/icon.png')

let tray = null
let win = null

function createWindow() {
  win = new BrowserWindow({
    width: 1050,
    height: 720,
    show: false,
    autoHideMenuBar: true,
    icon: iconIco, // Use .ico for app icon
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
  tray = new Tray(nativeImage.createFromPath(appIcon)) // Use .png for tray icon
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        win.show()
      }
    },
    {
      label: 'Quit',
      click: () => {
        app.isQuiting = true
        win.destroy() // <-- ensure window closes completely
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
app.on('window-all-closed', (event) => {
  if (!app.isQuiting) {
    event.preventDefault()
    if (win) win.hide()
  } else {
    app.quit()
  }
})
app.on('activate', () => {
  if (win) {
    win.show()
  }
})