const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ambilightCapture', {
  start: () => ipcRenderer.invoke('ambilight:start'),
  stop: () => ipcRenderer.invoke('ambilight:stop'),
  onColor: (callback) => {
    const listener = (_event, color) => callback(color);
    ipcRenderer.on('ambilight:color', listener);
    return () => ipcRenderer.removeListener('ambilight:color', listener);
  },
});
