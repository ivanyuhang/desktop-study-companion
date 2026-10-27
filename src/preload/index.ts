import { contextBridge, ipcRenderer } from 'electron'
import type { CompanionAPI, AppSnapshot, PetId } from '../shared/models'
if (process.argv.includes('--pet-window')) {
  contextBridge.exposeInMainWorld('petAPI', {
    snapshot: () => ipcRenderer.invoke('pet:state'),
    close: () => ipcRenderer.invoke('pet:close'),
    subscribe: (listener: (pet: PetId) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, pet: PetId): void => listener(pet)
      ipcRenderer.on('pet:changed', handler)
      return () => {
        ipcRenderer.removeListener('pet:changed', handler)
      }
    }
  })
} else {
  const api: CompanionAPI = {
    snapshot: () => ipcRenderer.invoke('companion:snapshot'),
    dispatch: (command) => ipcRenderer.invoke('companion:command', command),
    subscribe: (listener) => {
      const handler = (_event: Electron.IpcRendererEvent, snapshot: AppSnapshot): void =>
        listener(snapshot)
      ipcRenderer.on('companion:changed', handler)
      return () => {
        ipcRenderer.removeListener('companion:changed', handler)
      }
    },
    pet: (show) => ipcRenderer.invoke('companion:pet', show)
  }
  contextBridge.exposeInMainWorld('api', api)
  contextBridge.exposeInMainWorld('electron', { process: { versions: process.versions } })
}
