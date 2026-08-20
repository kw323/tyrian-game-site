"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { app, BrowserWindow, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const fs = require('fs');
const http = require('http');
const path = require('path');
let localServer = null;
let mainWindow = null;
let updateCheckStarted = false;
let updateInstallRequested = false;
const MIME_TYPES = {
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
function showStartupError(title, details) {
    console.error(details);
    dialog.showErrorBox(`Protect The Starship — ${title}`, details);
}
function stopLocalGameServer() {
    const server = localServer;
    localServer = null;
    if (!server)
        return;
    try {
        server.close();
    }
    catch (error) {
        console.warn('[runtime] Local game server did not close cleanly:', error);
    }
}
function requestSafeUpdateRestart() {
    if (updateInstallRequested)
        return;
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
        }
        catch (error) {
            console.warn('[update] Could not start the installer:', error instanceof Error ? error.message : String(error));
            updateInstallRequested = false;
        }
    }, 100);
    // A final guard handles any Electron/Node handle that would otherwise keep the
    // desktop process in Task Manager after the update installer has been started.
    setTimeout(() => {
        if (updateInstallRequested)
            app.exit(0);
    }, 1500);
}
function configureAutoUpdate() {
    // Updates exist only for the installed Windows game. Development sessions stay offline.
    if (!app.isPackaged || updateCheckStarted)
        return;
    updateCheckStarted = true;
    autoUpdater.autoDownload = false;
    // Installation is triggered only by requestSafeUpdateRestart(), after the local
    // server and window are closed. Passive app quit must never race an NSIS launch.
    autoUpdater.autoInstallOnAppQuit = false;
    autoUpdater.autoRunAppAfterInstall = true;
    autoUpdater.logger = console;
    autoUpdater.on('error', (error) => {
        // A missing connection must never prevent the offline game from starting.
        console.warn('[update] Update check failed:', error.message);
        mainWindow?.setProgressBar(-1);
    });
    autoUpdater.on('update-available', async (info) => {
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
        if (response.response !== 0)
            return;
        mainWindow?.setProgressBar(0);
        try {
            await autoUpdater.downloadUpdate();
        }
        catch (error) {
            console.warn('[update] Download could not start:', error instanceof Error ? error.message : String(error));
            mainWindow?.setProgressBar(-1);
        }
    });
    autoUpdater.on('download-progress', (progress) => {
        mainWindow?.setProgressBar(Math.max(0, Math.min(1, progress.percent / 100)));
    });
    autoUpdater.on('update-downloaded', async (info) => {
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
        autoUpdater.checkForUpdates().catch((error) => {
            console.warn('[update] Unable to check for a release:', error.message);
        });
    }, 6000);
}
function getSaveBackupDirectory() {
    return path.join(app.getPath('documents'), 'Protect The Starship', 'Saves');
}
function sendJson(response, status, value) {
    response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(JSON.stringify(value));
}
function getSaveFilename(key) {
    if (key === 'tyrian_autosave')
        return 'autosave.json';
    const match = /^tyrian_save_slot_(\d+)$/.exec(key);
    return match ? `slot-${match[1].padStart(3, '0')}.json` : null;
}
function startLocalGameServer(publicDir) {
    return new Promise((resolve, reject) => {
        const indexPath = path.join(publicDir, 'index.html');
        const server = http.createServer((request, response) => {
            const requestUrl = new URL(request.url || '/', 'http://127.0.0.1');
            if (requestUrl.pathname === '/api/save-backup' && request.method === 'GET') {
                const saveDirectory = getSaveBackupDirectory();
                const entries = {};
                try {
                    if (fs.existsSync(saveDirectory)) {
                        for (const filename of fs.readdirSync(saveDirectory)) {
                            const key = filename === 'autosave.json'
                                ? 'tyrian_autosave'
                                : /^slot-(\d+)\.json$/.exec(filename)?.[1];
                            if (!key)
                                continue;
                            const storageKey = key === 'tyrian_autosave' ? key : `tyrian_save_slot_${Number(key)}`;
                            entries[storageKey] = fs.readFileSync(path.join(saveDirectory, filename), 'utf8');
                        }
                    }
                }
                catch (error) {
                    console.warn('[saves] Could not read save backup folder:', error);
                }
                sendJson(response, 200, { directory: saveDirectory, entries });
                return;
            }
            if (requestUrl.pathname === '/api/save-backup' && request.method === 'POST') {
                const chunks = [];
                request.on('data', (chunk) => {
                    if (chunks.reduce((size, item) => size + item.length, 0) < 4 * 1024 * 1024)
                        chunks.push(chunk);
                });
                request.on('end', () => {
                    try {
                        const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
                        const filename = typeof body.key === 'string' ? getSaveFilename(body.key) : null;
                        if (!filename || typeof body.payload !== 'string') {
                            sendJson(response, 400, { error: 'Invalid save payload.' });
                            return;
                        }
                        const saveDirectory = getSaveBackupDirectory();
                        fs.mkdirSync(saveDirectory, { recursive: true });
                        fs.writeFileSync(path.join(saveDirectory, filename), body.payload, 'utf8');
                        sendJson(response, 200, { directory: saveDirectory });
                    }
                    catch (error) {
                        console.warn('[saves] Could not write save backup:', error);
                        sendJson(response, 500, { error: 'Could not write save backup.' });
                    }
                });
                return;
            }
            if (request.method !== 'GET' && request.method !== 'HEAD') {
                response.writeHead(405, { Allow: 'GET, HEAD' });
                response.end();
                return;
            }
            let requestedPath = 'index.html';
            try {
                const requestUrl = new URL(request.url || '/', 'http://127.0.0.1');
                requestedPath = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, '') || 'index.html';
            }
            catch {
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
                if (!response.headersSent)
                    response.writeHead(500);
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
async function createWindow() {
    const publicDir = path.join(app.getAppPath(), 'dist', 'public');
    const indexPath = path.join(publicDir, 'index.html');
    if (!fs.existsSync(indexPath)) {
        showStartupError('Missing files', `The packaged game interface was not found at:\n${indexPath}`);
        return;
    }
    let gameUrl;
    try {
        // A local HTTP origin avoids Electron file:// routing and module-loading edge cases.
        gameUrl = await startLocalGameServer(publicDir);
    }
    catch (error) {
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
    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
        if (!isMainFrame)
            return;
        showStartupError('Startup error', `The game interface could not be loaded.\n\n${errorDescription} (${errorCode})\n${validatedURL}`);
    });
    mainWindow.on('closed', () => { mainWindow = null; });
    mainWindow.loadURL(gameUrl).catch((error) => {
        showStartupError('Startup error', `The game interface could not be opened.\n\n${error.message}`);
    });
    configureAutoUpdate();
}
app.whenReady().then(createWindow);
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0)
        void createWindow();
});
app.on('before-quit', () => {
    stopLocalGameServer();
});
app.on('will-quit', () => {
    stopLocalGameServer();
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        app.quit();
});
