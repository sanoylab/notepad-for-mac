/* ─── State ─────────────────────────────────────────────────────────────────── */
let currentFilePath = null;
let isDirty = false;
let wordWrap = false;
let statusBarVisible = true;
let currentFont = { family: 'Courier New', style: 'Regular', size: 12 };
let currentZoom = 12; // font-size in px, used for zoom in/out
let lastSearchStr = '';
let lastSearchPos = 0; // index in editor.value after last match

const editor = document.getElementById('editor');
const statusBar = document.getElementById('status-bar');
const lineColEl = document.getElementById('line-col');

/* ─── Helpers ────────────────────────────────────────────────────────────────── */

function getLineCol() {
  const pos = editor.selectionStart;
  const text = editor.value.substring(0, pos);
  const lines = text.split('\n');
  return { line: lines.length, col: lines[lines.length - 1].length + 1 };
}

function updateStatusBar() {
  const { line, col } = getLineCol();
  lineColEl.textContent = `Ln ${line}, Col ${col}`;
}

function setTitle(fileName) {
  const name = fileName || 'Untitled';
  const dirty = isDirty ? '*' : '';
  const title = `${dirty}${name} - Notepad for Mac`;
  document.title = title;
  window.electronAPI.setTitle(title);
}

function markDirty() {
  if (!isDirty) {
    isDirty = true;
    setTitle(currentFilePath ? currentFilePath.split('/').pop() : null);
  }
  updateStatusBar();
}

function applyFont(font) {
  const styleMap = {
    Regular: { weight: 'normal', style: 'normal' },
    Bold: { weight: 'bold', style: 'normal' },
    Italic: { weight: 'normal', style: 'italic' },
    'Bold Italic': { weight: 'bold', style: 'italic' },
  };
  const s = styleMap[font.style] || styleMap['Regular'];
  editor.style.fontFamily = `'${font.family}', monospace`;
  editor.style.fontWeight = s.weight;
  editor.style.fontStyle = s.style;
  editor.style.fontSize = font.size + 'px';
  currentZoom = font.size;
}

function resetState(content, filePath) {
  editor.value = content || '';
  currentFilePath = filePath || null;
  isDirty = false;
  lastSearchPos = 0;
  updateStatusBar();
  setTitle(filePath ? filePath.split('/').pop() : null);
}

/* ─── Unsaved Changes Guard ──────────────────────────────────────────────────── */

async function confirmUnsaved() {
  // Returns true if it's OK to proceed (saved or discarded), false if cancelled
  if (!isDirty) return true;
  const name = currentFilePath ? currentFilePath.split('/').pop() : 'Untitled';
  const btn = await window.electronAPI.showConfirm(
    `Do you want to save changes to ${name}?`
  );
  if (btn === 0) {
    // Save
    return await doSave();
  } else if (btn === 1) {
    // Don't save
    return true;
  }
  // Cancel
  return false;
}

/* ─── File Operations ────────────────────────────────────────────────────────── */

async function doSave() {
  if (!currentFilePath) return doSaveAs();
  const result = await window.electronAPI.saveFile(editor.value, currentFilePath);
  if (result && result.success) {
    isDirty = false;
    setTitle(currentFilePath.split('/').pop());
    return true;
  }
  return false;
}

async function doSaveAs() {
  const result = await window.electronAPI.saveFileAs(editor.value);
  if (result && result.success) {
    currentFilePath = result.filePath;
    isDirty = false;
    setTitle(currentFilePath.split('/').pop());
    return true;
  }
  return false;
}

async function doOpen() {
  const result = await window.electronAPI.openFile();
  if (!result) return;
  resetState(result.content, result.filePath);
}

async function doOpenPath(filePath) {
  const data = await window.electronAPI.openFilePath(filePath);
  if (data) resetState(data.content, data.filePath);
}

/* ─── Find / Replace ─────────────────────────────────────────────────────────── */

function findNext(searchStr, matchCase, wrapAround) {
  if (!searchStr) return false;
  const text = matchCase ? editor.value : editor.value.toLowerCase();
  const needle = matchCase ? searchStr : searchStr.toLowerCase();
  let startPos = editor.selectionEnd || lastSearchPos;

  let idx = text.indexOf(needle, startPos);
  if (idx === -1 && wrapAround) {
    idx = text.indexOf(needle, 0);
  }
  if (idx === -1) return false;

  editor.focus();
  editor.setSelectionRange(idx, idx + needle.length);
  lastSearchPos = idx + needle.length;

  // Scroll into view
  const linesBefore = editor.value.substring(0, idx).split('\n').length - 1;
  const lineHeight = parseFloat(getComputedStyle(editor).lineHeight) || 16;
  editor.scrollTop = Math.max(0, linesBefore * lineHeight - editor.clientHeight / 2);

  return true;
}

function replaceNext(findStr, replaceStr, matchCase) {
  if (!findStr) return;
  const text = editor.value;
  const needle = matchCase ? findStr : findStr.toLowerCase();
  const haystack = matchCase ? text : text.toLowerCase();
  const idx = haystack.indexOf(needle, editor.selectionStart);
  if (idx === -1) return;
  const before = text.substring(0, idx);
  const after = text.substring(idx + findStr.length);
  editor.value = before + replaceStr + after;
  editor.setSelectionRange(idx, idx + replaceStr.length);
  markDirty();
}

function replaceAll(findStr, replaceStr, matchCase) {
  if (!findStr) return 0;
  const flags = matchCase ? 'g' : 'gi';
  const escaped = findStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(escaped, flags);
  const count = (editor.value.match(re) || []).length;
  editor.value = editor.value.replace(re, replaceStr);
  markDirty();
  return count;
}

function goToLine(lineNum) {
  const lines = editor.value.split('\n');
  const n = Math.max(1, Math.min(lineNum, lines.length));
  let pos = 0;
  for (let i = 0; i < n - 1; i++) {
    pos += lines[i].length + 1; // +1 for \n
  }
  editor.focus();
  editor.setSelectionRange(pos, pos);
  const lineHeight = parseFloat(getComputedStyle(editor).lineHeight) || 16;
  editor.scrollTop = Math.max(0, (n - 1) * lineHeight - editor.clientHeight / 2);
  updateStatusBar();
}

/* ─── Dialog Helpers ─────────────────────────────────────────────────────────── */

function showDialog(id) {
  document.querySelectorAll('.dialog').forEach((d) => {
    if (d.id !== id) d.classList.add('hidden');
  });
  const dlg = document.getElementById(id);
  dlg.classList.remove('hidden');
  const firstInput = dlg.querySelector('input, select');
  if (firstInput) firstInput.focus();
}

function hideDialog(id) {
  document.getElementById(id).classList.add('hidden');
  editor.focus();
}

/* ─── Menu Action Handler ────────────────────────────────────────────────────── */

async function handleMenuAction(action) {
  // Handle parametric actions (e.g. WORD_WRAP:true, OPEN_PATH:/foo/bar.txt)
  if (action.startsWith('WORD_WRAP:')) {
    wordWrap = action.split(':')[1] === 'true';
    editor.style.whiteSpace = wordWrap ? 'pre-wrap' : 'pre';
    editor.style.overflowX = wordWrap ? 'hidden' : 'auto';
    return;
  }
  if (action.startsWith('STATUS_BAR:')) {
    statusBarVisible = action.split(':')[1] === 'true';
    statusBar.classList.toggle('hidden', !statusBarVisible);
    return;
  }
  if (action.startsWith('OPEN_PATH:')) {
    const filePath = action.substring('OPEN_PATH:'.length);
    if (!(await confirmUnsaved())) return;
    await doOpenPath(filePath);
    return;
  }

  switch (action) {
    case 'NEW':
      if (!(await confirmUnsaved())) return;
      resetState('', null);
      break;

    case 'OPEN':
      if (!(await confirmUnsaved())) return;
      await doOpen();
      break;

    case 'SAVE':
      await doSave();
      break;

    case 'SAVE_AS':
      await doSaveAs();
      break;

    case 'PRINT':
      await window.electronAPI.showPrintDialog(editor.value);
      break;

    case 'PAGE_SETUP':
      // Not implemented — no native page setup in Electron without printing
      break;

    case 'EXIT': {
      if (!(await confirmUnsaved())) return;
      window.electronAPI.forceClose();
      break;
    }

    case 'UNDO':
      document.execCommand('undo');
      markDirty();
      break;

    case 'CUT':
      document.execCommand('cut');
      markDirty();
      break;

    case 'COPY':
      document.execCommand('copy');
      break;

    case 'PASTE':
      document.execCommand('paste');
      markDirty();
      break;

    case 'DELETE': {
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      if (start !== end) {
        editor.value = editor.value.substring(0, start) + editor.value.substring(end);
        editor.setSelectionRange(start, start);
        markDirty();
      }
      break;
    }

    case 'SELECT_ALL':
      editor.select();
      updateStatusBar();
      break;

    case 'TIME_DATE': {
      const now = new Date();
      const timeStr =
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
        ' ' +
        now.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' });
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      editor.value = editor.value.substring(0, start) + timeStr + editor.value.substring(end);
      editor.setSelectionRange(start + timeStr.length, start + timeStr.length);
      markDirty();
      break;
    }

    case 'FIND':
      showDialog('find-dialog');
      document.getElementById('find-input').select();
      break;

    case 'FIND_NEXT': {
      const searchStr = document.getElementById('find-input').value || lastSearchStr;
      if (searchStr) {
        lastSearchStr = searchStr;
        const matchCase = document.getElementById('find-case').checked;
        const wrapAround = document.getElementById('find-wrap').checked;
        const found = findNext(searchStr, matchCase, wrapAround);
        if (!found) {
          // Let Electron show native alert equivalent via a status update
          document.getElementById('line-col').textContent = 'Not found';
          setTimeout(updateStatusBar, 1500);
        }
      }
      break;
    }

    case 'REPLACE':
      showDialog('replace-dialog');
      document.getElementById('replace-find-input').select();
      break;

    case 'GOTO':
      showDialog('goto-dialog');
      document.getElementById('goto-input').value = getLineCol().line;
      document.getElementById('goto-input').select();
      break;

    case 'FONT':
      // Populate dialog with current font
      document.getElementById('font-family').value = currentFont.family;
      document.getElementById('font-style').value = currentFont.style;
      document.getElementById('font-size').value = String(currentFont.size);
      updateFontPreview();
      showDialog('font-dialog');
      break;

    case 'ZOOM_IN':
      currentZoom = Math.min(72, currentZoom + 2);
      editor.style.fontSize = currentZoom + 'px';
      break;

    case 'ZOOM_OUT':
      currentZoom = Math.max(8, currentZoom - 2);
      editor.style.fontSize = currentZoom + 'px';
      break;

    case 'ZOOM_RESET':
      currentZoom = currentFont.size;
      editor.style.fontSize = currentZoom + 'px';
      break;

    case 'ABOUT':
      await window.electronAPI.showAbout();
      break;

    case 'HELP':
      // No external help page — show about as fallback
      await window.electronAPI.showAbout();
      break;

    default:
      break;
  }
}

/* ─── Font Dialog ────────────────────────────────────────────────────────────── */

function updateFontPreview() {
  const preview = document.getElementById('font-preview');
  const family = document.getElementById('font-family').value;
  const style = document.getElementById('font-style').value;
  const size = parseInt(document.getElementById('font-size').value, 10);
  const styleMap = {
    Regular: { weight: 'normal', style: 'normal' },
    Bold: { weight: 'bold', style: 'normal' },
    Italic: { weight: 'normal', style: 'italic' },
    'Bold Italic': { weight: 'bold', style: 'italic' },
  };
  const s = styleMap[style] || styleMap['Regular'];
  preview.style.fontFamily = `'${family}', monospace`;
  preview.style.fontWeight = s.weight;
  preview.style.fontStyle = s.style;
  preview.style.fontSize = Math.min(size, 24) + 'px';
}

['font-family', 'font-style', 'font-size'].forEach((id) => {
  document.getElementById(id).addEventListener('change', updateFontPreview);
});

document.getElementById('font-ok-btn').addEventListener('click', async () => {
  const family = document.getElementById('font-family').value;
  const style = document.getElementById('font-style').value;
  const size = parseInt(document.getElementById('font-size').value, 10);
  currentFont = { family, style, size };
  applyFont(currentFont);
  await window.electronAPI.setFont(currentFont);
  hideDialog('font-dialog');
});

document.getElementById('font-cancel-btn').addEventListener('click', () => hideDialog('font-dialog'));
document.getElementById('font-close').addEventListener('click', () => hideDialog('font-dialog'));

/* ─── Find Dialog ────────────────────────────────────────────────────────────── */

document.getElementById('find-next-btn').addEventListener('click', () => {
  const searchStr = document.getElementById('find-input').value;
  if (!searchStr) return;
  lastSearchStr = searchStr;
  const matchCase = document.getElementById('find-case').checked;
  const wrapAround = document.getElementById('find-wrap').checked;
  findNext(searchStr, matchCase, wrapAround);
});

document.getElementById('find-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('find-next-btn').click();
  if (e.key === 'Escape') hideDialog('find-dialog');
});

document.getElementById('find-cancel-btn').addEventListener('click', () => hideDialog('find-dialog'));
document.getElementById('find-close').addEventListener('click', () => hideDialog('find-dialog'));

/* ─── Replace Dialog ─────────────────────────────────────────────────────────── */

document.getElementById('replace-find-btn').addEventListener('click', () => {
  const searchStr = document.getElementById('replace-find-input').value;
  if (!searchStr) return;
  const matchCase = document.getElementById('replace-case').checked;
  findNext(searchStr, matchCase, true);
});

document.getElementById('replace-btn').addEventListener('click', () => {
  const findStr = document.getElementById('replace-find-input').value;
  const replaceStr = document.getElementById('replace-with-input').value;
  const matchCase = document.getElementById('replace-case').checked;
  replaceNext(findStr, replaceStr, matchCase);
  findNext(findStr, matchCase, true);
});

document.getElementById('replace-all-btn').addEventListener('click', () => {
  const findStr = document.getElementById('replace-find-input').value;
  const replaceStr = document.getElementById('replace-with-input').value;
  const matchCase = document.getElementById('replace-case').checked;
  const count = replaceAll(findStr, replaceStr, matchCase);
  lineColEl.textContent = `Replaced ${count} occurrence${count !== 1 ? 's' : ''}`;
  setTimeout(updateStatusBar, 2000);
});

document.getElementById('replace-find-input').addEventListener('keydown', (e) => {
  if (e.key === 'Escape') hideDialog('replace-dialog');
});

document.getElementById('replace-cancel-btn').addEventListener('click', () => hideDialog('replace-dialog'));
document.getElementById('replace-close').addEventListener('click', () => hideDialog('replace-dialog'));

/* ─── Go To Dialog ───────────────────────────────────────────────────────────── */

document.getElementById('goto-go-btn').addEventListener('click', () => {
  const lineNum = parseInt(document.getElementById('goto-input').value, 10);
  if (!isNaN(lineNum)) goToLine(lineNum);
  hideDialog('goto-dialog');
});

document.getElementById('goto-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('goto-go-btn').click();
  if (e.key === 'Escape') hideDialog('goto-dialog');
});

document.getElementById('goto-cancel-btn').addEventListener('click', () => hideDialog('goto-dialog'));
document.getElementById('goto-close').addEventListener('click', () => hideDialog('goto-dialog'));

/* ─── Editor Event Listeners ─────────────────────────────────────────────────── */

editor.addEventListener('input', markDirty);
editor.addEventListener('keyup', updateStatusBar);
editor.addEventListener('click', updateStatusBar);
editor.addEventListener('keydown', (e) => {
  // Close open dialogs on Escape
  if (e.key === 'Escape') {
    document.querySelectorAll('.dialog:not(.hidden)').forEach((d) => {
      d.classList.add('hidden');
    });
  }
});

/* ─── Init ───────────────────────────────────────────────────────────────────── */

async function init() {
  // Load persisted font
  const savedFont = await window.electronAPI.getFont();
  if (savedFont) {
    currentFont = savedFont;
    currentZoom = savedFont.size;
    applyFont(currentFont);
  }

  // Set initial title
  setTitle(null);
  updateStatusBar();

  // Wire up menu action listener
  window.electronAPI.onMenuAction(handleMenuAction);

  // Focus editor
  editor.focus();
}

init();
