import { app, shell, BrowserWindow, screen } from 'electron'
import path, { join } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs'
import { initializeIpcHandler } from './lib/ipcHandlers'
import { KeyboardShortcutHelper } from './lib/keyboard-shortcuts'

interface WindowPosition {
  x: number
  y: number
}

interface WindowSize {
  width: number
  height: number
}

const state = {
  mainWindow: null as BrowserWindow | null,
  isWindowVisible: false,
  windowPosition: null as WindowPosition | null,
  windowSize: null as WindowSize | null,
  screenWidth: 0,
  screenHeight: 0,
  step: 50,
  currentX: 0,
  currentY: 0,
  keyboardShortcutHelper: null as KeyboardShortcutHelper | null,
}

async function createWindow(): Promise<void> {
  if (state.mainWindow) {
    if (state.mainWindow.isMinimized()) state.mainWindow.restore()
    state.mainWindow.focus()
    return
  }

  const display = screen.getPrimaryDisplay()
  state.screenWidth = display.bounds.width
  state.screenHeight = display.bounds.height

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
      scrollBounce: true,
    },
  })

  state.mainWindow = mainWindow

  mainWindow.on('ready-to-show', () => {
    const [x, y] = mainWindow.getPosition()
    const [width, height] = mainWindow.getSize()
    state.windowPosition = { x, y }
    state.windowSize = { width, height }
    state.currentX = x
    state.currentY = y
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    await mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    await mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.webContents.setZoomFactor(1)
  mainWindow.webContents.setBackgroundThrottling(false)
  mainWindow.webContents.setFrameRate(60)

  // Remove or toggle this in production
  if (is.dev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }

  mainWindow.setContentProtection(true)
  mainWindow.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true,
  })
  mainWindow.setAlwaysOnTop(true, 'screen-saver', 1)

  if (process.platform === 'darwin') {
    mainWindow.setHiddenInMissionControl(true)
    mainWindow.setWindowButtonVisibility(false)
    mainWindow.setBackgroundColor('#00000000')
    mainWindow.setSkipTaskbar(true)
    mainWindow.setHasShadow(false)
  }

  mainWindow.on('close', () => {
    state.mainWindow = null
    state.isWindowVisible = false
  })

  mainWindow.on('move', handleWindowMove)
  mainWindow.on('resize', handleWindowResize)
  mainWindow.on('closed', handleWindowClosed)
}

function handleWindowMove(): void {
  if (!state.mainWindow) return
  const bounds = state.mainWindow.getBounds()
  state.windowPosition = { x: bounds.x, y: bounds.y }
  state.currentX = bounds.x
  state.currentY = bounds.y
}

function handleWindowResize(): void {
  if (!state.mainWindow) return
  const bounds = state.mainWindow.getBounds()
  state.windowSize = { width: bounds.width, height: bounds.height }
}

function handleWindowClosed(): void {
  state.mainWindow = null
  state.isWindowVisible = false
  state.windowPosition = null
  state.windowSize = null
}

function moveWindowHorizontal(updateFn: (x: number) => number): void {
  if (!state.mainWindow) return
  state.currentX = updateFn(state.currentX)
  state.mainWindow.setPosition(Math.round(state.currentX), Math.round(state.currentY))
}

function moveWindowVertical(updateFn: (y: number) => number): void {
  if (!state.mainWindow) return

  const newY = updateFn(state.currentY)
  const windowHeight = state.windowSize?.height || 0
  const maxUpLimit = -(windowHeight * 2) / 3
  const maxDownLimit = state.screenHeight + (windowHeight * 2) / 3

  if (newY >= maxUpLimit && newY <= maxDownLimit) {
    state.currentY = newY
    state.mainWindow.setPosition(Math.round(state.currentX), Math.round(state.currentY))
  }
}

function initializeHelpers() {
  state.keyboardShortcutHelper = new KeyboardShortcutHelper({
    moveWindowLeft: () =>
      moveWindowHorizontal((x) =>
        Math.max(-(state.windowSize?.width || 0) / 2, x - state.step)
      ),
    moveWindowRight: () =>
      moveWindowHorizontal((x) =>
        Math.min(state.screenWidth - (state.windowSize?.width || 0) / 2, x + state.step)
      ),
    moveWindowUp: () => moveWindowVertical((y) => y - state.step),
    moveWindowDown: () => moveWindowVertical((y) => y + state.step),
  })
}

async function initializeApp() {
  try {
    const appDataPath = path.join(app.getPath('appData'), 'clueless')
    console.log('App data path:', appDataPath)

    if (!fs.existsSync(appDataPath)) {
      fs.mkdirSync(appDataPath, { recursive: true })
    }

    app.setPath('userData', appDataPath)

    initializeIpcHandler()
    initializeHelpers()
    await createWindow()

    state.keyboardShortcutHelper?.registerGlobalShortcuts()
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
