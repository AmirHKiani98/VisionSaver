// main.ts / main.js (Electron main process)

import { app, shell, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron'
import { join, resolve } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import dotenv from 'dotenv'
const fs = require('fs')
const path = require('path')
const chokidar = require('chokidar')

// --- Ensure single instance (prevents double spawns/port collisions) ---
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows()
    if (win) {
      if (win.isMinimized()) win.restore()
      win.show()
      win.focus()
    }
  })
}

// Helpers declared early so they exist for functions below
const { execFile, exec, spawn } = require('child_process')

// --- Ports killer ---
function killPort(port, cb) {
  const killCmd = process.platform === 'win32'
    ? `for /f "tokens=5" %a in ('netstat -nao ^| find ":${port}" ^| find "LISTENING"') do taskkill /f /pid %a`
    : `lsof -ti :${port} | xargs kill -9`

  exec(killCmd, (err, _stdout, stderr) => {
    if (err) {
      console.warn(`Warning: Could not free port ${port}:`, (stderr || '').toString().trim())
    } else {
      console.log(`✔ Freed port ${port}`)
    }
    cb?.()
  })
}

// Small HTTP helper (HEAD with timeout)
async function headOk(u, ms = 1500) {
  try {
    // Node 18+ has global fetch + AbortController
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), ms)
    const res = await fetch(u, { method: 'HEAD', signal: ctrl.signal })
    clearTimeout(t)
    return res.ok
  } catch {
    return false
  }
}

// We declare these now; values filled after env loads
let streamerPort
function freeStreamerPortIfSet() {
  const p = Number(streamerPort)
  if (!Number.isFinite(p)) return
  killPort(p, () => {})
}

// --- Load environment variables early ---
let envPath
if (is.dev) {
  envPath = path.join(__dirname, '../../resources/.hc_to_app_env')
} else {
  envPath = path.join(process.resourcesPath, '.hc_to_app_env')
}
dotenv.config({ path: envPath })

const backendDomain = process.env.BACKEND_SERVER_DOMAIN || 'localhost'
const backendPort = process.env.BACKEND_SERVER_PORT || '8000'

// Optional skips for waits (useful when backend is flaky but you still want UI up)
const SKIP_API_WAIT = process.env.SKIP_API_WAIT === '1'
const SKIP_STREAMER_WAIT = process.env.SKIP_STREAMER_WAIT === '1'

// Helper function for safely reading files
function safeRead(file) {
  try {
    return fs.readFileSync(file, 'utf8')
  } catch (e) {
    console.error('❌ Failed to read', file, e.message)
    return null
  }
}

// Helper function to get production backend root path
function getProdBackendRoot() {
  // You copy the PyInstaller folder to: <resources>/backend/startbackend
  const rootA = path.resolve(process.resourcesPath, 'backend', 'startbackend')
  const rootB = path.resolve(process.resourcesPath, 'backend') // fallback
  const exeA = path.join(rootA, process.platform === 'win32' ? 'startbackend.exe' : 'startbackend')
  if (fs.existsSync(exeA)) return rootA
  return rootB
}

// Get production backend root path
const prodBackendRoot = is.dev ? null : getProdBackendRoot()

// Paths
let httpdConfPath, apacheRoot, mediaPath
if (is.dev) {
  httpdConfPath = path.resolve(__dirname, '../../../backend/apps/apache24/conf/httpd.conf')
  apacheRoot = path.resolve(__dirname, '../../../backend/apps/apache24')
  mediaPath = path.resolve(__dirname, '../../../backend/media')
} else {
  const backendDir = path.join(process.resourcesPath, 'backend')

  console.log('Searching for httpd.conf in multiple locations...')
  const possibleConfPaths = [
    path.join(backendDir, 'apps', 'apache24', 'conf', 'httpd.conf'),
    path.join(backendDir, 'startbackend', '_internal', 'backend', 'apps', 'apache24', 'conf', 'httpd.conf'),
    path.join(backendDir, '_internal', 'backend', 'apps', 'apache24', 'conf', 'httpd.conf')
  ]

  possibleConfPaths.forEach((p, i) => {
    console.log(`Path option ${i + 1}: ${p} (exists: ${fs.existsSync(p)})`)
  })

  let foundPath = possibleConfPaths.find(p => fs.existsSync(p))

  if (foundPath) {
    console.log('Found httpd.conf at:', foundPath)
    httpdConfPath = foundPath
    apacheRoot = path.dirname(path.dirname(foundPath)) // Go up two dirs from conf
    mediaPath = path.join(path.dirname(path.dirname(path.dirname(foundPath))), 'media')
    console.log('Using apacheRoot:', apacheRoot)
    console.log('Using mediaPath:', mediaPath)
  } else {
    console.log('No existing httpd.conf found, defaulting to first path option')
    httpdConfPath = possibleConfPaths[0]
    apacheRoot = path.dirname(path.dirname(httpdConfPath))
    mediaPath = path.join(backendDir, 'media')
  }
}

console.log('Apache config path:', httpdConfPath)
console.log('Apache config exists:', fs.existsSync(httpdConfPath))
console.log('Apache root:', apacheRoot)
console.log('Media path:', mediaPath)

// Function to update Apache configuration
function updateApacheConfig() {
  let conf = null
  if (fs.existsSync(httpdConfPath)) {
    conf = safeRead(httpdConfPath)
  } else {
    console.warn('⚠ httpd.conf not found at', httpdConfPath, '— skipping Apache edits')
    return
  }

  if (conf) {
    conf = conf.replace(/Define SRVROOT .*/g, `Define SRVROOT "${apacheRoot.replace(/\\/g, '/')}"`)
    conf = conf.replace(/Alias \/media\/ .*/g, `Alias /media/ "${mediaPath.replace(/\\/g, '/')}/"`)
    conf = conf.replace(/<Directory .*media.*>/g, `<Directory "${mediaPath.replace(/\\/g, '/')}/">`)

    conf = conf.replace(/^#LoadModule proxy_module /m, 'LoadModule proxy_module ')
    conf = conf.replace(/^#LoadModule proxy_http_module /m, 'LoadModule proxy_http_module ')

    const proxyBlock = `
# Proxy API requests to Django backend
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so

ProxyPass /api/ http://${backendDomain}:${backendPort}/api/
ProxyPassReverse /api/ http://${backendDomain}:${backendPort}/api/
`

    conf = conf.replace(/# Proxy API requests[\s\S]*?ProxyPassReverse \/api\/.*\n?/g, '')
    conf += '\n' + proxyBlock

    try {
      fs.writeFileSync(httpdConfPath, conf, 'utf8')
      console.log('✅ Successfully updated Apache configuration')
    } catch (e) {
      console.error('❌ Failed to write httpd.conf:', e.message)
    }
  }
}

try {
  updateApacheConfig()
} catch (e) {
  console.error('❌ updateApacheConfig failed:', e)
}

let apacheProcess = null
let apachePid = null

// Determine Apache executable path
let apacheExe
if (is.dev) {
  apacheExe = path.resolve(__dirname, '../../../backend/apps/apache24/bin/httpd.exe')
} else {
  const possiblePaths = [
    path.join(process.resourcesPath, 'backend', 'apps', 'apache24', 'bin', 'httpd.exe'),
    path.join(process.resourcesPath, 'backend', 'startbackend', '_internal', 'backend', 'apps', 'apache24', 'bin', 'httpd.exe'),
    path.join(process.resourcesPath, 'backend', '_internal', 'backend', 'apps', 'apache24', 'bin', 'httpd.exe')
  ]
  apacheExe = possiblePaths.find(p => fs.existsSync(p)) || possiblePaths[0]
}

console.log('Apache executable path:', apacheExe)
console.log('Apache executable exists:', fs.existsSync(apacheExe))

function startApache() {
  if (apacheProcess && !apacheProcess.killed) return
  try {
    apacheProcess = spawn(apacheExe, ['-f', httpdConfPath], {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    })
    apachePid = apacheProcess.pid
    apacheProcess.stdout.on('data', d => console.log('[apache]', d.toString()))
    apacheProcess.stderr.on('data', d => console.error('[apache]', d.toString()))
    apacheProcess.on('exit', c => console.log('[apache] exited', c))
    apacheProcess.on('error', e => console.error('[apache] error', e))
  } catch (e) {
    console.error('❌ Failed to spawn Apache:', e)
  }
}

function stopApache() {
  if (apacheProcess && !apacheProcess.killed) {
    apacheProcess.kill()
    apacheProcess = null
  } else if (apachePid) {
    try {
      process.kill(apachePid)
    } catch {}
    apachePid = null
  }
}

const out = fs.openSync('./cronjob-out.log', 'a')
const err = fs.openSync('./cronjob-err.log', 'a')
const pythonExe = process.platform === 'win32' ? 'pythonw' : 'python'
let pathToKeepMeAlive = null
if (is.dev) {
  pathToKeepMeAlive = join(__dirname, '../../../backend/apps/dto/main.py')
} else {
  pathToKeepMeAlive = join(process.resourcesPath, 'backend', 'startbackend', '_internal', 'backend', 'apps', 'dto', 'main.py')
}
const keepAliveOptions = { detached: true, stdio: 'ignore', ...(process.platform === 'win32' ? { windowsHide: true } : {}) }

function keepMeAlive() {
  if (!global.keepMeAliveProcess || global.keepMeAliveProcess.killed) {
    global.keepMeAliveProcess = spawn(pythonExe, [pathToKeepMeAlive], keepAliveOptions)
    global.keepMeAliveProcess.unref()
  }
}

function stopKeepingMeAlive() {
  if (global.keepMeAliveProcess && !global.keepMeAliveProcess.killed) {
    try { global.keepMeAliveProcess.kill() } catch {}
    global.keepMeAliveProcess = null
  }
}

ipcMain.handle('keep-me-alive', () => {
  keepMeAlive()
  return { status: 'started' }
})

ipcMain.handle('stop-keep-me-alive', () => {
  stopKeepingMeAlive()
  return { status: 'stopped' }
})

ipcMain.handle('get-window-bounds', () => {
  const win = BrowserWindow.getFocusedWindow()
  if (!win) return null
  return win.getBounds()
})

// Load .env (again) after Electron init paths are ready (harmless double load)
if (is.dev) {
  dotenv.config({ path: join(__dirname, '../../resources/.hc_to_app_env') })
} else {
  dotenv.config({ path: join(process.resourcesPath, '.hc_to_app_env') })
}

const domain = process.env.BACKEND_SERVER_DOMAIN
const port = process.env.BACKEND_SERVER_PORT
const streamerDomain = process.env.STREAM_SERVER_DOMAIN || 'localhost'
streamerPort = process.env.STREAM_SERVER_PORT || 2500

const url = `http://${domain}:${port}`
const streamerUrl = `http://${streamerDomain}:${streamerPort}`
const apiHealthUrl = `${url}/${process.env.API_HEALTH_CHECK}`
const streamerHealthUrl = `${streamerUrl}/${process.env.API_HEALTH_CHECK}/`
const frontRoot = resolve(__dirname, '../../')
let djangoProcess = null
let streamerProcess = null
let cronJobProcess = null

function freePortIfSet() {
  const p = Number(port)
  if (!Number.isFinite(p)) return
  killPort(p, () => {})
}

// Free the ports in production (API + Streamer)
if (!is.dev) {
  try {
    freePortIfSet()
    freeStreamerPortIfSet()
  } catch (e) {
    console.error('❌ Failed to free ports:', e)
  }
}

// Backend spawn guard to avoid duplicate spawns
let backendSpawned = false

// Check multiple possible locations for the backend binary
console.log('Searching for Django backend binary...')
const possibleBackendBinaries = is.dev
  ? [join(frontRoot, 'resources', 'backend', process.platform === 'darwin' ? 'startbackend' : 'startbackend.exe')]
  : [
      join(process.resourcesPath, 'backend', process.platform === 'darwin' ? 'startbackend' : 'startbackend.exe'),
      join(process.resourcesPath, 'backend', 'startbackend', process.platform === 'darwin' ? 'startbackend' : 'startbackend.exe')
    ]

possibleBackendBinaries.forEach((p, i) => {
  console.log(`Backend binary option ${i + 1}: ${p} (exists: ${fs.existsSync(p)})`)
})

const backendBinary = possibleBackendBinaries.find(p => fs.existsSync(p)) || possibleBackendBinaries[0]
console.log('Using backend binary:', backendBinary)

const possibleCwds = is.dev
  ? [join(__dirname, '../../../backend')]
  : [
      join(process.resourcesPath, 'backend'),
      join(process.resourcesPath, 'backend', '_internal', 'backend'),
      join(process.resourcesPath, 'backend', 'startbackend', '_internal', 'backend'),
      path.dirname(backendBinary)
    ]

possibleCwds.forEach((p, i) => {
  console.log(`Backend CWD option ${i + 1}: ${p} (exists: ${fs.existsSync(p)})`)
})

const backendCwd = possibleCwds.find(p => fs.existsSync(p)) || possibleCwds[0]
console.log('Using backend CWD:', backendCwd)

const djangoLogFile = path.join(app.getPath('userData'), 'django-debug.log')
console.log(`Django output will be logged to: ${djangoLogFile}`)
fs.writeFileSync(djangoLogFile, `=== Django Debug Log ${new Date().toISOString()} ===\n`, { flag: 'a' })

function logToFile(message) {
  console.log(message)
  fs.appendFileSync(djangoLogFile, message + '\n', { flag: 'a' })
}

// --- PROD: spawn packaged backend only if it's NOT already running ---
async function ensureBackendRunning() {
  if (backendSpawned) return
  const alreadyUp = await headOk(url, 1200) // preflight: don't spawn if port already serves HTTP
  if (alreadyUp) {
    console.log(`🔵 Backend already serving at ${url}; skipping spawn.`)
    backendSpawned = true
    return
  }

  backendSpawned = true
  logToFile('Starting Django backend from: ' + backendBinary)
  logToFile('Working directory: ' + backendCwd)

  try {
    djangoProcess = spawn(backendBinary, [], {
      cwd: backendCwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    })
    logToFile(`Django process started with PID: ${djangoProcess.pid}`)
  } catch (e) {
    logToFile(`❌ Failed to spawn Django backend: ${e.message}`)
    logToFile(`Error stack: ${e.stack}`)
  }

  djangoProcess?.stdout?.on('data', (data) => {
    const output = data.toString().trim()
    logToFile(`[${new Date().toISOString()}] Django stdout: ${output}`)
  })

  djangoProcess?.stderr?.on('data', (data) => {
    const output = data.toString().trim()
    logToFile(`[${new Date().toISOString()}] Django stderr: ${output}`)
    // Hint users when 500 due to WMI (vpnconnector) is suspected
    if (output.includes('pywintypes.com_error') || output.includes('wmi.py')) {
      logToFile(`[hint] If you don't need VPN, set ENABLE_VPN=0 and lazy-import wmi to avoid boot-time 500s.`)
    }
  })

  djangoProcess?.on('error', (err) => {
    logToFile(`[${new Date().toISOString()}] Django process error: ${err.message}`)
    logToFile(`Error stack: ${err.stack}`)
  })

  djangoProcess?.on('exit', (code) => {
    logToFile(`[${new Date().toISOString()}] Django process exited with code: ${code}`)
  })
}

if (!is.dev) {
  ensureBackendRunning()
} else {
  // --- DEV MODE: run django + streamer from source tree and watch ---
  function startDjango() {
    if (djangoProcess && !djangoProcess.killed) {
      try { djangoProcess.kill() } catch {}
    }
    djangoProcess = spawn('python', ['-m', 'uvicorn', 'processor.asgi:create_app', '--factory', '--host', domain, '--port', port, '--workers', '1'], {
      cwd: join(__dirname, '../../../backend'),
      stdio: 'inherit',
      windowsHide: true
    })
  }

  startDjango()

  chokidar.watch(join(__dirname, '../../../backend'), {
    ignored: [
      join(__dirname, '../../../backend/media/**'),
      join(__dirname, '../../../backend/logs/**'),
      join(__dirname, '../../../backend/logs/django.log'),
      join(__dirname, '../../../backend/apps/apache24/apache_logs/**'),
      join(__dirname, '../../../backend/db.sqlite3'),
      join(__dirname, '../../../backend/db.sqlite3-*'),
      '**/db.sqlite3*',
      '**/*.pyc'
    ],
    ignoreInitial: true
  }).on('change', (changedPath) => {
    if (
      changedPath.includes('db.sqlite3') ||
      changedPath.includes('sqlite3-journal') ||
      changedPath.includes('media') ||
      changedPath.includes('/logs/') ||
      changedPath.includes('.pyc')
    ) return

    console.log(`Backend file changed: ${changedPath}, restarting Django...`)
    startDjango()
  })

  // Dev streamer
  killPort(streamerPort, () => {
    streamerProcess = spawn('python', ['-m', 'uvicorn', 'apps.streamer.asgi_mpeg:app', '--host', streamerDomain, '--port', streamerPort], {
      cwd: join(__dirname, '../../../backend'),
      stdio: 'ignore',
      windowsHide: true
    })
  })

  // Dev cronjob
  cronJobProcess = spawn('python', ['-m', 'processor.cronjob'], {
    cwd: join(__dirname, '../../../backend'),
    stdio: 'ignore',
    windowsHide: true
  })
}

// --- Apache config (already handled above) ---

// Kill Django/Streamer/Cron on quit
app.on('before-quit', () => {
  app.isQuiting = true
  stopApache()
  if (djangoProcess && !djangoProcess.killed) {
    try { djangoProcess.stdout?.destroy() } catch {}
    try { djangoProcess.stderr?.destroy() } catch {}
    try { djangoProcess.kill() } catch {}
  }
  if (streamerProcess && !streamerProcess.killed) {
    try { streamerProcess.stdout?.destroy() } catch {}
    try { streamerProcess.stderr?.destroy() } catch {}
    try { streamerProcess.kill() } catch {}
  }
  if (cronJobProcess && !cronJobProcess.killed) {
    try { cronJobProcess.stdout?.destroy() } catch {}
    try { cronJobProcess.stderr?.destroy() } catch {}
    try { cronJobProcess.kill() } catch {}
  }
})

// Define window globals
let splashWindow = null
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
    win?.show()
  })

  win.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault()
      win?.hide()
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

function waitForHealthPing(url, callback, { name }) {
  const interval = setInterval(() => {
    console.log(`Checking health ping for: ${url}`)
    fetch(url, { method: 'HEAD' })
      .then((res) => {
        console.log(`Health check for ${url} (${name}): Status ${res.status}`)
        if (res.ok) {
          clearInterval(interval)
          callback()
        } else if (res.status >= 500) {
          // Common boot-time failure is import error inside Django (e.g., WMI)
          console.warn(`⚠ ${name} responded 5xx. If using VPN/WMI, set ENABLE_VPN=0 or lazy-import wmi to avoid boot-time 500s.`)
        }
      })
      .catch((err) => {
        console.log(`Health check for ${url} failed: ${err.message}`)
      })
  }, 500)
}

// Add a periodic connection checker
let connectionChecks = 0
function checkEndpoints() {
  connectionChecks++
  console.log(`\n[Check #${connectionChecks}] Verifying endpoint connectivity...`)

  // Check Django API
  fetch(url, { method: 'HEAD' })
    .then(res => {
      console.log(`✅ Django API (${url}) is UP - Status: ${res.status}`)
    })
    .catch(err => {
      console.log(`❌ Django API (${url}) is DOWN: ${err.message}`)
      const net = require('net')
      const tester = net.createConnection(parseInt(port), domain)
      tester.on('connect', () => {
        console.log(`⚠️ Port ${port} is open but not responding properly to HTTP`)
        tester.end()
      })
      tester.on('error', (err) => {
        console.log(`⚠️ Port ${port} check failed: ${err.message}`)
      })
    })

  // Check streamer
  fetch(streamerUrl, { method: 'HEAD' })
    .then(res => {
      console.log(`✅ Streamer (${streamerUrl}) is UP - Status: ${res.status}`)
    })
    .catch(err => {
      console.log(`❌ Streamer (${streamerUrl}) is DOWN: ${err.message}`)
    })

  // Check if Django process is still running
  if (djangoProcess) {
    try {
      const killed = djangoProcess.killed
      console.log(`Django process status - Killed: ${killed}, PID: ${djangoProcess.pid}`)
    } catch (e) {
      console.log(`Error checking Django process: ${e.message}`)
    }
  } else {
    console.log('Django process is not initialized')
  }

  if (connectionChecks < 20) {
    setTimeout(checkEndpoints, 5000)
  }
}

// Initial app startup
app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.electron')

  // 🟢 Show splash *immediately*
  createSplashWindow()

  // Start Apache only if everything it needs is present
  const APACHE_ENABLED = process.env.APACHE_ENABLED === '1'
  if (APACHE_ENABLED) {
    if (!fs.existsSync(httpdConfPath)) {
      console.warn('⚠ APACHE_ENABLED=1 but httpd.conf missing. Skipping Apache.')
    } else if (!fs.existsSync(apacheExe)) {
      console.warn('⚠ APACHE_ENABLED=1 but httpd.exe missing. Skipping Apache.')
    } else {
      startApache()
    }
  } else {
    console.log('🪪 Apache disabled (APACHE_ENABLED!=1)')
  }

  // Start connection checker
  setTimeout(checkEndpoints, 1000)

  function createMinimalHttpdConf() {
    if (fs.existsSync(httpdConfPath)) return
    console.log('Creating minimal httpd.conf at:', httpdConfPath)

    const confDir = path.dirname(httpdConfPath)
    if (!fs.existsSync(confDir)) {
      try { fs.mkdirSync(confDir, { recursive: true }) } catch (err) {
        console.error('Failed to create conf directory:', err)
        return
      }
    }

    const minimalConf = `
# Minimal Apache configuration
Define SRVROOT "${apacheRoot.replace(/\\/g, '/')}"
ServerRoot "${apacheRoot.replace(/\\/g, '/')}"
Listen ${process.env.APACHE_PORT || 54321}
ServerName localhost:${process.env.APACHE_PORT || 54321}

# Load required modules
LoadModule access_compat_module modules/mod_access_compat.so
LoadModule alias_module modules/mod_alias.so
LoadModule auth_basic_module modules/mod_auth_basic.so
LoadModule authz_core_module modules/mod_authz_core.so
LoadModule authz_host_module modules/mod_authz_host.so
LoadModule dir_module modules/mod_dir.so
LoadModule headers_module modules/mod_headers.so
LoadModule mime_module modules/mod_mime.so
LoadModule rewrite_module modules/mod_rewrite.so
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
LoadModule http2_module modules/mod_http2.so

DocumentRoot "${apacheRoot.replace(/\\/g, '/')}/htdocs"

# Media directory configuration
Alias /media/ "${mediaPath.replace(/\\/g, '/')}/"
<Directory "${mediaPath.replace(/\\/g, '/')}/">
    Options Indexes FollowSymLinks
    AllowOverride None
    Require all granted
    
    # Add proper headers for video streaming
    <FilesMatch "\\.(mp4|mkv|webm)$">
        Header set Content-Type "video/mp4"
        Header set Accept-Ranges bytes
    </FilesMatch>
    
    # Enable byte range requests
    Header set Accept-Ranges bytes
    
    # Fix CORS issues
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Range"
</Directory>

# Add proper MIME types
AddType video/mp4 .mp4
AddType video/webm .webm
AddType video/x-matroska .mkv

ProxyPass /api/ http://${backendDomain}:${backendPort}/api/
ProxyPassReverse /api/ http://${backendDomain}:${backendPort}/api/
`
    try {
      fs.writeFileSync(httpdConfPath, minimalConf)
      console.log('✅ Generated minimal httpd.conf at', httpdConfPath)
      return true
    } catch (err) {
      console.error('❌ Failed to write minimal httpd.conf:', err)
      return false
    }
  }

  if (!fs.existsSync(httpdConfPath) && fs.existsSync(apacheExe)) {
    console.log('httpd.conf missing but httpd.exe exists, creating minimal config...')
    createMinimalHttpdConf()
  }

  try {
    const waitOnMod = await import('wait-on')
    const waitOn = waitOnMod.default
    const toMs = Number(process.env.STARTUP_TIMEOUT_MS || 90000)

    console.log(`⏳ Waiting for backend and streamer up to ${toMs / 1000}s ...`)
    console.log(`Waiting for: ${url} and ${streamerUrl}`)
    console.log('Performing initial HTTP checks...')

    const resources = []
    if (!SKIP_API_WAIT) resources.push(url)
    if (!SKIP_STREAMER_WAIT) resources.push(streamerUrl)

    const timeoutId = setTimeout(() => {
      console.error(`❌ Manual timeout after ${toMs / 1000}s - terminating app`)
      if (splashWindow) splashWindow.destroy()
      if (win) win.destroy()
      app.isQuiting = true
      app.quit()
    }, toMs)

    waitOn({
      resources: resources.length ? resources : undefined,
      timeout: toMs,
      // consider any non-404 as "up" (we'll do stricter health below)
      validateStatus: status => status !== 404,
      log: true
    }, (err) => {
      clearTimeout(timeoutId)

      if (err) {
        console.error('❌ wait-on timed out:', err?.message || err)
        const errorLog = path.join(app.getPath('userData'), 'startup-error.log')
        let errorInfo = `=== ERROR LOG ${new Date().toISOString()} ===\n`
        errorInfo += `Timeout waiting for: ${resources.join(', ') || '(none)'}\n`
        errorInfo += `Error: ${err?.message || err}\n`
        if (djangoProcess) {
          errorInfo += `Django PID: ${djangoProcess.pid}, killed: ${djangoProcess.killed}\n`
        } else {
          errorInfo += 'Django process: not initialized\n'
        }
        fs.writeFileSync(errorLog, errorInfo)
        console.log(`Error details written to: ${errorLog}`)

        if (splashWindow) splashWindow.destroy()
        if (win) win.destroy()
        app.isQuiting = true
        app.quit()
        return
      }

      console.log('✅ wait-on succeeded! Server endpoints are available')

      // Chain health pings (skippable)
      const proceedToWindow = () => createWindow()

      const chainStreamer = () => {
        if (SKIP_STREAMER_WAIT) return proceedToWindow()
        waitForHealthPing(streamerHealthUrl, proceedToWindow, { name: 'streamer' })
      }

      const chainApi = () => {
        if (SKIP_API_WAIT) return chainStreamer()
        waitForHealthPing(apiHealthUrl, chainStreamer, { name: 'api' })
      }

      chainApi()
    })
  } catch (e) {
    console.error('❌ wait-on import failed:', e)
    app.isQuiting = true
    app.quit()
  }

  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('get-env', () => ({ ...process.env }))

  const trayIcon = is.dev
    ? nativeImage.createFromPath(join(__dirname, '../../resources/icon.ico'))
    : nativeImage.createFromPath(join(process.resourcesPath, 'icon.ico'))
  const tray = new Tray(trayIcon)
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => BrowserWindow.getAllWindows()[0]?.show() },
    {
      label: 'Quit',
      click: () => {
        app.isQuiting = true
        BrowserWindow.getAllWindows().forEach(w => w.destroy())
        app.quit()
      }
    }
  ])
  tray.setToolTip('Camera Vision')
  tray.setContextMenu(contextMenu)
  tray.on('double-click', () => BrowserWindow.getAllWindows()[0]?.show())

  app.on('browser-window-created', (_evt, window) => {
    optimizer.watchWindowShortcuts(window)
  })
})

app.on('window-all-closed', (event) => {
  if (!app.isQuiting) {
    event.preventDefault()
    BrowserWindow.getAllWindows().forEach(w => w.hide())
  } else {
    app.quit()
  }
})

function handleExit() {
  stopApache()
  process.exit()
}

process.on('SIGINT', handleExit)
process.on('SIGTERM', handleExit)
process.on('exit', stopApache)

app.on('activate', () => {
  const wins = BrowserWindow.getAllWindows()
  if (wins.length) wins[0].show()
})
