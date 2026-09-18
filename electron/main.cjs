const { app, BrowserWindow, ipcMain, net, powerSaveBlocker, screen } = require("electron");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

let kioskWindow;
let displaySleepBlockerId;
let cmsProcess;
let cmsHost = "0.0.0.0";
let cmsPort = 8803;

function getSavedNetworkSettings(dataRoot) {
  try {
    const saved = JSON.parse(fs.readFileSync(path.join(dataRoot, "network.json"), "utf8"));
    const port = Number(saved?.port);
    const host = typeof saved?.host === "string" ? saved.host : "0.0.0.0";
    if (Number.isInteger(port) && port >= 1 && port <= 65535) return { host, port };
  } catch {
    // Первый запуск использует безопасные настройки по умолчанию.
  }
  return { host: "0.0.0.0", port: 8803 };
}

function seedCmsData(dataRoot) {
  const packageRoot = path.join(__dirname, "..");
  const sourceState = path.join(packageRoot, "backend", "data", "cms-state.json");
  const sourceUploads = path.join(packageRoot, "media", "uploads");
  const targetState = path.join(dataRoot, "cms-state.json");
  const targetUploads = path.join(dataRoot, "uploads");
  const seedMarker = path.join(dataRoot, "seeded-v1.json");

  fs.mkdirSync(dataRoot, { recursive: true });
  // Новая установка начинает с подготовленного библиотекой контента. Существующее
  // состояние не перезаписываем: это защищает публикации и восстановленные копии.
  let emptyLegacyState = false;
  if (fs.existsSync(targetState) && !fs.existsSync(seedMarker)) {
    try {
      const saved = JSON.parse(fs.readFileSync(targetState, "utf8"));
      emptyLegacyState = Object.keys(saved?.catalogs ?? {}).length === 0 && (saved?.media?.length ?? 0) === 0;
    } catch {
      emptyLegacyState = true;
    }
  }
  // Версии до 1.16.1 могли создать пустой файл CMS. Миграция срабатывает только
  // один раз и возвращает опубликованные разделы, не затрагивая живую базу.
  if ((!fs.existsSync(targetState) || emptyLegacyState) && fs.existsSync(sourceState)) fs.copyFileSync(sourceState, targetState);
  // При обновлении добавляем только отсутствующие файлы — свои загрузки не затираем.
  if (fs.existsSync(sourceUploads)) fs.cpSync(sourceUploads, targetUploads, { recursive: true, force: false, errorOnExist: false });
  if (!fs.existsSync(seedMarker)) fs.writeFileSync(seedMarker, '{"version":1}\n', "utf8");
}

function cmsUrl() {
  // 0.0.0.0 — адрес прослушивания, но не адрес назначения в браузере.
  const host = cmsHost === "0.0.0.0" ? "127.0.0.1" : cmsHost;
  return `http://${host}:${cmsPort}`;
}

function startCmsServer(settings = {}) {
  const dataRoot = path.join(app.getPath("userData"), "cms");
  const network = { ...getSavedNetworkSettings(dataRoot), ...settings };
  const serverEntry = path.join(__dirname, "..", "backend", "src", "server.js");
  const webRoot = path.join(__dirname, "..", "frontend", "dist-desktop");
  seedCmsData(dataRoot);
  cmsHost = network.host;
  cmsPort = network.port;
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

async function loadKioskContent() {
  const target = `${cmsUrl()}/`;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await net.fetch(`${cmsUrl()}/health`);
      if (response.ok) {
        await kioskWindow?.loadURL(target);
        return;
      }
    } catch {
      // Сервер запускается отдельным процессом; коротко ждём его готовности.
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  kioskWindow?.loadURL(target).catch((error) => console.error("Не удалось открыть панель:", error));
}

function restartCmsServer(settings) {
  const previous = cmsProcess;
  const start = () => {
    startCmsServer(settings);
    void loadKioskContent();
  };
  if (previous && !previous.killed) previous.once("exit", start);
  if (previous && !previous.killed) previous.kill();
  else start();
}

function createKioskWindow() {
  const { x, y, width, height } = screen.getPrimaryDisplay().bounds;
  kioskWindow = new BrowserWindow({
    x, y, width, height, backgroundColor: "#06031a", fullscreen: true, kiosk: true, frame: false, autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, preload: path.join(__dirname, "preload.cjs") }
  });
}

app.whenReady().then(() => {
  startCmsServer();
  displaySleepBlockerId = powerSaveBlocker.start("prevent-display-sleep");
  createKioskWindow();
  void loadKioskContent();
});

ipcMain.on("tridevyatoe:quit", () => app.quit());
ipcMain.on("tridevyatoe:cms-base", (event) => { event.returnValue = cmsUrl(); });
app.on("window-all-closed", () => app.quit());
app.on("will-quit", () => {
  if (cmsProcess && !cmsProcess.killed) cmsProcess.kill();
  if (displaySleepBlockerId && powerSaveBlocker.isStarted(displaySleepBlockerId)) powerSaveBlocker.stop(displaySleepBlockerId);
});
