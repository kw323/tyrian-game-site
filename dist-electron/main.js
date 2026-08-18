"use strict";
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
function createWindow() {
    const indexPath = path.join(app.getAppPath(), 'dist', 'public', 'index.html');
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
        const details = `The game files could not be loaded.\n\n${errorDescription} (${errorCode})\n${validatedURL}`;
        console.error(details);
        dialog.showErrorBox('Protect The Starship — Startup error', details);
    });
    if (!fs.existsSync(indexPath)) {
        const details = `The packaged game interface was not found at:\n${indexPath}`;
        console.error(details);
        dialog.showErrorBox('Protect The Starship — Missing files', details);
        return;
    }
    mainWindow.loadFile(indexPath).catch((error) => {
        const details = `The game interface could not be opened.\n\n${error.message}`;
        console.error(details);
        dialog.showErrorBox('Protect The Starship — Startup error', details);
    });
}
app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        app.quit();
});
