import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

// В настольной сборке эти параметры хранятся рядом с данными CMS, а не внутри
// установленной программы: обновление приложения не сбрасывает адрес админки.
export const DEFAULT_NETWORK_SETTINGS = Object.freeze({ host: "0.0.0.0", port: 8803 });

function validPort(value) {
  return Number.isInteger(value) && value >= 1 && value <= 65535;
}

function validHost(value) {
  if (value === "0.0.0.0" || value === "127.0.0.1") return true;
  const parts = value.split(".");
  return parts.length === 4 && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}

export function readNetworkSettings(configPath) {
  if (!configPath || !existsSync(configPath)) return { ...DEFAULT_NETWORK_SETTINGS };
  try {
    const value = JSON.parse(readFileSync(configPath, "utf8"));
    if (validHost(value?.host) && validPort(value?.port)) return { host: value.host, port: value.port };
  } catch {
    // Повреждённый файл не должен мешать панели стартовать с безопасными настройками.
  }
  return { ...DEFAULT_NETWORK_SETTINGS };
}

export function validateNetworkSettings(value) {
  const host = typeof value?.host === "string" ? value.host.trim() : "";
  const port = typeof value?.port === "number" ? value.port : Number(value?.port);
  if (!validHost(host)) throw new Error("Укажите IPv4-адрес, 0.0.0.0 или 127.0.0.1");
  if (!validPort(port)) throw new Error("Порт должен быть целым числом от 1 до 65535");
  return { host, port };
}

export function writeNetworkSettings(configPath, settings) {
  if (!configPath) throw new Error("Файл настроек сети не задан");
  mkdirSync(dirname(configPath), { recursive: true });
  const temporaryFile = `${configPath}.${process.pid}.tmp`;
  writeFileSync(temporaryFile, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
  renameSync(temporaryFile, configPath);
}
