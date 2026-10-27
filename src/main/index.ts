import { setupPet, isPetWindow } from './pet'
import { startScheduler } from './scheduler'
import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { JsonStore } from './store'
import { setupIPC } from './ipc'
function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 780,
    minWidth: 480,
    minHeight: 480,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  mainWindow.on('ready-to-show', () => mainWindow.show())
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) void shell.openExternal(url)
    return { action: 'deny' }
  })
  mainWindow.webContents.on('will-navigate', (event) => event.preventDefault())
  if (is.dev && process.env['ELECTRON_RENDERER_URL'])
    void mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  else void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
}
if (!app.requestSingleInstanceLock()) app.quit()
else {
  app.on('second-instance', () => {
    const window = BrowserWindow.getAllWindows().find((window) => !isPetWindow(window))
    if (window) {
      if (window.isMinimized()) window.restore()
      window.show()
      window.focus()
    } else if (app.isReady()) createWindow()
  })
  app
    .whenReady()
    .then(async () => {
      electronApp.setAppUserModelId('com.studycompanion.desktop')
      app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))
      const store = new JsonStore(app.getPath('userData'))
      const warning = await store.load()
      setupPet(() => store.read().settings.pet)
      const ipc = setupIPC(store, warning)
      startScheduler(store, ipc.broadcast, ipc.warn)
      createWindow()
      app.on('activate', () => {
        if (!BrowserWindow.getAllWindows().some((window) => !isPetWindow(window))) createWindow()
      })
    })
    .catch((error) => {
      console.error('Unable to start Study Companion', error)
      app.quit()
    })
}
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
