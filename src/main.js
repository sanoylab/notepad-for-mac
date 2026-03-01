const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { buildMenu } = require('./menu');

let mainWindow = null;
let openFilePath = null; // set by open-file event before ready

// ─── Window State ────────────────────────────────────────────────────────────

const windowStateFile = () =>
  path.join(app.getPath('userData'), 'window-state.json');

function loadWindowState() {
  try {
    const raw = fs.readFileSync(windowStateFile(), 'utf8');
    return JSON.parse(raw);
  } catch {
    return { width: 800, height: 600 };
  }
}

function saveWindowState() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const bounds = mainWindow.getBounds();
  const state = {
    ...bounds,
    isMaximized: mainWindow.isMaximized(),
  };
  try {
    fs.writeFileSync(windowStateFile(), JSON.stringify(state));
  } catch {
    // non-fatal
  }
}

// ─── Create Window ───────────────────────────────────────────────────────────

function createWindow() {
  const state = loadWindowState();

  mainWindow = new BrowserWindow({
    width: state.width || 800,
    height: state.height || 600,
    x: state.x,
    y: state.y,
    minWidth: 300,
    minHeight: 200,
    titleBarStyle: 'default',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (state.isMaximized) {
    mainWindow.maximize();
  }

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // If app was launched by double-clicking a .txt file
    if (openFilePath) {
      mainWindow.webContents.send('menu:action', 'OPEN_PATH:' + openFilePath);
      openFilePath = null;
    }
  });

  // Intercept close to let renderer check for unsaved changes
  mainWindow.on('close', (e) => {
    e.preventDefault();
    mainWindow.webContents.send('menu:action', 'EXIT');
  });

  mainWindow.on('resize', saveWindowState);
  mainWindow.on('move', saveWindowState);

  buildMenu(mainWindow);
}

// ─── App Lifecycle ────────────────────────────────────────────────────────────

app.on('open-file', (event, filePath) => {
  event.preventDefault();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('menu:action', 'OPEN_PATH:' + filePath);
  } else {
    openFilePath = filePath;
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

// Open file
ipcMain.handle('notepad:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const filePath = result.filePaths[0];
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return { content, filePath };
  } catch (err) {
    dialog.showErrorBox('Error', 'Could not open file: ' + err.message);
    return null;
  }
});

// Open file by path (Finder association)
ipcMain.handle('notepad:openFilePath', async (_event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return { content, filePath };
  } catch (err) {
    dialog.showErrorBox('Error', 'Could not open file: ' + err.message);
    return null;
  }
});

// Save file to existing path
ipcMain.handle('notepad:saveFile', async (_event, content, filePath) => {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return { success: true, filePath };
  } catch (err) {
    dialog.showErrorBox('Error', 'Could not save file: ' + err.message);
    return { success: false };
  }
});

// Save As (show dialog)
ipcMain.handle('notepad:saveFileAs', async (_event, content) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  if (result.canceled) return null;
  try {
    fs.writeFileSync(result.filePath, content, 'utf8');
    return { success: true, filePath: result.filePath };
  } catch (err) {
    dialog.showErrorBox('Error', 'Could not save file: ' + err.message);
    return { success: false };
  }
});

// Print
ipcMain.handle('notepad:print', async () => {
  mainWindow.webContents.print({}, (success, errorType) => {
    if (!success) console.log('Print failed:', errorType);
  });
});

// About dialog
ipcMain.handle('notepad:about', async () => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'About Notepad for Mac',
    message: 'Notepad for Mac',
    detail:
      'Version 1.0.0\n\nA faithful clone of classic Windows Notepad, built for macOS.\n\n© 2024 sanoylab\nhttps://github.com/sanoylab/notepad-for-mac',
    buttons: ['OK'],
  });
});

// Confirm dialog (unsaved changes)
ipcMain.handle('notepad:confirm', async (_event, message) => {
  const result = dialog.showMessageBoxSync(mainWindow, {
    type: 'warning',
    title: 'Notepad for Mac',
    message,
    buttons: ['Save', "Don't Save", 'Cancel'],
    defaultId: 0,
    cancelId: 2,
  });
  return result; // 0 = Save, 1 = Don't Save, 2 = Cancel
});

// Font persistence
const fontFile = () => path.join(app.getPath('userData'), 'font.json');

ipcMain.handle('notepad:getFont', async () => {
  try {
    const raw = fs.readFileSync(fontFile(), 'utf8');
    return JSON.parse(raw);
  } catch {
    return { family: 'Courier New', style: 'Regular', size: 12 };
  }
});

ipcMain.handle('notepad:setFont', async (_event, fontData) => {
  try {
    fs.writeFileSync(fontFile(), JSON.stringify(fontData));
    return true;
  } catch {
    return false;
  }
});

// Window state (called from renderer)
ipcMain.handle('notepad:getWindowState', async () => loadWindowState());
ipcMain.handle('notepad:setWindowState', async (_event, state) => {
  try {
    fs.writeFileSync(windowStateFile(), JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
});

// Force close (renderer confirmed it's OK to close)
ipcMain.on('notepad:forceClose', () => {
  saveWindowState();
  if (mainWindow) mainWindow.destroy();
});

// Update title bar from renderer
ipcMain.on('notepad:setTitle', (_event, title) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setTitle(title);
  }
});
