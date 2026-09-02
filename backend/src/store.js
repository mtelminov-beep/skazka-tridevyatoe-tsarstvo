import { loadCmsJson, saveCmsJson } from "./persistence.js";

/**
 * @typedef {{ payload: unknown, updated_at: string }} CatalogEntry
 * @typedef {{ catalogs: Record<string, CatalogEntry>, media: Array<Record<string, unknown>>, stats: Record<string, number> }} StoreShape
 */

/** @type {StoreShape} */
export const store = {
  catalogs: {},
  media: [],
  stats: {}
};

const persisted = loadCmsJson();
if (persisted && typeof persisted === "object") {
  const snapshot = /** @type {Partial<StoreShape>} */ (persisted);
  if (snapshot.catalogs && typeof snapshot.catalogs === "object") store.catalogs = snapshot.catalogs;
  if (Array.isArray(snapshot.media)) store.media = snapshot.media;
  if (snapshot.stats && typeof snapshot.stats === "object") store.stats = snapshot.stats;
}

let pending = false;

/** Отложенная запись — несколько правок подряд складываются в один файловый вызов. */
export function persistStore() {
  if (pending) return;
  pending = true;
  setTimeout(() => {
    pending = false;
    try {
      saveCmsJson({ catalogs: store.catalogs, media: store.media, stats: store.stats });
    } catch (error) {
      console.error("[cms] не удалось сохранить состояние:", error.message);
    }
  }, 50);
}

/** Полная замена состояния нужна при восстановлении резервной копии. */
export function replaceStore(snapshot) {
  store.catalogs = snapshot.catalogs && typeof snapshot.catalogs === "object" ? snapshot.catalogs : {};
  store.media = Array.isArray(snapshot.media) ? snapshot.media : [];
  store.stats = snapshot.stats && typeof snapshot.stats === "object" ? snapshot.stats : {};
  saveCmsJson({ catalogs: store.catalogs, media: store.media, stats: store.stats });
}
