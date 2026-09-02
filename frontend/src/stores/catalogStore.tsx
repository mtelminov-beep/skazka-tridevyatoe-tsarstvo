import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { CATALOG_KEYS, catalogDefaults } from "../data/defaults";
import type { CatalogKey, CatalogMap } from "../types";
import { fetchPublicCatalog } from "./cmsClient";

const STORAGE_PREFIX = "skazka-catalog-v1-";

/** Версия раздела на сервере: строка, null (раздела нет) или отсутствие ключа (сервер ещё не читали). */
type CatalogVersions = Partial<Record<CatalogKey, string | null>>;

type CatalogContextValue = {
  catalogs: CatalogMap;
  versions: CatalogVersions;
  loading: boolean;
  online: boolean;
  refresh: () => Promise<void>;
  /** Локальная правка в админке — сразу видна на панели, но ещё не опубликована. */
  saveLocal: <K extends CatalogKey>(key: K, payload: CatalogMap[K]) => void;
  /** Откатить локальную копию к эталонному контенту. */
  resetLocal: (key: CatalogKey) => void;
  setVersion: (key: CatalogKey, updatedAt: string | null) => void;
};

function loadLocal<K extends CatalogKey>(key: K): CatalogMap[K] {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (raw) return JSON.parse(raw) as CatalogMap[K];
  } catch {
    /* повреждённая запись — берём эталон */
  }
  return catalogDefaults[key];
}

function buildInitialState(): CatalogMap {
  const state = {} as CatalogMap;
  for (const key of CATALOG_KEYS) {
    (state as Record<string, unknown>)[key] = loadLocal(key);
  }
  return state;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [catalogs, setCatalogs] = useState<CatalogMap>(buildInitialState);
  const [versions, setVersions] = useState<CatalogVersions>({});
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    let reachedServer = false;

    const entries = await Promise.all(
      CATALOG_KEYS.map(async (key) => {
        try {
          const remote = await fetchPublicCatalog<CatalogMap[typeof key]>(key);
          reachedServer = true;
          return [key, remote] as const;
        } catch {
          return null;
        }
      })
    );

    setCatalogs((previous) => {
      const next = { ...previous };
      for (const entry of entries) {
        if (!entry) continue;
        const [key, remote] = entry;
        // Пустой payload означает «раздел ещё не публиковали» — оставляем эталон.
        if (!remote.payload) continue;
        (next as Record<string, unknown>)[key] = remote.payload;
        try {
          localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(remote.payload));
        } catch {
          /* переполнено хранилище — панель всё равно работает из памяти */
        }
      }
      return next;
    });

    // Версию запоминаем всегда, в том числе null: админке нужно знать,
    // что раздела на сервере нет, иначе первая публикация пройдёт без проверки конфликта.
    setVersions((previous) => {
      const next = { ...previous };
      for (const entry of entries) {
        if (!entry) continue;
        next[entry[0]] = entry[1].updated_at;
      }
      return next;
    });

    setOnline(reachedServer);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveLocal = useCallback(<K extends CatalogKey>(key: K, payload: CatalogMap[K]) => {
    setCatalogs((previous) => ({ ...previous, [key]: payload }));
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(payload));
    } catch {
      /* правка живёт в памяти до перезагрузки */
    }
  }, []);

  const resetLocal = useCallback((key: CatalogKey) => {
    setCatalogs((previous) => ({ ...previous, [key]: catalogDefaults[key] }));
    try {
      localStorage.removeItem(STORAGE_PREFIX + key);
    } catch {
      /* ignore */
    }
  }, []);

  const setVersion = useCallback((key: CatalogKey, updatedAt: string | null) => {
    setVersions((previous) => ({ ...previous, [key]: updatedAt }));
  }, []);

  const value = useMemo<CatalogContextValue>(
    () => ({ catalogs, versions, loading, online, refresh, saveLocal, resetLocal, setVersion }),
    [catalogs, versions, loading, online, refresh, saveLocal, resetLocal, setVersion]
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalogs(): CatalogContextValue {
  const context = useContext(CatalogContext);
  if (!context) throw new Error("useCatalogs должен вызываться внутри CatalogProvider");
  return context;
}

/** Удобный доступ к одному разделу. */
export function useCatalog<K extends CatalogKey>(key: K): CatalogMap[K] {
  return useCatalogs().catalogs[key];
}
