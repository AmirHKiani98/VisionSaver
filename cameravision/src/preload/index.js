import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
// Custom APIs for renderer
const api = {
  keepMeAlive: (coords) => ipcRenderer.invoke('keep-me-alive', coords),
  stopKeepingMeAlive: () => ipcRenderer.invoke('stop-keep-me-alive'),
  getWindowBounds: () => ipcRenderer.invoke('get-window-bounds')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('env', {
      get: () => ipcRenderer.invoke('get-env')
    })
    
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
