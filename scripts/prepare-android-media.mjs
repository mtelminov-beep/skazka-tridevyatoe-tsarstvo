import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const source = resolve("media", "uploads");
const destination = resolve("frontend", "public", "media", "uploads");

if (!existsSync(source)) {
  console.warn("Каталог загруженных материалов не найден — сборка продолжена без него.");
  process.exit(0);
}

mkdirSync(destination, { recursive: true });
cpSync(source, destination, { recursive: true, force: true });
console.log("Загруженные материалы подготовлены для автономного APK.");
