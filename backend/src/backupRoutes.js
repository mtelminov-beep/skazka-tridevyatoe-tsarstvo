import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import JSZip from "jszip";
import multer from "multer";
import { MEDIA_DIR } from "./persistence.js";
import { sendData, sendFail } from "./httpEnvelope.js";
import { replaceStore, store } from "./store.js";

const BACKUP_FORMAT = "skazka-cms-backup";
const BACKUP_VERSION = 1;
const MAX_BACKUP_BYTES = 512 * 1024 * 1024;

export const backupUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BACKUP_BYTES },
  fileFilter(_req, file, cb) {
    const ext = extname(file.originalname).toLowerCase();
    if (ext !== ".zip") {
      cb(new Error("Резервная копия должна быть ZIP-файлом"));
      return;
    }
    cb(null, true);
  }
});

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function snapshotStore() {
  return JSON.parse(JSON.stringify({ catalogs: store.catalogs, media: store.media, stats: store.stats }));
}

function listStoredMediaFiles() {
  mkdirSync(MEDIA_DIR, { recursive: true });
  const root = resolve(MEDIA_DIR);
  return readdirSync(root)
    .filter((name) => name !== ".gitkeep")
    .map((name) => {
      const absolute = resolve(root, name);
      if (!absolute.startsWith(root) || !statSync(absolute).isFile()) return null;
      return { name, absolute };
    })
    .filter(Boolean);
}

export async function exportBackup(req, res) {
  const files = listStoredMediaFiles();
  const zip = new JSZip();
  const created_at = new Date().toISOString();
  const snapshot = snapshotStore();

  zip.file(
    "manifest.json",
    JSON.stringify(
      {
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        created_at,
        catalogs: Object.keys(snapshot.catalogs).length,
        media_records: snapshot.media.length,
        media_files: files.map((file) => file.name)
      },
      null,
      2
    )
  );
  zip.file("cms-state.json", JSON.stringify(snapshot, null, 2));

  for (const file of files) {
    zip.file(`media/uploads/${file.name}`, readFileSync(file.absolute));
  }

  const archive = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="skazka-cms-backup-${stamp()}.zip"`);
  res.setHeader("Content-Length", archive.length);
  res.send(archive);
}

function readBackupState(zip) {
  const manifestFile = zip.file("manifest.json");
  const stateFile = zip.file("cms-state.json");
  if (!manifestFile || !stateFile) {
    throw new Error("В архиве нет manifest.json или cms-state.json");
  }
  return Promise.all([manifestFile.async("string"), stateFile.async("string")]).then(([manifestRaw, stateRaw]) => {
    const manifest = JSON.parse(manifestRaw);
    if (manifest?.format !== BACKUP_FORMAT || manifest?.version !== BACKUP_VERSION) {
      throw new Error("Неподдерживаемый формат резервной копии");
    }
    const snapshot = JSON.parse(stateRaw);
    if (!snapshot || typeof snapshot !== "object") {
      throw new Error("cms-state.json должен содержать объект");
    }
    return { manifest, snapshot };
  });
}

async function restoreMediaFiles(zip) {
  const root = resolve(MEDIA_DIR);
  rmSync(root, { recursive: true, force: true });
  mkdirSync(root, { recursive: true });
  writeFileSync(join(root, ".gitkeep"), "");

  const entries = Object.values(zip.files).filter((entry) => !entry.dir && entry.name.startsWith("media/uploads/"));
  for (const entry of entries) {
    const filename = basename(entry.name);
    if (!filename || filename === ".gitkeep") continue;
    const target = resolve(root, filename);
    if (!target.startsWith(root)) continue;
    writeFileSync(target, await entry.async("nodebuffer"));
  }
  return entries.length;
}

export async function importBackup(req, res) {
  if (!req.file?.buffer) {
    sendFail(res, req, 400, "BACKUP_REQUIRED", "Файл резервной копии не передан (поле backup)");
    return;
  }

  try {
    const zip = await JSZip.loadAsync(req.file.buffer);
    const { manifest, snapshot } = await readBackupState(zip);
    const restoredFiles = await restoreMediaFiles(zip);
    replaceStore(snapshot);
    sendData(res, req, {
      imported: true,
      created_at: manifest.created_at ?? null,
      catalogs: Object.keys(store.catalogs).length,
      media_records: store.media.length,
      media_files: restoredFiles
    });
  } catch (error) {
    sendFail(res, req, 400, "BACKUP_INVALID", error instanceof Error ? error.message : "Не удалось импортировать архив");
  }
}
