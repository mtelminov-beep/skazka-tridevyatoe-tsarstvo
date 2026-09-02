import { sendData, sendFail } from "./httpEnvelope.js";
import { isCatalogKey } from "./catalogKeys.js";
import { persistStore, store } from "./store.js";

const MAX_PAYLOAD_BYTES = 6_000_000;

function iso() {
  return new Date().toISOString();
}

/** Список разделов с размерами и датами — сводка для админки. */
export function listCatalogs(req, res) {
  const items = Object.entries(store.catalogs).map(([key, entry]) => ({
    key,
    updated_at: entry.updated_at,
    bytes: JSON.stringify(entry.payload ?? null).length
  }));
  sendData(res, req, { items });
}

export function getCatalog(req, res) {
  const { key } = req.params;
  if (!isCatalogKey(key)) {
    sendFail(res, req, 404, "CATALOG_KEY_UNKNOWN", `Неизвестный раздел: ${key}`);
    return;
  }
  const entry = store.catalogs[key];
  if (!entry) {
    sendData(res, req, { key, payload: null, updated_at: null });
    return;
  }
  sendData(res, req, { key, payload: entry.payload, updated_at: entry.updated_at });
}

/**
 * Версия раздела, которую редактор видел перед правкой.
 * Пустая строка означает «раздела на сервере ещё не было»,
 * null — клиент версию не сообщил (пишем без проверки).
 */
function readExpectedUpdatedAt(req) {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  if ("expected_updated_at" in body) {
    const value = body.expected_updated_at;
    if (value === null) return "";
    if (typeof value === "string") return value;
  }
  const header = req.header("x-expected-updated-at");
  if (typeof header === "string" && header.length > 0) return header === "none" ? "" : header;
  return null;
}

export function putCatalog(req, res) {
  const { key } = req.params;
  if (!isCatalogKey(key)) {
    sendFail(res, req, 404, "CATALOG_KEY_UNKNOWN", `Неизвестный раздел: ${key}`);
    return;
  }
  const body = req.body && typeof req.body === "object" ? req.body : {};
  if (!("payload" in body)) {
    sendFail(res, req, 400, "PAYLOAD_REQUIRED", "Тело запроса должно содержать поле payload");
    return;
  }

  // Оптимистичная блокировка: не даём затереть правки другого редактора.
  const expected = readExpectedUpdatedAt(req);
  if (expected !== null) {
    const current = store.catalogs[key]?.updated_at ?? "";
    if (expected !== current) {
      res.setHeader("X-Current-Updated-At", current || "none");
      sendFail(
        res,
        req,
        409,
        "CATALOG_VERSION_CONFLICT",
        current
          ? `Раздел изменён другим редактором ${current}. Загрузите свежую версию с сервера и повторите правку.`
          : "Раздел на сервере отсутствует, хотя ваша копия ссылается на сохранённую версию. Загрузите раздел заново."
      );
      return;
    }
  }

  const serialized = JSON.stringify(body.payload);
  if (serialized.length > MAX_PAYLOAD_BYTES) {
    sendFail(res, req, 413, "PAYLOAD_TOO_LARGE", "Раздел слишком большой (лимит ~6 МБ)");
    return;
  }

  const updated_at = iso();
  store.catalogs[key] = { payload: body.payload, updated_at };
  persistStore();
  sendData(res, req, { key, updated_at });
}

export function deleteCatalog(req, res) {
  const { key } = req.params;
  if (!isCatalogKey(key)) {
    sendFail(res, req, 404, "CATALOG_KEY_UNKNOWN", `Неизвестный раздел: ${key}`);
    return;
  }
  delete store.catalogs[key];
  persistStore();
  sendData(res, req, { key, deleted: true });
}
