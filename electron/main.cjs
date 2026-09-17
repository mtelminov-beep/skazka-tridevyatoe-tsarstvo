const { app, BrowserWindow, ipcMain, net, powerSaveBlocker, protocol, screen } = require("electron");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

let kioskWindow;
let displaySleepBlockerId;
let cmsProcess;
let cmsPort = 8803;

function getSavedCmsPort(dataRoot) {
  try {
    const saved = JSON.parse(fs.readFileSync(path.join(dataRoot, "network.json"), "utf8"));
    const port = Number(saved?.port);
    return Number.isInteger(port) && port >= 1 && port <= 65535 ? port : 8803;
  } catch {
    return 8803;
  }
}

function startCmsServer(settings = {}) {
  const dataRoot = path.join(app.getPath("userData"), "cms");
  const serverEntry = path.join(__dirname, "..", "backend", "src", "server.js");
  const webRoot = path.join(__dirname, "..", "frontend", "dist-desktop");
  cmsPort = Number(settings.port) || getSavedCmsPort(dataRoot);
  cmsProcess = spawn(process.execPath, [serverEntry], {
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      CMS_DATA_PATH: path.join(dataRoot, "cms-state.json"),
      MEDIA_DIR: path.join(dataRoot, "uploads"),
      CMS_NETWORK_CONFIG_PATH: path.join(dataRoot, "network.json"),
      CMS_FRONTEND_DIST: webRoot
    },
    stdio: ["ignore", "pipe", "pipe", "ipc"],
    windowsHide: true
  });
  cmsProcess.stdout.on("data", (data) => console.log(`[cms] ${data}`));
  cmsProcess.stderr.on("data", (data) => console.error(`[cms] ${data}`));
  cmsProcess.on("message", (message) => {
    if (message?.type === "cms-network-change") restartCmsServer(message.settings);
  });
  cmsProcess.on("error", (error) => console.error("Не удалось запустить CMS:", error));
}

function restartCmsServer(settings) {
  const previous = cmsProcess;
  if (previous && !previous.killed) previous.once("exit", () => startCmsServer(settings));
  if (previous && !previous.killed) previous.kill();
  else startCmsServer(settings);
}

protocol.registerSchemesAsPrivileged([
  { scheme: "tridevyatoe", privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }
]);

function registerLocalContentProtocol() {
  const webRoot = path.join(__dirname, "..", "frontend", "dist-desktop");
  const indexFile = path.join(webRoot, "index.html");
  const rootPrefix = `${webRoot}${path.sep}`;
  protocol.handle("tridevyatoe", (request) => {
    const url = new URL(request.url);
    const requestedPath = decodeURIComponent(url.pathname).replace(/^[/\\]+/, "");
    const candidate = path.resolve(webRoot, requestedPath || "index.html");
    const isLocalFile = candidate === webRoot || candidate.startsWith(rootPrefix);
    const target = isLocalFile && fs.existsSync(candidate) && fs.statSync(candidate).isFile() ? candidate : indexFile;
    return net.fetch(pathToFileURL(target).toString());
  });
}

function createKioskWindow() {
  const { x, y, width, height } = screen.getPrimaryDisplay().bounds;
  kioskWindow = new BrowserWindow({
    x, y, width, height, backgroundColor: "#06031a", fullscreen: true, kiosk: true, frame: false, autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, preload: path.join(__dirname, "preload.cjs") }
  });
  kioskWindow.loadURL("tridevyatoe://app/index.html");
}

app.whenReady().then(() => {
  registerLocalContentProtocol();
  startCmsServer();
  displaySleepBlockerId = powerSaveBlocker.start("prevent-display-sleep");
  createKioskWindow();
});

ipcMain.on("tridevyatoe:quit", () => app.quit());
ipcMain.on("tridevyatoe:cms-base", (event) => { event.returnValue = `http://127.0.0.1:${cmsPort}`; });
app.on("window-all-closed", () => app.quit());
app.on("will-quit", () => {
  if (cmsProcess && !cmsProcess.killed) cmsProcess.kill();
  if (displaySleepBlockerId && powerSaveBlocker.isStarted(displaySleepBlockerId)) powerSaveBlocker.stop(displaySleepBlockerId);
});
