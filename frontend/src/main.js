const { app, BrowserWindow, Tray, Menu } = require('electron')
const path = require('path')

let tray = null
let win = null

const createWindow = () => {
  win = new BrowserWindow({
    width: 900,
    height: 720,
    // autoHideMenuBar: true
  })
  // win.setMenuBarVisibility(false)
  win.loadFile('./pages/index.html')

  // Minimize to tray on close
  win.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault()
      win.hide()
    }
    return false
  })
}

app.whenReady().then(() => {
  createWindow()

  // Create tray icon
  tray = new Tray(path.join(__dirname, '../assets/icon.png')) // Make sure you have an icon file
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

app.on('window-all-closed', () => {
  // Do not quit app when all windows are closed
})