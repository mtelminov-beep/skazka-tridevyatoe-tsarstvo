const { contextBridge, ipcRenderer } = require("electron");

// Экрану доступны только безопасные команды оболочки — Node API в браузер не выдаём.
contextBridge.exposeInMainWorld("tridevyatoeApp", {
  quit: () => ipcRenderer.send("tridevyatoe:quit"),
  cmsBase: () => ipcRenderer.sendSync("tridevyatoe:cms-base")
});
