import { existsSync, mkdirSync, unlinkSync } from "node:fs";
import { extname, join, basename } from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";
import { MEDIA_DIR } from "./persistence.js";
import { sendData, sendFail } from "./httpEnvelope.js";
import { persistStore, store } from "./store.js";

const ALLOWED = new Map([
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
  [".avif", "image/avif"],
  [".gif", "image/gif"],
  [".svg", "image/svg+xml"],
  [".mp4", "video/mp4"],
  [".webm", "video/webm"],
  [".mp3", "audio/mpeg"],
  [".ogg", "audio/ogg"],
  [".m4a", "audio/mp4"]
]);

mkdirSync(MEDIA_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, MEDIA_DIR);
  },
  // Имя файла с диска, а не из браузера: кириллица и пробелы в путях ломают раздачу.
  filename(_req, file, cb) {
    const ext = extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 64 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const ext = extname(file.originalname).toLowerCase();
    if (!ALLOWED.has(ext)) {
      cb(new Error(`Недопустимый тип файла: ${ext || "без расширения"}`));
      return;
    }
    cb(null, true);
  }
});

export function uploadMedia(req, res) {
  if (!req.file) {
    sendFail(res, req, 400, "FILE_REQUIRED", "Файл не передан (поле file)");
    return;
  }
  const item = {
    id: basename(req.file.filename, extname(req.file.filename)),
    url: `/media/uploads/${req.file.filename}`,
    filename: req.file.filename,
    original_name: req.file.originalname,
    mime: ALLOWED.get(extname(req.file.filename).toLowerCase()) ?? req.file.mimetype,
    bytes: req.file.size,
    uploaded_at: new Date().toISOString()
  };
  store.media.unshift(item);
  persistStore();
  sendData(res, req, item);
}

export function listMedia(req, res) {
  sendData(res, req, { items: store.media });
}

export function deleteMedia(req, res) {
  const { id } = req.params;
  const index = store.media.findIndex((item) => item.id === id);
  if (index === -1) {
    sendFail(res, req, 404, "MEDIA_NOT_FOUND", `Файл ${id} не найден`);
    return;
  }
  const [item] = store.media.splice(index, 1);
  const path = join(MEDIA_DIR, basename(String(item.filename)));
  if (existsSync(path)) {
    try {
      unlinkSync(path);
    } catch (error) {
      console.error("[media] не удалось удалить файл:", error.message);
    }
  }
  persistStore();
  sendData(res, req, { id, deleted: true });
}
