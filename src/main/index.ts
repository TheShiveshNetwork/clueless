import { app, shell, BrowserWindow } from 'electron'
import path, { join } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs'
import { initializeIpcHandler } from './lib/ipcHandlers'

async function createWindow(): Promise<void> {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 750,
    minHeight: 550,
    x: 0,
    y: 50,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    fullscreenable: false,
    hasShadow: false,
    opacity: 1.0,
    backgroundColor: '#00000000',
    focusable: true,
    skipTaskbar: true,
    type: 'panel',
    paintWhenInitiallyHidden: true,
    titleBarStyle: 'hidden',
    enableLargerThanScreen: true,
    movable: true,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      scrollBounce: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

async function initializeApp() {
  try {
    const appDataPath = path.join(app.getPath('appData'), 'clueless')
    console.log('App data path:', appDataPath)

    if (!fs.existsSync(appDataPath)) {
      fs.mkdirSync(appDataPath, { recursive: true })
    }

    app.setPath('userData', appDataPath) // ✅ Fixed: use 'userData'

    initializeIpcHandler()

    await createWindow()
  } catch (error) {
    console.error('Failed to initialize app:', error)
    app.quit()
  }
}

app.whenReady().then(initializeApp)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
