const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  openFile: () => ipcRenderer.invoke('notepad:openFile'),
  openFilePath: (filePath) => ipcRenderer.invoke('notepad:openFilePath', filePath),
  saveFile: (content, filePath) => ipcRenderer.invoke('notepad:saveFile', content, filePath),
  saveFileAs: (content) => ipcRenderer.invoke('notepad:saveFileAs', content),

  // Print
  showPrintDialog: (content) => ipcRenderer.invoke('notepad:print', content),

  // About dialog
  showAbout: () => ipcRenderer.invoke('notepad:about'),

  // Confirm dialog (for unsaved changes)
  showConfirm: (message) => ipcRenderer.invoke('notepad:confirm', message),

  // Font persistence
  getFont: () => ipcRenderer.invoke('notepad:getFont'),
  setFont: (fontData) => ipcRenderer.invoke('notepad:setFont', fontData),

  // Window state persistence
  getWindowState: () => ipcRenderer.invoke('notepad:getWindowState'),
  setWindowState: (state) => ipcRenderer.invoke('notepad:setWindowState', state),

  // Menu action listener — main process sends string action names
  onMenuAction: (callback) => ipcRenderer.on('menu:action', (_event, action) => callback(action)),
  removeMenuListeners: () => ipcRenderer.removeAllListeners('menu:action'),

  // Signal main to destroy window (bypass close guard)
  forceClose: () => ipcRenderer.send('notepad:forceClose'),

  // Update window title from renderer
  setTitle: (title) => ipcRenderer.send('notepad:setTitle', title),
});
