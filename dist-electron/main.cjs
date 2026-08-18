"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const http = require('http');
const path = require('path');
let localServer = null;
const MIME_TYPES = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain; charset=utf-8',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
};
function showStartupError(title, details) {
    console.error(details);
    dialog.showErrorBox(`Protect The Starship — ${title}`, details);
}
function startLocalGameServer(publicDir) {
    return new Promise((resolve, reject) => {
        const indexPath = path.join(publicDir, 'index.html');
        const server = http.createServer((request, response) => {
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
    const mainWindow = new BrowserWindow({
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
    mainWindow.loadURL(gameUrl).catch((error) => {
        showStartupError('Startup error', `The game interface could not be opened.\n\n${error.message}`);
    });
}
app.whenReady().then(createWindow);
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0)
        void createWindow();
});
app.on('before-quit', () => {
    if (localServer)
        localServer.close();
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        app.quit();
});
