import express from "express";
import { existsSync } from "node:fs";
import { networkInterfaces } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { backupUpload, exportBackup, importBackup } from "./backupRoutes.js";
import { CATALOG_KEYS } from "./catalogKeys.js";
import { deleteCatalog, getCatalog, listCatalogs, putCatalog } from "./catalogRoutes.js";
import { sendData, sendFail } from "./httpEnvelope.js";
import { deleteMedia, listMedia, upload, uploadMedia } from "./mediaRoutes.js";
import { MEDIA_DIR } from "./persistence.js";
import { getCmsSession, loginCms, logoutCms, requireCmsAuth } from "./security.js";
import { persistStore, store } from "./store.js";

const here = dirname(fileURLToPath(import.meta.url));

function listLocalNetworkAddresses(host, port) {
  if (host === "127.0.0.1" || host === "localhost") {
    return [{ host: "127.0.0.1", url: `http://127.0.0.1:${port}` }];
  }

  return Object.values(networkInterfaces())
    .flat()
    .filter((item) => item && item.family === "IPv4" && !item.internal)
    .map((item) => ({ host: item.address, url: `http://${item.address}:${port}` }));
}

export function createCmsApp(options = {}) {
  const port = Number(options.port || process.env.PORT || 8803);
  const host = options.host || process.env.HOST || "0.0.0.0";
  const frontendDist = options.frontendDist || join(here, "..", "..", "frontend", "dist");
  const app = express();

  app.use(express.json({ limit: "8mb" }));

  // Панель и админка обычно на одном устройстве, но в dev фронт живёт на другом порту.
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*");
    res.header("Access-Control-Allow-Headers", "Content-Type, X-CMS-Session, X-CMS-Token, X-Expected-Updated-At");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
    res.header("Access-Control-Expose-Headers", "X-Current-Updated-At, Content-Disposition");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.get("/health", (req, res) => {
    sendData(res, req, {
      status: "ok",
      catalogs: Object.keys(store.catalogs).length,
      media: store.media.length,
      protected: true,
      listen: { host, port, local_urls: listLocalNetworkAddresses(host, port) },
      auth: { login: true, legacy_token: Boolean(process.env.CMS_TOKEN) }
    });
  });

  // --- Публичное чтение: интерактивная панель ходит сюда без авторизации ---
  app.get("/public/catalogs", listCatalogs);
  app.get("/public/catalogs/:key", getCatalog);

  /** Счётчик событий панели — простая аналитика посещаемости для библиотекаря. */
  app.post("/public/stats/:key", (req, res) => {
    const { key } = req.params;
    if (!/^[a-z0-9:_-]{1,64}$/.test(key)) {
      sendFail(res, req, 400, "BAD_KEY", "Некорректный ключ события");
      return;
    }
    store.stats[key] = (store.stats[key] ?? 0) + 1;
    persistStore();
    sendData(res, req, { key, count: store.stats[key] });
  });

  // --- CMS: доступ после входа по логину и паролю ---
  app.post("/cms/auth/login", loginCms);
  app.get("/cms/auth/session", requireCmsAuth, getCmsSession);
  app.post("/cms/auth/logout", logoutCms);

  app.get("/cms/keys", requireCmsAuth, (req, res) => sendData(res, req, { keys: CATALOG_KEYS }));
  app.get("/cms/catalogs", requireCmsAuth, listCatalogs);
  app.get("/cms/catalogs/:key", requireCmsAuth, getCatalog);
  app.put("/cms/catalogs/:key", requireCmsAuth, putCatalog);
  app.delete("/cms/catalogs/:key", requireCmsAuth, deleteCatalog);

  app.get("/cms/stats", requireCmsAuth, (req, res) => sendData(res, req, { stats: store.stats }));
  app.delete("/cms/stats", requireCmsAuth, (req, res) => {
    store.stats = {};
    persistStore();
    sendData(res, req, { cleared: true });
  });

  app.get("/cms/media", requireCmsAuth, listMedia);
  app.post("/cms/media", requireCmsAuth, upload.single("file"), uploadMedia);
  app.delete("/cms/media/:id", requireCmsAuth, deleteMedia);
  app.get("/cms/backup", requireCmsAuth, exportBackup);
  app.post("/cms/backup/import", requireCmsAuth, backupUpload.single("backup"), importBackup);

  app.use("/media/uploads", express.static(MEDIA_DIR, { maxAge: "7d" }));

  // --- Production: раздаём собранный фронт с того же порта ---
  if (existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/cms") || req.path.startsWith("/public") || req.path.startsWith("/media/uploads")) {
        next();
        return;
      }
      res.sendFile(join(frontendDist, "index.html"));
    });
  }

  // eslint-disable-next-line no-unused-vars -- express опознаёт обработчик ошибок по числу аргументов
  app.use((error, req, res, _next) => {
    // Отказы загрузки — вина запроса, а не сервера: отвечаем 4xx с понятным кодом,
    // иначе админка показывает «внутренняя ошибка» вместо причины.
    if (error?.code === "LIMIT_FILE_SIZE") {
      sendFail(res, req, 413, "FILE_TOO_LARGE", "Файл больше 64 МБ");
      return;
    }
    if (typeof error?.message === "string" && error.message.startsWith("Недопустимый тип файла")) {
      sendFail(res, req, 415, "FILE_TYPE_NOT_ALLOWED", error.message);
      return;
    }
    if (typeof error?.message === "string" && error.message.startsWith("Резервная копия")) {
      sendFail(res, req, 415, "BACKUP_TYPE_NOT_ALLOWED", error.message);
      return;
    }
    console.error("[api]", error);
    sendFail(res, req, 500, "INTERNAL", error?.message || "Внутренняя ошибка сервера");
  });

  return app;
}
