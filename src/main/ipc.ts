import { isPetWindow } from './pet'
import { BrowserWindow, ipcMain, Notification, app } from 'electron'
import type { AppSnapshot } from '../shared/models.ts'
import { validateCommand } from '../shared/validation.ts'
import { JsonStore } from './store.ts'
import { applyCommand } from './commands.ts'
export function setupIPC(
  store: JsonStore,
  warning: string | null
): { broadcast: () => void; snapshot: () => AppSnapshot; warn: (message: string) => void } {
  const snapshot = (): AppSnapshot => ({
    data: store.read(),
    version: app.getVersion(),
    warning,
    notificationSupported: Notification.isSupported()
  })
  const trusted = (event: Electron.IpcMainInvokeEvent): void => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window || event.senderFrame !== event.sender.mainFrame || isPetWindow(window))
      throw new Error('Unauthorized request')
  }
  const broadcast = (): void => {
    for (const window of BrowserWindow.getAllWindows())
      if (!window.isDestroyed())
        isPetWindow(window)
          ? window.webContents.send('pet:changed', store.read().settings.pet)
          : window.webContents.send('companion:changed', snapshot())
  }
  ipcMain.handle('companion:snapshot', (event) => {
    trusted(event)
    return snapshot()
  })
  ipcMain.handle('companion:command', async (event, input: unknown) => {
    trusted(event)
    const command = validateCommand(input)
    await store.transact((data) => applyCommand(data, command))
    broadcast()
    return snapshot()
  })
  return {
    snapshot,
    broadcast,
    warn: (message) => {
      warning = message
      broadcast()
    }
  }
}
