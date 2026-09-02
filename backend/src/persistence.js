import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const defaultFile = join(here, "..", "data", "cms-state.json");

export const DATA_FILE = process.env.CMS_DATA_PATH || defaultFile;
export const MEDIA_DIR = process.env.MEDIA_DIR || join(here, "..", "..", "media", "uploads");

/** @returns {unknown | null} */
export function loadCmsJson() {
  if (!existsSync(DATA_FILE)) return null;
  try {
    return JSON.parse(readFileSync(DATA_FILE, "utf8"));
  } catch (error) {
    console.error("[cms] повреждённый cms-state.json, стартуем с пустым состоянием:", error.message);
    return null;
  }
}

/** Атомарная запись: сначала временный файл, затем rename — панель не увидит «половину» файла. */
export function saveCmsJson(data) {
  mkdirSync(dirname(DATA_FILE), { recursive: true });
  const temporaryFile = `${DATA_FILE}.${process.pid}.tmp`;
  writeFileSync(temporaryFile, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  renameSync(temporaryFile, DATA_FILE);
}
