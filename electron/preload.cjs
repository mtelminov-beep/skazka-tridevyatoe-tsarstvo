const { contextBridge, ipcRenderer } = require("electron");

// Экрану доступны только безопасные команды оболочки — Node API в браузер не выдаём.
contextBridge.exposeInMainWorld("tridevyatoeApp", {
  quit: () => ipcRenderer.send("tridevyatoe:quit"),
  cmsBase: () => ipcRenderer.sendSync("tridevyatoe:cms-base"),
  licenseStatus: () => ipcRenderer.invoke("tridevyatoe:license-status"),
  activateLicense: (license) => ipcRenderer.invoke("tridevyatoe:license-activate", license)
});
