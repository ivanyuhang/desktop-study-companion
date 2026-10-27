import { BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'
import type { PetId } from '../shared/models'
let petWindow: BrowserWindow | null = null
export function isPetWindow(window: BrowserWindow | null): boolean {
  return window !== null && window === petWindow
}
export function setupPet(getPet: () => PetId): void {
  ipcMain.handle('pet:state', (event) => {
    if (
      !isPetWindow(BrowserWindow.fromWebContents(event.sender)) ||
      event.senderFrame !== event.sender.mainFrame
    )
      throw new Error('Unauthorized pet request')
    return getPet()
  })
  ipcMain.handle('pet:close', (event) => {
    if (
      !isPetWindow(BrowserWindow.fromWebContents(event.sender)) ||
      event.senderFrame !== event.sender.mainFrame
    )
      throw new Error('Unauthorized pet request')
    petWindow?.close()
  })
  ipcMain.handle('companion:pet', (event, show: unknown) => {
    const owner = BrowserWindow.fromWebContents(event.sender)
    if (
      !owner ||
      isPetWindow(owner) ||
      event.senderFrame !== event.sender.mainFrame ||
      typeof show !== 'boolean'
    )
      throw new Error('Unauthorized pet request')
    if (!show) {
      petWindow?.close()
      return
    }
    if (petWindow) {
      petWindow.show()
      return
    }
    const area = screen.getPrimaryDisplay().workArea
    petWindow = new BrowserWindow({
      width: 200,
      height: 240,
      x: area.x + area.width - 220,
      y: area.y + area.height - 260,
      frame: false,
      transparent: true,
      resizable: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      show: false,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        additionalArguments: ['--pet-window']
      }
    })
    petWindow.on('closed', () => {
      petWindow = null
    })
    petWindow.once('ready-to-show', () => petWindow?.showInactive())
    petWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
    petWindow.webContents.on('will-navigate', (event) => event.preventDefault())
    if (is.dev && process.env.ELECTRON_RENDERER_URL)
      void petWindow.loadURL(process.env.ELECTRON_RENDERER_URL + '?pet=true')
    else
      void petWindow.loadFile(join(__dirname, '../renderer/index.html'), { query: { pet: 'true' } })
  })
}
