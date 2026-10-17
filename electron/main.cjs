const { app, BrowserWindow, session, desktopCapturer, ipcMain } = require('electron');
const path = require('node:path');

app.commandLine.appendSwitch('enable-experimental-web-platform-features');

let ambilightTimer = null;
let ambilightWindow = null;
ipcMain.handle('ambilight:start', async (event) => {
  ambilightWindow = BrowserWindow.fromWebContents(event.sender);
  if (ambilightTimer) clearInterval(ambilightTimer);
  const sample = async () => {
    if (!ambilightWindow || ambilightWindow.isDestroyed()) return;
    try {
      const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 32, height: 18 } });
      const image = sources[0]?.thumbnail;
      if (!image || image.isEmpty()) return;
      const { data, info } = await image.toBitmap();
      let r=0, g=0, b=0, count=0;
      for (let i=0; i<data.length; i+=4) {
        const blue=data[i], green=data[i+1], red=data[i+2];
        if ((red+green+blue)/3 > 18) { r+=red; g+=green; b+=blue; count++; }
      }
      if (count) ambilightWindow.webContents.send('ambilight:color', { r:Math.round(r/count), g:Math.round(g/count), b:Math.round(b/count) });
    } catch (error) { console.warn('Ambilight screen sampling failed:', error); }
  };
  await sample();
  ambilightTimer = setInterval(sample, 300);
  return true;
});
ipcMain.handle('ambilight:stop', () => {
  if (ambilightTimer) clearInterval(ambilightTimer);
  ambilightTimer = null;
  ambilightWindow = null;
  return true;
});

app.whenReady().then(() => {
  const { Menu } = require('electron');
  Menu.setApplicationMenu(null);
  // Grant Bluetooth chooser access from the app window when requested.
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(['bluetooth', 'media', 'audioCapture'].includes(permission));
  });
  // Windows loopback audio must be explicitly provided by Electron's
  // display-media handler; getDisplayMedia({audio:true}) alone is insufficient.
  session.defaultSession.setDisplayMediaRequestHandler(async (request, callback) => {
    try {
      const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 0, height: 0 } });
      if (!sources.length) return callback(null);
      callback({ video: sources[0], ...(request.audioRequested ? { audio: 'loopback' } : {}) });
    } catch {
      callback(null);
    }
  });

  const win = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1000,
    minHeight: 700,
    title: 'Chroma Pulse',
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false }
  });
  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  let pendingBluetoothCallback = null;
  let bluetoothScanInProgress = false;
  const connectedDeviceIds = new Set();
  win.webContents.on('select-bluetooth-device', (event, devices, callback) => {
    event.preventDefault();
    if (!bluetoothScanInProgress) {
      bluetoothScanInProgress = true;
      pendingBluetoothCallback = callback;
    }
    // Electron emits repeated scan updates. Keep waiting until an eligible
    // device appears, and complete the Web Bluetooth request only once.
    const candidate = devices.find((device) => device.deviceId && !connectedDeviceIds.has(device.deviceId));
    if (candidate && pendingBluetoothCallback) {
      const finish = pendingBluetoothCallback;
      connectedDeviceIds.add(candidate.deviceId);
      pendingBluetoothCallback = null;
      bluetoothScanInProgress = false;
      finish(candidate.deviceId);
    }
  });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
