import { app, shell, BrowserWindow, ipcMain, Tray, Menu } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import dotenv from 'dotenv';
dotenv.config({ path: '../../../.env' });

let tray = null
let win = null

function createWindow() {
  win = new BrowserWindow({
    width: 900,
    height: 720,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  win.on('ready-to-show', () => {
    win.show()
    if (is.dev) {
      win.webContents.openDevTools()
    }
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
  tray = new Tray(join(__dirname, '../../../../frontend/assets/icon.png'))
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => { win.show() } },
    { label: 'Quit', click: () => {
      app.isQuiting = true
      app.quit()
    }}
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
