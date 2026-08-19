const { app, BrowserWindow, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const fs = require('fs');
const http = require('http');
const path = require('path');

let localServer: any = null;
let mainWindow: any = null;
let updateCheckStarted = false;
let updateInstallRequested = false;

const MIME_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function showStartupError(title: string, details: string): void {
  console.error(details);
  dialog.showErrorBox(`Protect The Starship — ${title}`, details);
}

function stopLocalGameServer(): void {
  const server = localServer;
  localServer = null;
  if (!server) return;
  try {
    server.close();
  } catch (error) {
    console.warn('[runtime] Local game server did not close cleanly:', error);
  }
}

function requestSafeUpdateRestart(): void {
  if (updateInstallRequested) return;
  updateInstallRequested = true;

  // The local HTTP server holds Node's event loop open even after the renderer
  // closes. Stop it before asking Electron to quit so Windows cannot see a stale
  // Protect The Starship process while NSIS begins its in-place update.
  stopLocalGameServer();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.destroy();
    mainWindow = null;
  }

  // Explicit installation makes the order deterministic: electron-updater marks
  // the NSIS run as an update, launches it, then quits Electron. The installer
  // can consequently close any final child process rather than prompting the
  // player to uninstall or terminate it by hand.
  setTimeout(() => {
    try {
      autoUpdater.quitAndInstall(false, true);
    } catch (error) {
      console.warn('[update] Could not start the installer:', error instanceof Error ? error.message : String(error));
      updateInstallRequested = false;
    }
  }, 100);

  // A final guard handles any Electron/Node handle that would otherwise keep the
  // desktop process in Task Manager after the update installer has been started.
  setTimeout(() => {
    if (updateInstallRequested) app.exit(0);
  }, 1500);
}

function configureAutoUpdate(): void {
  // Updates exist only for the installed Windows game. Development sessions stay offline.
  if (!app.isPackaged || updateCheckStarted) return;
  updateCheckStarted = true;

  autoUpdater.autoDownload = false;
  // Installation is triggered only by requestSafeUpdateRestart(), after the local
  // server and window are closed. Passive app quit must never race an NSIS launch.
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.autoRunAppAfterInstall = true;
  autoUpdater.logger = console;

  autoUpdater.on('error', (error: Error) => {
    // A missing connection must never prevent the offline game from starting.
    console.warn('[update] Update check failed:', error.message);
    mainWindow?.setProgressBar(-1);
  });

  autoUpdater.on('update-available', async (info: { version: string }) => {
    const response = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Protect The Starship — Update available',
      message: `Version ${info.version} is ready to download.`,
      detail: 'The game will download only the changed update data. Your save files will remain untouched.',
      buttons: ['Download update', 'Later'],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
    });
    if (response.response !== 0) return;
    mainWindow?.setProgressBar(0);
    try {
      await autoUpdater.downloadUpdate();
    } catch (error) {
      console.warn('[update] Download could not start:', error instanceof Error ? error.message : String(error));
      mainWindow?.setProgressBar(-1);
    }
  });

  autoUpdater.on('download-progress', (progress: { percent: number }) => {
    mainWindow?.setProgressBar(Math.max(0, Math.min(1, progress.percent / 100)));
  });

  autoUpdater.on('update-downloaded', async (info: { version: string }) => {
    mainWindow?.setProgressBar(-1);
    const response = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Protect The Starship — Update ready',
      message: `Version ${info.version} has been downloaded.`,
      detail: 'Restart now closes the game and starts the managed update. Any remaining game process is closed by the installer, and your save files remain untouched.',
      buttons: ['Restart and install', 'Later'],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
    });
    if (response.response === 0) {
      requestSafeUpdateRestart();
    }
  });

  // Delay the network request so the game window always appears immediately.
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((error: Error) => {
      console.warn('[update] Unable to check for a release:', error.message);
    });
  }, 6000);
}

function startLocalGameServer(publicDir: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const indexPath = path.join(publicDir, 'index.html');
    const server = http.createServer((request: any, response: any) => {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.writeHead(405, { Allow: 'GET, HEAD' });
        response.end();
        return;
      }

      let requestedPath = 'index.html';
      try {
        const requestUrl = new URL(request.url || '/', 'http://127.0.0.1');
        requestedPath = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, '') || 'index.html';
      } catch {
        response.writeHead(400);
        response.end('Invalid request');
        return;
      }

      const candidatePath = path.resolve(publicDir, requestedPath);
      const isWithinPublicDir = candidatePath === publicDir || candidatePath.startsWith(`${publicDir}${path.sep}`);
      const filePath = isWithinPublicDir && fs.existsSync(candidatePath) && fs.statSync(candidatePath).isFile()
        ? candidatePath
        : indexPath;

      const extension = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[extension] || 'application/octet-stream';
      response.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
      if (request.method === 'HEAD') {
        response.end();
        return;
      }
      fs.createReadStream(filePath)
        .on('error', () => {
          if (!response.headersSent) response.writeHead(500);
          response.end('Unable to read game files');
        })
        .pipe(response);
    });

    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('The local game server did not receive a valid port.'));
        return;
      }
      localServer = server;
      resolve(`http://127.0.0.1:${address.port}/`);
    });
  });
}

async function createWindow(): Promise<void> {
  const publicDir = path.join(app.getAppPath(), 'dist', 'public');
  const indexPath = path.join(publicDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    showStartupError('Missing files', `The packaged game interface was not found at:\n${indexPath}`);
    return;
  }

  let gameUrl: string;
  try {
    // A local HTTP origin avoids Electron file:// routing and module-loading edge cases.
    gameUrl = await startLocalGameServer(publicDir);
  } catch (error) {
    showStartupError('Startup error', `The local game server could not start.\n\n${error instanceof Error ? error.message : String(error)}`);
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    title: 'Protect The Starship',
    backgroundColor: '#06111a',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.webContents.on('did-fail-load', (_event: unknown, errorCode: number, errorDescription: string, validatedURL: string, isMainFrame: boolean) => {
    if (!isMainFrame) return;
    showStartupError('Startup error', `The game interface could not be loaded.\n\n${errorDescription} (${errorCode})\n${validatedURL}`);
  });
  mainWindow.on('closed', () => { mainWindow = null; });

  mainWindow.loadURL(gameUrl).catch((error: Error) => {
    showStartupError('Startup error', `The game interface could not be opened.\n\n${error.message}`);
  });
  configureAutoUpdate();
}

app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) void createWindow();
});

app.on('before-quit', () => {
  stopLocalGameServer();
});

app.on('will-quit', () => {
  stopLocalGameServer();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
