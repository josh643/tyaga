import { app, BrowserWindow } from 'electron';
import path from 'path';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { Orchestrator } from './orchestrator';

// Configure logging
log.transports.file.level = 'info';
autoUpdater.logger = log;

// "Silent" Strategy Configuration
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// Initialize Orchestrator
new Orchestrator();

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js
// │ ├─┬ preload
// │ │ └── index.js
// │ └── index.html
//
process.env.DIST = path.join(__dirname, '../dist-renderer');
process.env.PUBLIC = app.isPackaged ? process.env.DIST : path.join(__dirname, '../public');

let win: BrowserWindow | null;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'hiddenInset', // Mac style, or use custom titlebar for Windows
    backgroundColor: '#0F0720', // Deepest Purple
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true,
      webSecurity: false, // Allow CORS for local LLM
    },
  });

  // Test active push message to Console when Electron starts.
  console.log('Main process message: Tyaga Desktop launching...');

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST || '', 'index.html'));
  }
}

app.on('window-all-closed', () => {
  win = null;
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.whenReady().then(() => {
    createWindow();
    // Check for updates silently
    autoUpdater.checkForUpdates();
  });

// Auto-Updater Events for Debugging/Logging
autoUpdater.on('checking-for-update', () => {
  log.info('Checking for update...');
});
autoUpdater.on('update-available', (info) => {
  log.info('Update available.');
});
autoUpdater.on('update-not-available', (info) => {
  log.info('Update not available.');
});
autoUpdater.on('error', (err) => {
  log.info('Error in auto-updater. ' + err);
});
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  log.info(log_message);
});
autoUpdater.on('update-downloaded', (info) => {
  log.info('Update downloaded');
});
