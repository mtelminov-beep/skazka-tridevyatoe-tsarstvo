import type { CatalogKey } from "../types";

/**
 * Клиент CMS. Панель читает контент без авторизации через /public,
 * админка ходит в /cms с сессионным токеном.
 *
 * Адрес API по умолчанию пустой — значит «тот же origin». В зале панель
 * и сервер живут на одной машине; поле «адрес сервера» в админке нужно
 * на случай, когда контент правят с ноутбука библиотекаря по сети.
 */

const DEFAULT_API_BASE = import.meta.env.VITE_API_BASE ?? "";
const API_BASE_STORAGE_KEY = "skazka-cms-api-base";
const TOKEN_STORAGE_KEY = "skazka-cms-token";
const SESSION_STORAGE_KEY = "skazka-cms-session";

export type CatalogResponse<T> = {
  key: CatalogKey;
  payload: T | null;
  updated_at: string | null;
};

export type MediaItemDto = {
  id: string;
  url: string;
  filename: string;
  original_name: string;
  mime: string;
  bytes: number;
  uploaded_at: string;
};

export type CmsSession = {
  username: string;
  token?: string;
  expires_at: string;
};

export type CmsHealth = {
  status: string;
  catalogs: number;
  media: number;
  protected: boolean;
  listen?: { host: string; port: number; local_urls: Array<{ host: string; url: string }> };
  auth?: { login: boolean; legacy_token: boolean };
};

export type CmsBackupImportResult = {
  imported: boolean;
  created_at: string | null;
  catalogs: number;
  media_records: number;
  media_files: number;
};

function normalizeApiBase(value: string): string {
  const raw = value.trim().replace(/\/+$/, "");
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `http://${raw}`;
}

export function getCmsApiBase(): string {
  try {
    return localStorage.getItem(API_BASE_STORAGE_KEY) ?? DEFAULT_API_BASE;
  } catch {
    return DEFAULT_API_BASE;
  }
}

export function setCmsApiBase(value: string): string {
  const normalized = normalizeApiBase(value);
  try {
    if (normalized && normalized !== DEFAULT_API_BASE) localStorage.setItem(API_BASE_STORAGE_KEY, normalized);
    else localStorage.removeItem(API_BASE_STORAGE_KEY);
  } catch {
    /* приватный режим браузера — работаем без сохранения */
  }
  return normalized;
}

function apiUrl(path: string, base = getCmsApiBase()): string {
  return `${base}${path}`;
}

export function getCmsToken(): string {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function getCmsSessionToken(): string {
  try {
    return localStorage.getItem(SESSION_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setCmsSessionToken(token: string): void {
  try {
    if (token) localStorage.setItem(SESSION_STORAGE_KEY, token);
    else localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    /* приватный режим браузера — работаем без сохранения */
  }
}

function cmsHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  const session = getCmsSessionToken();
  if (session) headers["X-CMS-Session"] = session;
  const token = getCmsToken();
  if (token) headers["X-CMS-Token"] = token;
  return headers;
}

async function unwrap<T>(response: Response): Promise<T> {
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const message = body?.error?.message ?? `Ошибка ${response.status}`;
    const error = new Error(message) as Error & { code?: string; status?: number };
    error.code = body?.error?.code;
    error.status = response.status;
    throw error;
  }
  return body.data as T;
}

/* ------------------------------- Авторизация ------------------------------ */

export async function loginCms(username: string, password: string): Promise<CmsSession> {
  const response = await fetch(apiUrl("/cms/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const session = await unwrap<CmsSession>(response);
  if (session.token) setCmsSessionToken(session.token);
  return session;
}

export async function fetchCmsSession(): Promise<CmsSession> {
  const response = await fetch(apiUrl("/cms/auth/session"), { headers: cmsHeaders() });
  return unwrap<CmsSession>(response);
}

export async function logoutCms(): Promise<void> {
  const response = await fetch(apiUrl("/cms/auth/logout"), { method: "POST", headers: cmsHeaders() });
  setCmsSessionToken("");
  await unwrap(response);
}

/* --------------------------------- Разделы -------------------------------- */

/** Чтение раздела панелью — без авторизации. */
export async function fetchPublicCatalog<T>(key: CatalogKey): Promise<CatalogResponse<T>> {
  const response = await fetch(apiUrl(`/public/catalogs/${key}`));
  return unwrap<CatalogResponse<T>>(response);
}

/**
 * Публикация раздела. expectedUpdatedAt — версия, которую редактор видел
 * перед правкой; сервер отклонит запись, если раздел успел измениться.
 */
export async function publishCatalog<T>(
  key: CatalogKey,
  payload: T,
  expectedUpdatedAt: string | null
): Promise<{ key: CatalogKey; updated_at: string }> {
  const response = await fetch(apiUrl(`/cms/catalogs/${key}`), {
    method: "PUT",
    headers: cmsHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ payload, expected_updated_at: expectedUpdatedAt })
  });
  return unwrap<{ key: CatalogKey; updated_at: string }>(response);
}

export async function resetCatalog(key: CatalogKey): Promise<void> {
  const response = await fetch(apiUrl(`/cms/catalogs/${key}`), { method: "DELETE", headers: cmsHeaders() });
  await unwrap(response);
}

/* --------------------------------- Медиа --------------------------------- */

export async function listMedia(): Promise<{ items: MediaItemDto[] }> {
  const response = await fetch(apiUrl("/cms/media"), { headers: cmsHeaders() });
  return unwrap(response);
}

export async function uploadMedia(file: File): Promise<MediaItemDto> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(apiUrl("/cms/media"), { method: "POST", headers: cmsHeaders(), body: form });
  return unwrap<MediaItemDto>(response);
}

export async function deleteMedia(id: string): Promise<void> {
  const response = await fetch(apiUrl(`/cms/media/${id}`), { method: "DELETE", headers: cmsHeaders() });
  await unwrap(response);
}

/* ------------------------- Резервные копии и служба ------------------------ */

export async function exportCmsBackup(): Promise<{ blob: Blob; filename: string }> {
  const response = await fetch(apiUrl("/cms/backup"), { headers: cmsHeaders() });
  if (!response.ok) await unwrap(response);
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="?([^"]+)"?/i);
  return {
    blob: await response.blob(),
    filename: match?.[1] ?? `skazka-cms-backup-${new Date().toISOString().slice(0, 10)}.zip`
  };
}

export async function importCmsBackup(file: File): Promise<CmsBackupImportResult> {
  const form = new FormData();
  form.append("backup", file);
  const response = await fetch(apiUrl("/cms/backup/import"), { method: "POST", headers: cmsHeaders(), body: form });
  return unwrap<CmsBackupImportResult>(response);
}

export async function fetchStats(): Promise<{ stats: Record<string, number> }> {
  const response = await fetch(apiUrl("/cms/stats"), { headers: cmsHeaders() });
  return unwrap(response);
}

export async function clearStats(): Promise<void> {
  const response = await fetch(apiUrl("/cms/stats"), { method: "DELETE", headers: cmsHeaders() });
  await unwrap(response);
}

export async function checkHealth(base = getCmsApiBase()): Promise<CmsHealth> {
  const response = await fetch(apiUrl("/health", base));
  return unwrap(response);
}

/**
 * Счётчик открытий раздела. Отправляем «в один конец»: если сервера нет,
 * панель не должна ни ждать, ни ругаться.
 */
export function trackEvent(key: string): void {
  try {
    void fetch(apiUrl(`/public/stats/${key}`), { method: "POST", keepalive: true }).catch(() => undefined);
  } catch {
    /* панель работает и без аналитики */
  }
}
