const { Menu } = require('electron');

function buildMenu(mainWindow) {
  const send = (action) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('menu:action', action);
    }
  };

  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New',
          accelerator: 'CmdOrCtrl+N',
          click: () => send('NEW'),
        },
        {
          label: 'Open…',
          accelerator: 'CmdOrCtrl+O',
          click: () => send('OPEN'),
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => send('SAVE'),
        },
        {
          label: 'Save As…',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => send('SAVE_AS'),
        },
        { type: 'separator' },
        {
          label: 'Page Setup…',
          accelerator: 'CmdOrCtrl+Shift+P',
          click: () => send('PAGE_SETUP'),
        },
        {
          label: 'Print…',
          accelerator: 'CmdOrCtrl+P',
          click: () => send('PRINT'),
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => send('EXIT'),
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          click: () => send('UNDO'),
        },
        { type: 'separator' },
        {
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          click: () => send('CUT'),
        },
        {
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          click: () => send('COPY'),
        },
        {
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          click: () => send('PASTE'),
        },
        {
          label: 'Delete',
          accelerator: 'Delete',
          click: () => send('DELETE'),
        },
        { type: 'separator' },
        {
          label: 'Find…',
          accelerator: 'CmdOrCtrl+F',
          click: () => send('FIND'),
        },
        {
          label: 'Find Next',
          accelerator: 'F3',
          click: () => send('FIND_NEXT'),
        },
        {
          label: 'Replace…',
          accelerator: 'CmdOrCtrl+H',
          click: () => send('REPLACE'),
        },
        {
          label: 'Go To…',
          accelerator: 'CmdOrCtrl+G',
          click: () => send('GOTO'),
        },
        { type: 'separator' },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          click: () => send('SELECT_ALL'),
        },
        {
          label: 'Time/Date',
          accelerator: 'F5',
          click: () => send('TIME_DATE'),
        },
      ],
    },
    {
      label: 'Format',
      submenu: [
        {
          label: 'Word Wrap',
          type: 'checkbox',
          checked: false,
          id: 'word-wrap',
          click: (menuItem) => {
            send('WORD_WRAP:' + menuItem.checked);
          },
        },
        {
          label: 'Font…',
          click: () => send('FONT'),
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Status Bar',
          type: 'checkbox',
          checked: true,
          id: 'status-bar',
          click: (menuItem) => {
            send('STATUS_BAR:' + menuItem.checked);
          },
        },
        { type: 'separator' },
        {
          label: 'Zoom',
          submenu: [
            {
              label: 'Zoom In',
              accelerator: 'CmdOrCtrl+=',
              click: () => send('ZOOM_IN'),
            },
            {
              label: 'Zoom Out',
              accelerator: 'CmdOrCtrl+-',
              click: () => send('ZOOM_OUT'),
            },
            {
              label: 'Restore Default Zoom',
              accelerator: 'CmdOrCtrl+0',
              click: () => send('ZOOM_RESET'),
            },
          ],
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'View Help',
          click: () => send('HELP'),
        },
        { type: 'separator' },
        {
          label: 'About Notepad for Mac',
          click: () => send('ABOUT'),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  return menu;
}

module.exports = { buildMenu };
