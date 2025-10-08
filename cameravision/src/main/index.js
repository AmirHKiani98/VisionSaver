import { app, shell, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron'
import { join, resolve } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import dotenv from 'dotenv'
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');



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
  }
}

// Function to stop Apache
function stopApache() {
  if (apacheProcess && !apacheProcess.killed) {
    apacheProcess.kill();
    apacheProcess = null;
  } else if (apachePid) {
    try {
      process.kill(apachePid);
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
  if (!global.keepMeAliveProcess || global.keepMeAliveProcess.killed) {
    global.keepMeAliveProcess = spawn(pythonExe, [pathToKeepMeAlive], keepAliveOptions);
    global.keepMeAliveProcess.unref();
  }
}

function stopKeepingMeAlive() {
  if (global.keepMeAliveProcess && !global.keepMeAliveProcess.killed) {
    global.keepMeAliveProcess.kill();
    global.keepMeAliveProcess = null;
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
  djangoProcess = spawn(backendBinary, [], {
    cwd: is.dev
      ? join(frontRoot, 'resources', 'backend')
      : join(process.resourcesPath, 'backend'),
    stdio: 'ignore',
    windowsHide: true
  });
} else {
  // Run django from backend directory
  function startDjango() {
    if (djangoProcess && !djangoProcess.killed) {
      djangoProcess.kill();
    }
    djangoProcess = spawn('python', ['-m', 'uvicorn', 'processor.asgi:create_app', '--factory', '--host', domain, '--port', port, '--workers', '1'], {
      cwd: join(__dirname, '../../../backend'),
      stdio: 'inherit', // show logs for debugging
      windowsHide: true
    });
  }

  // Watch backend files and restart Django on change
  chokidar.watch(join(__dirname, '../../../backend'), {
    ignored: [
      join(__dirname, '../../../backend/media/**'),
      join(__dirname, '../../../backend/logs/**'),
      join(__dirname, '../../../backend/logs/django.log'),
      join(__dirname, '../../../backend/apps/apache24/apache_logs/**'),
      join(__dirname, '../../../backend/db.sqlite3'),
      join(__dirname, '../../../backend/db.sqlite3-*'),  // Add this to ignore journal files
      '**/db.sqlite3*',  // Add this catch-all pattern for database files
      '**/*.pyc'
    ],
    ignoreInitial: true
  }).on('change', (changedPath) => {
    // Add an explicit filter for database files
    if (changedPath.includes('db.sqlite3') || changedPath.includes('sqlite3-journal') || changedPath.includes('media') || changedPath.includes("/logs/") || changedPath.includes('.pyc')) {
      return;
    }
    
    console.log(`Backend file changed: ${changedPath}, restarting Django...`);
    startDjango();
  });

  killPort(streamerPort, () => {
    streamerProcess = spawn('python', ['-m', 'uvicorn', 'apps.streamer.asgi_mpeg:app', '--host', streamerDomain, '--port', streamerPort], {
      cwd: join(__dirname, '../../../backend'),
      stdio: 'ignore',
      windowsHide: true
    });
  });

  cronJobProcess = spawn('python', ['-m', 'processor.cronjob'], {
    cwd: join(__dirname, '../../../backend'),
    stdio: 'ignore',
    windowsHide: true
  });
}

// --- Apache config update script ---
function updateApacheConfig() {
  // Get APACHE_PORT from env or default to 54321
  const apachePort = process.env.APACHE_PORT || '54321';
  // Get absolute path of apache24
  const apacheRootAbs = path.resolve(__dirname, '../../../backend/apps/apache24');
  // Path to httpd.conf
  const confPath = path.resolve(apacheRootAbs, 'conf/httpd.conf');
  // Read config
  let confText = fs.readFileSync(confPath, 'utf8');
  // Replace SRVROOT
  confText = confText.replace(/Define SRVROOT .*/g, `Define SRVROOT "${apacheRootAbs.replace(/\\/g, '/')}` + '"');
  // Replace Listen and ServerName
  confText = confText.replace(/Listen .*/g, `Listen 127.0.0.1:${apachePort}`);
  confText = confText.replace(/ServerName .*/g, `ServerName localhost:${apachePort}`);
  // Write back
  fs.writeFileSync(confPath, confText, 'utf8');
}

// Call updateApacheConfig before starting Apache
updateApacheConfig();

// Kill Django on quit
app.on('before-quit', () => {
  app.isQuiting = true
  stopApache();
  if (djangoProcess && !djangoProcess.killed) {
    djangoProcess.stdout?.destroy()
    djangoProcess.stderr?.destroy()
    djangoProcess.kill()
  }
  if (streamerProcess && !streamerProcess.killed) {
    streamerProcess.stdout?.destroy()
    streamerProcess.stderr?.destroy()
    streamerProcess.kill()
  }
  if (cronJobProcess && !cronJobProcess.killed) {
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
      waitOn({ resources: [url, streamerUrl], timeout: 12000 }, (err) => {
        if (err) {
          // Close app
          if (splashWindow) splashWindow.destroy()
          if (win) win.destroy()
          app.isQuiting = true
          app.quit()
        } else {
          waitForHealthPing(apiHealthUrl, () => {
            waitForHealthPing(streamerHealthUrl, () => {
              createWindow() // load main app window
            })
          })
          
        }
      })
    })
    .catch((e) => {
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
