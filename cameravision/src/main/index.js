import { app, shell, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron'
import { join, resolve } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import dotenv from 'dotenv'
const fs = require('fs');
const path = require('path');



// Load environment variables
let envPath;
if (is.dev) {
  envPath = path.join(__dirname, '../../resources/.hc_to_app_env');
} else {
  envPath = path.join(process.resourcesPath, '.hc_to_app_env');
}
dotenv.config({ path: envPath });

const backendDomain = process.env.BACKEND_SERVER_DOMAIN || 'localhost';
const backendPort = process.env.BACKEND_SERVER_PORT || '8000';

// Paths
let httpdConfPath, apacheRoot, mediaPath;
if (is.dev) {
  httpdConfPath = path.resolve(__dirname, '../../../backend/apps/apache24/conf/httpd.conf');
  apacheRoot = path.resolve(__dirname, '../../../backend/apps/apache24');
  mediaPath = path.resolve(__dirname, '../../../backend/media');
} else {
  httpdConfPath = path.resolve(process.resourcesPath, 'backend', 'startbackend', '_internal', 'backend', 'apps', 'apache24', 'conf', 'httpd.conf');
  apacheRoot = path.resolve(process.resourcesPath, 'backend', 'startbackend', '_internal', 'backend', 'apps', 'apache24');
  mediaPath = path.resolve(process.resourcesPath, 'backend', 'media');
}

// Read httpd.conf
let conf = fs.readFileSync(httpdConfPath, 'utf8');

// Update SRVROOT, media Alias/Directory
conf = conf.replace(/Define SRVROOT .*/g, `Define SRVROOT "${apacheRoot.replace(/\\/g, '/')}"`);
conf = conf.replace(/Alias \/media\/ .*/g, `Alias /media/ "${mediaPath.replace(/\\/g, '/')}/"`);
conf = conf.replace(/<Directory .*media.*>/g, `<Directory "${mediaPath.replace(/\\/g, '/')}/">`);

// Enable proxy modules (uncomment if commented)
conf = conf.replace(/^#LoadModule proxy_module /m, 'LoadModule proxy_module ');
conf = conf.replace(/^#LoadModule proxy_http_module /m, 'LoadModule proxy_http_module ');

// Add or update ProxyPass/ProxyPassReverse for /api/
const proxyBlock = `
# Proxy API requests to Django backend
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so

ProxyPass /api/ http://${backendDomain}:${backendPort}/api/
ProxyPassReverse /api/ http://${backendDomain}:${backendPort}/api/
`;

// Remove any existing ProxyPass/ProxyPassReverse for /api/
conf = conf.replace(/# Proxy API requests[\s\S]*?ProxyPassReverse \/api\/.*\n?/g, '');
// Add the new block at the end (or wherever you want)
conf += '\n' + proxyBlock;

// Write back to file
// fs.writeFileSync(httpdConfPath, conf, 'utf8');


let apacheProcess = null;
let apachePid = null;

// Determine Apache executable path
let apacheExe;
if (is.dev) {
  apacheExe = path.resolve(__dirname, '../../../backend/apps/apache24/bin/httpd.exe');
} else {
  apacheExe = path.resolve(process.resourcesPath, 'backend', 'startbackend', '_internal', 'backend', 'apps', 'apache24', 'bin', 'httpd.exe');
}

// Function to start Apache
function startApache() {
  if (!apacheProcess || apacheProcess.killed) {
    apacheProcess = spawn(apacheExe, ['-f', httpdConfPath], {
      // detached: true, // removed
      stdio: 'ignore',
      windowsHide: true
    });
    apachePid = apacheProcess.pid; // Save the PID
    // apacheProcess.unref(); // removed
    console.log('Apache started.');
  }
}

// Function to stop Apache
function stopApache() {
  if (apacheProcess && !apacheProcess.killed) {
    apacheProcess.kill();
    apacheProcess = null;
    console.log('Apache stopped.');
  } else if (apachePid) {
    try {
      process.kill(apachePid);
      console.log('Apache stopped by PID.');
    } catch (e) {
      // Already dead or not found
    }
    apachePid = null;
  }
}

const { execFile, exec } = require('child_process')

const { spawn } = require('child_process')

const out = fs.openSync('./cronjob-out.log', 'a');
const err = fs.openSync('./cronjob-err.log', 'a');
const pythonExe = process.platform === 'win32' ? 'pythonw' : 'python';
let pathToKeepMeAlive = null;
if (is.dev) {
  pathToKeepMeAlive = join(__dirname, '../../../backend/apps/dto/main.py');
}else{
  pathToKeepMeAlive = join(process.resourcesPath, 'backend', 'startbackend', '_internal', 'backend', 'apps', 'dto', 'main.py');

}
const keepAliveOptions = {
  detached: true,
  stdio: 'ignore'
};

// 🪟 Windows: hide the cmd window
if (process.platform === 'win32') {
  keepAliveOptions['windowsHide'] = true;
}

function keepMeAlive() {
  // Execute the Python script without waiting for a response
  // Start the Python process and keep a reference to it so we can kill it later
  console.log('Starting keepMeAlive Python process');
  if (!global.keepMeAliveProcess || global.keepMeAliveProcess.killed) {
    global.keepMeAliveProcess = spawn(pythonExe, [pathToKeepMeAlive], keepAliveOptions);
    global.keepMeAliveProcess.unref();
  }
}

function stopKeepingMeAlive() {
  if (global.keepMeAliveProcess && !global.keepMeAliveProcess.killed) {
    global.keepMeAliveProcess.kill();
    global.keepMeAliveProcess = null;
    console.log('Stopped keepMeAlive Python process.');
  }
}

// IPC handlers for keepMeAlive and stopKeepingMeAlive
ipcMain.handle('keep-me-alive', () => {
  keepMeAlive();
  return { status: 'started' };
});

ipcMain.handle('stop-keep-me-alive', () => {
  stopKeepingMeAlive();
  return { status: 'stopped' };
});

ipcMain.handle('get-window-bounds', (event) => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return null;
  return win.getBounds(); // { x, y, width, height }
});

function killPort(port, cb) {
  const killCmd = process.platform === 'win32'
    ? `for /f "tokens=5" %a in ('netstat -nao ^| find ":${port}" ^| find "LISTENING"') do taskkill /f /pid %a`
    : `lsof -ti :${port} | xargs kill -9`;

  exec(killCmd, (err, stdout, stderr) => {
    if (err) {
      console.warn(`Warning: Could not free port ${port}:`, stderr.trim());
    } else {
      console.log(`✔ Freed port ${port}`);
    }
    cb?.();
  });
}

// Load .env early
if (is.dev){
  dotenv.config({ path: join(__dirname, '../../resources/.hc_to_app_env') })
} else {
  dotenv.config({ path: join(process.resourcesPath, '.hc_to_app_env') })
}

const domain = process.env.BACKEND_SERVER_DOMAIN
const port = process.env.BACKEND_SERVER_PORT
const streamerDomain = process.env.STREAM_SERVER_DOMAIN || 'localhost'
const streamerPort = process.env.STREAM_SERVER_PORT || 2500

const url = `http://${domain}:${port}`
const streamerUrl = `http://${streamerDomain}:${streamerPort}`
const apiHealthUrl = `${url}/${process.env.API_HEALTH_CHECK}`
const streamerHealthUrl = `${streamerUrl}/${process.env.API_HEALTH_CHECK}/`
console.log(`Django server URL: ${url}`)
console.log(`Streamer server URL: ${streamerUrl}`)

const frontRoot = resolve(__dirname, '../../')
let djangoProcess = null
let streamerProcess = null
let cronJobProcess = null
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
      // console.error('Django:', error)
    } else {
      console.log('Django server started successfully.')
    }
  })
} else {  console.log('Running in development mode, Django server will not be started automatically.')
  // Run django from backend directory
  djangoProcess = execFile('python', ['-m', 'uvicorn', 'processor.asgi:create_app','--factory', '--host', domain, '--port', port, '--workers', '1'], {
      cwd: join(__dirname, '../../../backend'),
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer instead of default 1MB
    }, (error) => {
      if (error) {
        console.error('Django error:', error.message) // Only log the message to prevent buffer overflow
      } else {
        console.log('Django server started successfully.')
      }
    }
  )
  
  // Add output handling to prevent buffer overflow
  djangoProcess.stdout?.on('data', (data) => {
    const output = data.toString()
    // Only log important messages, skip routine output
    if (output.includes('ERROR') || output.includes('CRITICAL') || output.includes('WARNING')) {
      console.log(`Django: ${output.slice(0, 200)}`) // Limit to 200 chars
    }
  })
    djangoProcess.stderr?.on('data', (data) => {
    const output = data.toString()
    // Skip routine uvicorn output, only log real errors
    if (!output.includes('INFO:') && !output.includes('Started server process')) {
      console.error(`Django Error: ${output.slice(0, 200)}`) // Limit to 200 chars
    }
  })
  
  killPort(streamerPort, () => {    streamerProcess = execFile('python', ['-m', 'uvicorn', 'apps.streamer.asgi_mpeg:app', '--host', streamerDomain, '--port', streamerPort,], {
      cwd: join(__dirname, '../../../backend'),
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer instead of default 1MB
    }, (error) => {
      if (error) {
        console.error('Streamer error:', error.message)
      } else {
        console.log('Streamer server started successfully.')
      }
    })
    
    // Add output handling for streamer
    streamerProcess.stdout?.on('data', (data) => {
      const output = data.toString()
      if (output.includes('ERROR') || output.includes('CRITICAL') || output.includes('WARNING')) {
        console.log(`Streamer: ${output.slice(0, 200)}`)
      }
    })
      streamerProcess.stderr?.on('data', (data) => {
      const output = data.toString()
      if (!output.includes('INFO:') && !output.includes('Started server process')) {
        console.error(`Streamer Error: ${output.slice(0, 200)}`)
      }
    })
  })
    cronJobProcess = spawn('python', ['-m', 'processor.cronjob'], {
    cwd: join(__dirname, '../../../backend'),
    stdio: ['ignore', 'pipe', 'pipe'] // Allow stderr/stdout but with bigger buffer
  })
  
  // Handle cronjob output to prevent buffer overflow
  cronJobProcess.stdout?.on('data', (data) => {
    // Only log first 100 characters to prevent spam
    const output = data.toString().slice(0, 100)
    if (output.includes('ERROR') || output.includes('CRITICAL')) {
      console.log(`Cronjob: ${output}`)
    }
  })
  
  cronJobProcess.stderr?.on('data', (data) => {
    // Only log first 100 characters to prevent spam
    const output = data.toString().slice(0, 100)
    console.error(`Cronjob Error: ${output}`)
  })
  
  cronJobProcess.on('error', (error) => {
    console.error('Cronjob process error:', error.message)
  })
}


// Kill Django on quit
app.on('before-quit', () => {
  app.isQuiting = true
  stopApache();
  if (djangoProcess && !djangoProcess.killed) {
    console.log('Killing Django server...')
    djangoProcess.stdout?.destroy()
    djangoProcess.stderr?.destroy()
    djangoProcess.kill()
  }
  if (streamerProcess && !streamerProcess.killed) {
    console.log('Killing Streamer server...')
    streamerProcess.stdout?.destroy()
    streamerProcess.stderr?.destroy()
    streamerProcess.kill()
  }
  if (cronJobProcess && !cronJobProcess.killed) {
    console.log('Killing Cronjob process...')
    cronJobProcess.stdout?.destroy()
    cronJobProcess.stderr?.destroy()
    cronJobProcess.kill()
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
  startApache();
  // 🟡 Start waiting for Django
  import('wait-on')
    .then((mod) => {
      const waitOn = mod.default
      console.log('Waiting for Django server to be ready...')

      waitOn({ resources: [url, streamerUrl], timeout: 12000 }, (err) => {
        if (err) {
          console.error('Django or Streamer server failed to start:', err)
          console.warn('Opening app anyway in fallback mode...')
          // Close app
          if (splashWindow) splashWindow.destroy()
          if (win) win.destroy()
          app.isQuiting = true
          app.quit()
        } else {
          console.log('Django and Streamer servers are ready.')
          waitForHealthPing(apiHealthUrl, () => {
            waitForHealthPing(streamerHealthUrl, () => {
              console.log('Both Django and Streamer servers are healthy.')
              createWindow() // load main app window
            })
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
function handleExit() {
  stopApache();
  process.exit();
}

process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);
process.on('exit', stopApache);
app.on('activate', () => {
  if (win) win.show()
})
