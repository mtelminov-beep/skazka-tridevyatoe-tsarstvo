const { app, BrowserWindow, ipcMain, net, powerSaveBlocker, screen } = require("electron");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");

let kioskWindow;
let displaySleepBlockerId;
let cmsProcess;
let cmsHost = "0.0.0.0";
let cmsPort = 8803;

const LICENSE_APP_ID = "ru.tridevyatoe.skazki";
const LICENSE_CERTIFICATE = "MIIEGTCCAoGgAwIBAgIQU5BBcYW48LBOhiAJhi6pOTANBgkqhkiG9w0BAQsFADAvMS0wKwYDVQQDDCRUcmlkZXZ5YXRvZSBUc2Fyc3R2byBMaWNlbnNlIFNpZ25pbmcwHhcNMjYwOTIwMTEzODE0WhcNMjcwOTIwMTE1ODE0WjAvMS0wKwYDVQQDDCRUcmlkZXZ5YXRvZSBUc2Fyc3R2byBMaWNlbnNlIFNpZ25pbmcwggGiMA0GCSqGSIb3DQEBAQUAA4IBjwAwggGKAoIBgQDGqcFu9cu6rs8OXH8qx/F0XtXGOxq+4cLWGuLH3HV1eT7M8LeqBLZIM1ODGxQc7YuEIgi5f+NnI0bk8k8nh3C5ksxYqQn7xI4Tt7y+olqCqqT9w/DfyXVK3YpE075RbbVT+h4Ncpc9stb8vNmiLrNBzQPnJTFQYlvfVxGDR5G1RVZfmUgxCrdrTqnyZSe0hQtI8fd9pVYcytTTFlAoPRWvWVNoCBG6afQ6vfx9Q2PcfSB9Tsw5Ia23vDIQelchT3rbwV6EhTNVLAp/OWbz9/9089lQn90dWvf4FKx81yZZ6bvi85HISEvakaW5Sv4YllJiQEWtUhWEkrtPKCaYSP/Aldia5he2WtwFp0iJhG7NlIDjEKUjUhoYB8vXOHpPocnbY1JoS+y+5bGwSFajUxSlQ1AWXhPlI3gVgjQXYagxocGpRUWETFyCUcnNlIHaJM8gzF2R+DYGRivu8uMNxzctEK/CBNynO4GMR2x2/Yr5uXhCxu66Wi+ShmRyL3RzQJkCAwEAAaMxMC8wDgYDVR0PAQH/BAQDAgeAMB0GA1UdDgQWBBTJB9jyYQCMk0FKzoo3sG5FANWADzANBgkqhkiG9w0BAQsFAAOCAYEAWpkGd/U+DLmJIsAQoh9lHXNSEfGOrbejsey8unweDbBya4Fb66Mh/dLNYJXNou/te6t+y1AnI1+x9b7d3wgIptDYBhbKIeC6QvwD0hd69knlb+eccbY4Lekjg10AjUr4mFxW9s/ap1pg82sgIj72+V7OO0A0dQpixvWOmFy1I/uoJzLpc55bCiVFfsPSxelZFg6rb28bUR4hcksqfW/5NfYKQzGtglnGGDrl62p94w7OcYh7u363EoTvro1q87SeSh0/dIDjFpokwO+XRWAWujDxVlvl75AL7YGiBs3DsI8IVWg67A1+QIIU0GjE3thmQwMlzKqV/ULXNttPRls3Y+NbnmvQwJ7U3rriFgdPovoxBncNCDSnu1TlUDg2/ywdMQ+93m7pshJfC6y7weJKDlhqi51d7PmAVAEW6FO0Ca5W9FTkxHCijC1iz4dWmDReqFzRYTbcSi6BqvGMlKdMk1XyP0KQpEUN6HbIqyxdZUMNI5ZyjG0zDe72Iycf42Y+";

function windowsDeviceRequestId() {
  const identity = [LICENSE_APP_ID, process.platform, os.hostname(), os.userInfo().username].join("|");
  return crypto.createHash("sha256").update(identity, "utf8").digest("hex").toUpperCase();
}

function formatRequestCode(value) { return value.replace(/(.{5})(?!$)/g, "$1-"); }

function readLicense() {
  try { return fs.readFileSync(path.join(app.getPath("userData"), "license.json"), "utf8").trim(); } catch { return null; }
}

function licenseStatus(rawLicense = readLicense()) {
  const deviceRequestId = windowsDeviceRequestId();
  const base = { platform: "windows", appId: LICENSE_APP_ID, packageName: app.getName(), manufacturer: os.hostname(), model: "Windows", deviceRequestId, requestCode: formatRequestCode(deviceRequestId) };
  if (!rawLicense) return { ...base, licensePresent: false, licenseValid: false, needsActivation: true, reason: "license_required", licenseSummary: null };
  try {
    const license = JSON.parse(rawLicense);
    const payloadBytes = Buffer.from(String(license.payload).replace(/-/g, "+").replace(/_/g, "/"), "base64");
    const signature = Buffer.from(String(license.signature).replace(/-/g, "+").replace(/_/g, "/"), "base64");
    const certificate = new crypto.X509Certificate(Buffer.from(LICENSE_CERTIFICATE, "base64"));
    if (!crypto.verify("RSA-SHA256", payloadBytes, certificate.publicKey, signature)) throw new Error("invalid_signature");
    const payload = JSON.parse(payloadBytes.toString("utf8"));
    if (payload.appId !== LICENSE_APP_ID) throw new Error("app_mismatch");
    if (String(payload.deviceRequestId).toUpperCase() !== deviceRequestId) throw new Error("device_mismatch");
    if (payload.version !== 1) throw new Error("version_mismatch");
    if (payload.expiresAt && Number.isFinite(Date.parse(payload.expiresAt)) && Date.now() > Date.parse(payload.expiresAt)) throw new Error("expired");
    return { ...base, licensePresent: true, licenseValid: true, needsActivation: false, reason: "active", licenseSummary: { customer: payload.customer ?? "Библиотека", issuedAt: payload.issuedAt ?? "", expiresAt: payload.expiresAt ?? null, features: Array.isArray(payload.features) ? payload.features : [] } };
  } catch (error) {
    return { ...base, licensePresent: true, licenseValid: false, needsActivation: true, reason: error instanceof Error ? error.message : "invalid_license", licenseSummary: null };
  }
}

function syncMissingMedia(source, target) {
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(to, { recursive: true });
      syncMissingMedia(from, to);
    } else if (entry.isFile() && (!fs.existsSync(to) || fs.statSync(from).size !== fs.statSync(to).size)) {
      fs.copyFileSync(from, to);
    }
  }
}

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
  const genericContentMarker = path.join(dataRoot, "generic-content-v1.json");

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
  // При обновлении добавляем отсутствующие или повреждённые файлы, не трогая свои загрузки.
  if (fs.existsSync(sourceUploads)) { fs.mkdirSync(targetUploads, { recursive: true }); syncMissingMedia(sourceUploads, targetUploads); }
  if (!fs.existsSync(seedMarker)) fs.writeFileSync(seedMarker, '{"version":1}\n', "utf8");
  // До универсальной сборки эти два каталога содержали сведения конкретного
  // учреждения. Убираем их один раз и позволяем фронтенду показать новые шаблоны.
  if (!fs.existsSync(genericContentMarker) && fs.existsSync(targetState)) {
    try {
      const state = JSON.parse(fs.readFileSync(targetState, "utf8"));
      delete state?.catalogs?.["skazka-library-v1"];
      delete state?.catalogs?.["skazka-calendar-v1"];
      fs.writeFileSync(targetState, `${JSON.stringify(state, null, 2)}\n`, "utf8");
    } catch {
      // Повреждённое состояние штатно обработает CMS при запуске.
    }
    fs.writeFileSync(genericContentMarker, '{"version":1}\n', "utf8");
  }
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
ipcMain.handle("tridevyatoe:license-status", () => licenseStatus());
ipcMain.handle("tridevyatoe:license-activate", (_event, rawLicense) => {
  const status = licenseStatus(typeof rawLicense === "string" ? rawLicense.trim() : "");
  if (!status.licenseValid) throw new Error(status.reason);
  fs.writeFileSync(path.join(app.getPath("userData"), "license.json"), rawLicense.trim(), "utf8");
  return { status };
});
app.on("window-all-closed", () => app.quit());
app.on("will-quit", () => {
  if (cmsProcess && !cmsProcess.killed) cmsProcess.kill();
  if (displaySleepBlockerId && powerSaveBlocker.isStarted(displaySleepBlockerId)) powerSaveBlocker.stop(displaySleepBlockerId);
});
