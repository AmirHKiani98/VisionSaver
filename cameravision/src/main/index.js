import { app, shell, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron'
import { join, resolve } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import dotenv from 'dotenv'
const { execFile } = require('child_process')

// Load .env early
if (is.dev){
  dotenv.config({ path: join(__dirname, '../../resources/.hc_to_app_env') })
} else {
  dotenv.config({ path: join(process.resourcesPath, '.hc_to_app_env') })
}

const domain = process.env.BACKEND_SERVER_DOMAIN
const port = process.env.BACKEND_SERVER_PORT
const url = `http://${domain}:${port}`
const apiHealthUrl = `${url}/${process.env.API_HEALTH_CHECK}`
console.log(`Django server URL: ${url}`)

const frontRoot = resolve(__dirname, '../../')
let djangoProcess = null
const backendBinary = is.dev
  ? join(
      frontRoot,
      'resources',
      'backend',
      process.platform === 'darwin' ? 'startbackend' : 'startbackend.exe'
    )
  : join(
      process.resourcesPath,
      'backend',
      process.platform === 'darwin' ? 'startbackend' : 'startbackend/startbackend.exe' // TODO: fix this for mac packaging as well
    )
if(!is.dev){
  djangoProcess = execFile(backendBinary, {
    cwd: is.dev
      ? join(frontRoot, 'resources', 'backend')
      : join(process.resourcesPath, 'backend')
  }, (error) => {
    if (error) {
      console.error('Django:', error)
    } else {
      console.log('Django server started successfully.')
    }
  })
} else {
  console.log('Running in development mode, Django server will not be started automatically.')
  // Run django from ../../../backend/manage.py runserver
  djangoProcess = execFile('python', ['-m', 'uvicorn', 'backend.processor.asgi:application', '--host', domain, '--port', port], {
      cwd: join(__dirname, '../../../')
    }, (error) => {
      if (error) {
        console.error('Django error:', error)
      } else {
        console.log('Django server started successfully.')
      }
    }
  )
}

djangoProcess.stdout?.on('data', (data) => console.log(`Django: ${data}`))
djangoProcess.stderr?.on('data', (data) => console.error(`Django: ${data}`))

// Kill Django on quit
app.on('before-quit', () => {
  app.isQuiting = true
  if (djangoProcess && !djangoProcess.killed) {
    console.log('Killing Django server...')
    djangoProcess.stdout?.destroy()
    djangoProcess.stderr?.destroy()
    djangoProcess.kill()
  }
})

// Define window globals
let splashWindow = null
let tray = null
let win = null

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 700,
    height: 400,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    show: true,
    autoHideMenuBar: true
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    splashWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/loading.html`)
  } else {
    splashWindow.loadFile(join(__dirname, '../renderer/loading.html'))
  }
}

function createWindow() {
  win = new BrowserWindow({
    width: 1050,
    height: 820,
    show: false,
    autoHideMenuBar: true,
    icon: join(__dirname, '../../resources/icon.icns'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  win.on('ready-to-show', () => {
    splashWindow?.destroy()
    win.show()
  })

  win.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault()
      win.hide()
    }
  })

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function waitForHealthPing(url, callback) {
  const interval = setInterval(() => {
    console.log(`Checking health at ${url}...`)
    fetch(url)
      .then((res) => {
        if (res.ok) {
          clearInterval(interval)
          callback()
        }
      })
      .catch(() => {}) // silent retry
  }, 500)
}

// Initial app startup
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  // 🟢 Show splash *immediately*
  createSplashWindow()

  // 🟡 Start waiting for Django
  import('wait-on')
    .then((mod) => {
      const waitOn = mod.default
      console.log('Waiting for Django server to be ready...')

      waitOn({ resources: [url], timeout: 7500 }, (err) => {
        if (err) {
          console.error('Django server failed to start:', err)
          console.warn('Opening app anyway in fallback mode...')
          // Close app
            if (splashWindow) splashWindow.destroy()
            if (win) win.destroy()
            app.isQuiting = true
            app.quit()
        } else {
          console.log('Django server is ready.')
          waitForHealthPing(apiHealthUrl, () => {
            createWindow() // load main app window
          })
        }
      })
    })
    .catch((e) => {
      console.error('Failed to load wait-on:', e)
      process.exit(1)
    })

  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('get-env', () => ({ ...process.env }))

  const trayIcon = is.dev
  ? nativeImage.createFromPath(join(__dirname, '../../resources/icon.ico'))
  : nativeImage.createFromPath(join(process.resourcesPath, 'icon.ico'))
  tray = new Tray(trayIcon)
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => win.show() },
    {
      label: 'Quit',
      click: () => {
        app.isQuiting = true
        win?.destroy()
        app.quit()
      }
    }
  ])
  tray.setToolTip('Camera Vision')
  tray.setContextMenu(contextMenu)
  tray.on('double-click', () => win?.show())

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
})

app.on('window-all-closed', (event) => {
  if (!app.isQuiting) {
    event.preventDefault()
    win?.hide()
  } else {
    app.quit()
  }
})

app.on('activate', () => {
  if (win) win.show()
})
