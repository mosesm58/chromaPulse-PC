const { app, BrowserWindow, session, desktopCapturer, ipcMain, screen, Tray, Menu, nativeImage } = require('electron');
const path = require('node:path');

let appTray = null;
let mainWindow = null;

function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

ipcMain.on('app:minimize-to-tray', () => mainWindow?.hide());
ipcMain.on('app:quit', () => app.quit());

app.commandLine.appendSwitch('enable-experimental-web-platform-features');

let ambilightTimer = null;
let ambilightWindow = null;
let ambilightRunId = 0;
let lastAmbilightColor = null;
let lastAmbilightSampleAt = 0;
ipcMain.handle('ambilight:start', async (event) => {
  const runId = ++ambilightRunId;
  ambilightWindow = BrowserWindow.fromWebContents(event.sender);
  if (ambilightTimer) clearTimeout(ambilightTimer);
  ambilightTimer = null;
  lastAmbilightColor = null;
  lastAmbilightSampleAt = 0;

  const sample = async () => {
    if (runId !== ambilightRunId || !ambilightWindow || ambilightWindow.isDestroyed()) return;
    try {
      const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 32, height: 18 } });
      if (!sources.length) throw new Error('Windows did not return a screen capture source.');
      const primaryId = String(screen.getPrimaryDisplay().id);
      const source = sources.find((item) => item.display_id === primaryId)
        || sources.find((item) => item.id.startsWith(`screen:${primaryId}:`))
        || sources[0];
      const image = source?.thumbnail;
      if (!image || image.isEmpty()) throw new Error('The primary display capture was empty.');
      const data = image.toBitmap();
      const colors = new Map();
      let totalR = 0, totalG = 0, totalB = 0, pixels = 0;
      for (let i = 0; i < data.length; i += 4) {
        const b = data[i], g = data[i + 1], r = data[i + 2];
        const key = `${r >> 4},${g >> 4},${b >> 4}`;
        const bucket = colors.get(key) || { count: 0, r: 0, g: 0, b: 0 };
        bucket.count++;
        bucket.r += r;
        bucket.g += g;
        bucket.b += b;
        colors.set(key, bucket);
        totalR += r; totalG += g; totalB += b; pixels++;
      }
      if (runId !== ambilightRunId || !ambilightWindow || ambilightWindow.isDestroyed()) return;
      const dominant = [...colors.values()].sort((a, b) => b.count - a.count)[0];
      let color = dominant && dominant.count > pixels * 0.04
        ? { r: Math.round(dominant.r / dominant.count), g: Math.round(dominant.g / dominant.count), b: Math.round(dominant.b / dominant.count) }
        : { r: Math.round(totalR / pixels), g: Math.round(totalG / pixels), b: Math.round(totalB / pixels) };
      const sampleTime = Date.now();
      if (lastAmbilightColor) {
        const elapsedMs = Math.max(1, sampleTime - lastAmbilightSampleAt);
        const blend = 1 - Math.exp(-elapsedMs / 300);
        color = {
          r: Math.round(lastAmbilightColor.r + (color.r - lastAmbilightColor.r) * blend),
          g: Math.round(lastAmbilightColor.g + (color.g - lastAmbilightColor.g) * blend),
          b: Math.round(lastAmbilightColor.b + (color.b - lastAmbilightColor.b) * blend),
        };
      }
      const changed = !lastAmbilightColor
        || Math.max(Math.abs(color.r - lastAmbilightColor.r), Math.abs(color.g - lastAmbilightColor.g), Math.abs(color.b - lastAmbilightColor.b)) >= 2;
      lastAmbilightColor = color;
      lastAmbilightSampleAt = sampleTime;
      if (changed) ambilightWindow.webContents.send('ambilight:color', color);
    } catch (error) {
      console.warn('Ambilight screen sampling failed:', error);
      if (runId === ambilightRunId && !lastAmbilightColor) throw error;
    } finally {
      if (runId === ambilightRunId && ambilightWindow && !ambilightWindow.isDestroyed()) {
        ambilightTimer = setTimeout(sample, 100);
      }
    }
  };

  try {
    await sample();
  } catch (error) {
    if (runId === ambilightRunId) {
      ++ambilightRunId;
      if (ambilightTimer) clearTimeout(ambilightTimer);
      ambilightTimer = null;
      ambilightWindow = null;
      lastAmbilightColor = null;
      lastAmbilightSampleAt = 0;
    }
    throw error;
  }
  return true;
});
ipcMain.handle('ambilight:stop', () => {
  ++ambilightRunId;
  if (ambilightTimer) clearTimeout(ambilightTimer);
  ambilightTimer = null;
  ambilightWindow = null;
  lastAmbilightColor = null;
  lastAmbilightSampleAt = 0;
  return true;
});

app.whenReady().then(() => {
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
      const primaryDisplayId = String(screen.getPrimaryDisplay().id);
      const source = sources.find((item) => item.display_id === primaryDisplayId)
        || sources.find((item) => item.id.startsWith(`screen:${primaryDisplayId}:`))
        || sources[0];
      callback({ video: source, ...(request.audioRequested ? { audio: 'loopback' } : {}) });
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
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, backgroundThrottling: false }
  });
  mainWindow = win;
  const trayIconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'icon.ico')
    : path.join(__dirname, '..', 'build', 'icon.ico');
  const trayIcon = nativeImage.createFromPath(trayIconPath);
  appTray = new Tray(trayIcon);
  appTray.setToolTip('Chroma Pulse');
  appTray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Open Chroma Pulse', click: showMainWindow },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]));
  appTray.on('click', showMainWindow);
  appTray.on('double-click', showMainWindow);
  win.on('closed', () => { if (mainWindow === win) mainWindow = null; });
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

app.on('before-quit', () => {
  if (appTray) {
    appTray.destroy();
    appTray = null;
  }
});
