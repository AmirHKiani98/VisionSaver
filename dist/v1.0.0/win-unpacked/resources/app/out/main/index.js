"use strict";
const electron = require("electron");
const require$$1 = require("path");
const utils = require("@electron-toolkit/utils");
const dotenv = require("dotenv");
const { execFile } = require("child_process");
if (utils.is.dev) {
  dotenv.config({ path: require$$1.join(__dirname, "../../resources/.hc_to_app_env") });
} else {
  dotenv.config({ path: require$$1.join(process.resourcesPath, ".hc_to_app_env") });
}
const domain = process.env.BACKEND_SERVER_DOMAIN;
const port = process.env.BACKEND_SERVER_PORT;
const url = `http://${domain}:${port}`;
const apiHealthUrl = `${url}/${process.env.API_HEALTH_CHECK}`;
console.log(`Django server URL: ${url}`);
const frontRoot = require$$1.resolve(__dirname, "../../");
let djangoProcess = null;
const backendBinary = utils.is.dev ? require$$1.join(
  frontRoot,
  "resources",
  "backend",
  process.platform === "darwin" ? "startbackend" : "startbackend.exe"
) : require$$1.join(
  process.resourcesPath,
  "backend",
  process.platform === "darwin" ? "startbackend" : "startbackend.exe"
);
if (!utils.is.dev) {
  djangoProcess = execFile(backendBinary, {
    cwd: utils.is.dev ? require$$1.join(frontRoot, "resources", "backend") : require$$1.join(process.resourcesPath, "backend")
  }, (error) => {
    if (error) {
      console.error("Django error:", error);
    } else {
      console.log("Django server started successfully.");
    }
  });
} else {
  console.log("Running in development mode, Django server will not be started automatically.");
  djangoProcess = execFile(
    "python",
    ["manage.py", "runserver", "--noreload"],
    {
      cwd: require$$1.join(__dirname, "../../../backend")
    },
    (error) => {
      if (error) {
        console.error("Django error:", error);
      } else {
        console.log("Django server started successfully.");
      }
    }
  );
}
djangoProcess.stdout?.on("data", (data) => console.log(`Django: ${data}`));
djangoProcess.stderr?.on("data", (data) => console.error(`Django error: ${data}`));
electron.app.on("before-quit", () => {
  electron.app.isQuiting = true;
  if (djangoProcess && !djangoProcess.killed) {
    console.log("Killing Django server...");
    djangoProcess.stdout?.destroy();
    djangoProcess.stderr?.destroy();
    djangoProcess.kill();
  }
});
let splashWindow = null;
let tray = null;
let win = null;
function createSplashWindow() {
  splashWindow = new electron.BrowserWindow({
    width: 700,
    height: 400,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    show: true,
    autoHideMenuBar: true
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    splashWindow.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}/loading.html`);
  } else {
    splashWindow.loadFile(require$$1.join(__dirname, "../renderer/loading.html"));
  }
}
function createWindow() {
  win = new electron.BrowserWindow({
    width: 1050,
    height: 720,
    show: false,
    autoHideMenuBar: true,
    icon: require$$1.join(__dirname, "../../resources/icon.icns"),
    webPreferences: {
      preload: require$$1.join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  });
  win.on("ready-to-show", () => {
    splashWindow?.destroy();
    win.show();
  });
  win.on("close", (event) => {
    if (!electron.app.isQuiting) {
      event.preventDefault();
      win.hide();
    }
  });
  win.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    win.loadFile(require$$1.join(__dirname, "../renderer/index.html"));
  }
}
function waitForHealthPing(url2, callback) {
  const interval = setInterval(() => {
    console.log(`Checking health at ${url2}...`);
    fetch(url2).then((res) => {
      if (res.ok) {
        clearInterval(interval);
        callback();
      }
    }).catch(() => {
    });
  }, 500);
}
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.electron");
  createSplashWindow();
  Promise.resolve().then(() => require("./wait-on-DIElOWRk.js")).then((n) => n.waitOn).then((mod) => {
    const waitOn = mod.default;
    console.log("Waiting for Django server to be ready...");
    waitOn({ resources: [url], timeout: 15e3 }, (err) => {
      if (err) {
        console.error("Django server failed to start:", err);
        console.warn("Opening app anyway in fallback mode...");
        createWindow();
      } else {
        console.log("Django server is ready.");
        waitForHealthPing(apiHealthUrl, () => {
          createWindow();
        });
      }
    });
  }).catch((e) => {
    console.error("Failed to load wait-on:", e);
    process.exit(1);
  });
  electron.ipcMain.on("ping", () => console.log("pong"));
  electron.ipcMain.handle("get-env", () => ({ ...process.env }));
  const trayIcon = utils.is.dev ? electron.nativeImage.createFromPath(require$$1.join(__dirname, "../../resources/icon.ico")) : electron.nativeImage.createFromPath(require$$1.join(process.resourcesPath, "icon.ico"));
  tray = new electron.Tray(trayIcon);
  const contextMenu = electron.Menu.buildFromTemplate([
    { label: "Show App", click: () => win.show() },
    {
      label: "Quit",
      click: () => {
        electron.app.isQuiting = true;
        win?.destroy();
        electron.app.quit();
      }
    }
  ]);
  tray.setToolTip("Camera Vision");
  tray.setContextMenu(contextMenu);
  tray.on("double-click", () => win?.show());
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
});
electron.app.on("window-all-closed", (event) => {
  if (!electron.app.isQuiting) {
    event.preventDefault();
    win?.hide();
  } else {
    electron.app.quit();
  }
});
electron.app.on("activate", () => {
  if (win) win.show();
});
