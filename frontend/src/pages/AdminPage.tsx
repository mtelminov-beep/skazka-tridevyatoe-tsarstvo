import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MediaLibrary } from "../admin/MediaLibrary";
import { StructuredEditor } from "../admin/StructuredEditor";
import { CATALOG_HINTS, CATALOG_KEYS, CATALOG_LABELS, catalogDefaults } from "../data/defaults";
import { useCatalogs } from "../stores/catalogStore";
import {
  checkHealth,
  clearStats,
  exportCmsBackup,
  fetchCmsSession,
  fetchStats,
  getCmsApiBase,
  getCmsSessionToken,
  importCmsBackup,
  loginCms,
  logoutCms,
  publishCatalog,
  resetCatalog,
  setCmsApiBase,
  type CmsHealth
} from "../stores/cmsClient";
import type { CatalogKey } from "../types";

type Tab = CatalogKey | "media" | "stats" | "service";

type Toast = { kind: "ok" | "error" | "info"; text: string } | null;

/**
 * Админка панели.
 *
 * Работает в две ступени: правка сохраняется локально (панель на этом же
 * устройстве видит её сразу), а «Опубликовать» отправляет раздел на сервер,
 * откуда его подхватят все панели. Публикация защищена проверкой версии:
 * если раздел успел изменить другой редактор, сервер вернёт 409.
 */
export function AdminPage() {
  const { catalogs, versions, saveLocal, resetLocal, setVersion, refresh } = useCatalogs();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<Tab>(CATALOG_KEYS[0]);
  const [draft, setDraft] = useState<unknown>(null);
  const [rawMode, setRawMode] = useState(false);
  const [rawText, setRawText] = useState("");
  const [toast, setToast] = useState<Toast>(null);
  const [busy, setBusy] = useState(false);

  const isCatalogTab = (CATALOG_KEYS as string[]).includes(tab);

  /* ------------------------------ Авторизация ----------------------------- */

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!getCmsSessionToken()) {
        setChecking(false);
        return;
      }
      try {
        await fetchCmsSession();
        if (!cancelled) setAuthorized(true);
      } catch {
        /* сессия истекла — покажем форму входа */
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ------------------------- Черновик текущего раздела ------------------------ */

  useEffect(() => {
    if (!isCatalogTab) return;
    const current = catalogs[tab as CatalogKey];
    setDraft(structuredClone(current));
    setRawText(JSON.stringify(current, null, 2));
    setToast(null);
  }, [tab, isCatalogTab, catalogs]);

  const flash = useCallback((kind: "ok" | "error" | "info", text: string) => {
    setToast({ kind, text });
    window.setTimeout(() => setToast(null), 6000);
  }, []);

  const applyDraft = (next: unknown) => {
    setDraft(next);
    setRawText(JSON.stringify(next, null, 2));
  };

  const saveLocally = () => {
    if (!isCatalogTab || draft === null) return;
    saveLocal(tab as CatalogKey, draft as never);
    flash("ok", "Сохранено на этом устройстве. Панель уже показывает новую версию.");
  };

  const publish = async () => {
    if (!isCatalogTab || draft === null) return;
    setBusy(true);
    try {
      const key = tab as CatalogKey;
      const expected = key in versions ? (versions[key] ?? "") : null;
      const result = await publishCatalog(key, draft, expected);
      saveLocal(key, draft as never);
      setVersion(key, result.updated_at);
      flash("ok", "Опубликовано. Раздел разошёлся на все панели.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось опубликовать раздел";
      flash("error", message);
    } finally {
      setBusy(false);
    }
  };

  const restoreDefaults = () => {
    if (!isCatalogTab) return;
    if (!window.confirm("Вернуть раздел к эталонному контенту? Локальные правки будут потеряны.")) return;
    const key = tab as CatalogKey;
    resetLocal(key);
    applyDraft(structuredClone(catalogDefaults[key]));
    flash("info", "Локальная копия сброшена к эталону. Чтобы то же случилось на сервере — нажмите «Убрать с сервера».");
  };

  const dropFromServer = async () => {
    if (!isCatalogTab) return;
    if (!window.confirm("Удалить опубликованную версию раздела с сервера? Панели вернутся к эталонному контенту.")) return;
    setBusy(true);
    try {
      const key = tab as CatalogKey;
      await resetCatalog(key);
      setVersion(key, null);
      flash("ok", "Раздел убран с сервера.");
    } catch (error) {
      flash("error", error instanceof Error ? error.message : "Не удалось удалить раздел");
    } finally {
      setBusy(false);
    }
  };

  const parseRaw = () => {
    try {
      applyDraft(JSON.parse(rawText));
      flash("ok", "JSON разобран, форма обновлена.");
    } catch (error) {
      flash("error", error instanceof Error ? `Ошибка в JSON: ${error.message}` : "Ошибка в JSON");
    }
  };

  if (checking) {
    return (
      <main className="admin admin-login">
        <p className="admin-note">Проверяем сессию…</p>
      </main>
    );
  }

  if (!authorized) {
    return <LoginScreen onSuccess={() => setAuthorized(true)} />;
  }

  return (
    <div className="admin">
      <div className="admin-shell">
        <aside className="admin-side">
          <div className="admin-brand">
            <strong>Тридевятое царство · CMS</strong>
            <span>Управление контентом панели</span>
          </div>

          <nav className="admin-nav">
            {CATALOG_KEYS.map((key) => (
              <button key={key} type="button" className={tab === key ? "is-active" : ""} onClick={() => setTab(key)}>
                {CATALOG_LABELS[key]}
                {versions[key] ? <span className="admin-dot" title="Опубликован" /> : null}
                <small>{CATALOG_HINTS[key]}</small>
              </button>
            ))}
          </nav>

          <div className="admin-side__group">
            <nav className="admin-nav">
              <button type="button" className={tab === "media" ? "is-active" : ""} onClick={() => setTab("media")}>
                Медиатека
                <small>Картинки, аудио и видео для всех разделов</small>
              </button>
              <button type="button" className={tab === "stats" ? "is-active" : ""} onClick={() => setTab("stats")}>
                Посещаемость
                <small>Какие разделы открывают чаще</small>
              </button>
              <button type="button" className={tab === "service" ? "is-active" : ""} onClick={() => setTab("service")}>
                Обслуживание
                <small>Резервные копии, адрес сервера, выход</small>
              </button>
            </nav>
          </div>

          <div className="admin-side__footer">
            <Link to="/" className="admin-btn" style={{ width: "100%" }}>
              ← Открыть панель
            </Link>
          </div>
        </aside>

        <main className="admin-main">
          {toast ? <div className={`admin-alert admin-alert--${toast.kind}`}>{toast.text}</div> : null}

          {tab === "media" ? (
            <>
              <header className="admin-head">
                <div>
                  <h1>Медиатека</h1>
                  <p>
                    Загруженные файлы лежат в <code>media/uploads</code> и попадают в резервную копию.
                    Путь файла можно вставить в любое поле «Ссылка».
                  </p>
                </div>
              </header>
              <MediaLibrary />
            </>
          ) : tab === "stats" ? (
            <StatsPanel onError={(text) => flash("error", text)} />
          ) : tab === "service" ? (
            <ServicePanel onFlash={flash} onRefresh={refresh} />
          ) : (
            <>
              <header className="admin-head">
                <div>
                  <h1>{CATALOG_LABELS[tab as CatalogKey]}</h1>
                  <p>{CATALOG_HINTS[tab as CatalogKey]}</p>
                  <p>
                    {versions[tab as CatalogKey]
                      ? `На сервере: версия от ${new Date(versions[tab as CatalogKey] as string).toLocaleString("ru-RU")}`
                      : "На сервере раздела ещё нет — панели показывают эталонный контент."}
                  </p>
                </div>
                <button type="button" className="admin-btn" onClick={() => setRawMode(!rawMode)}>
                  {rawMode ? "Показать форму" : "Показать JSON"}
                </button>
              </header>

              <div className="admin-actions">
                <button type="button" className="admin-btn" onClick={saveLocally} disabled={busy}>
                  Сохранить на устройстве
                </button>
                <button type="button" className="admin-btn admin-btn--primary" onClick={() => void publish()} disabled={busy}>
                  {busy ? "Отправка…" : "Опубликовать"}
                </button>
                <button type="button" className="admin-btn" onClick={() => void refresh()} disabled={busy}>
                  Загрузить с сервера
                </button>
                <button type="button" className="admin-btn admin-btn--danger" onClick={restoreDefaults} disabled={busy}>
                  Вернуть эталон
                </button>
                <button type="button" className="admin-btn admin-btn--danger" onClick={() => void dropFromServer()} disabled={busy}>
                  Убрать с сервера
                </button>
              </div>

              {rawMode ? (
                <div className="admin-field">
                  <label htmlFor="raw">JSON раздела</label>
                  <textarea
                    id="raw"
                    className="admin-textarea admin-textarea--code"
                    value={rawText}
                    onChange={(event) => setRawText(event.target.value)}
                  />
                  <button type="button" className="admin-btn" onClick={parseRaw} style={{ justifySelf: "flex-start" }}>
                    Применить JSON
                  </button>
                </div>
              ) : (
                <StructuredEditor value={draft} onChange={applyDraft} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

/* ------------------------------ Экран входа ------------------------------ */

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [base, setBase] = useState(getCmsApiBase());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setCmsApiBase(base);
      await loginCms(username, password);
      onSuccess();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Не удалось войти");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin admin-login">
      <form onSubmit={submit}>
        <div className="admin-login__title">
          <h1>Вход в CMS «Тридевятое царство»</h1>
          <p>Управление контентом интерактивной панели</p>
        </div>

        {error ? <div className="admin-alert admin-alert--error">{error}</div> : null}

        <div className="admin-field">
          <label htmlFor="login">Логин</label>
          <input
            id="login"
            className="admin-input"
            value={username}
            autoComplete="username"
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>

        <div className="admin-field">
          <label htmlFor="password">Пароль</label>
          <input
            id="password"
            className="admin-input"
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <details>
          <summary>Сервер на другом компьютере</summary>
          <div className="admin-field" style={{ marginTop: 6 }}>
            <label htmlFor="base">Адрес API</label>
            <input
              id="base"
              className="admin-input"
              value={base}
              placeholder="http://192.168.1.10:8802"
              onChange={(event) => setBase(event.target.value)}
            />
          </div>
        </details>

        <button type="submit" className="admin-btn admin-btn--primary" disabled={busy}>
          {busy ? "Проверяем…" : "Войти"}
        </button>

        <p className="admin-note">
          Логин и пароль по умолчанию — <code>admin</code> / <code>admin</code>. Смените их переменными окружения
          <code> CMS_ADMIN_USER</code> и <code>CMS_ADMIN_PASSWORD</code> перед запуском в зале.
        </p>
      </form>
    </div>
  );
}

/* ----------------------------- Посещаемость ----------------------------- */

function StatsPanel({ onError }: { onError: (text: string) => void }) {
  const [stats, setStats] = useState<Record<string, number>>({});

  const reload = useCallback(async () => {
    try {
      const response = await fetchStats();
      setStats(response.stats);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Не удалось загрузить статистику");
    }
  }, [onError]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const rows = useMemo(() => {
    const entries = Object.entries(stats).sort((a, b) => b[1] - a[1]);
    const max = entries[0]?.[1] ?? 1;
    return entries.map(([key, count]) => ({ key, count, percent: Math.round((count / max) * 100) }));
  }, [stats]);

  return (
    <>
      <header className="admin-head">
        <div>
          <h1>Посещаемость</h1>
          <p>
            Сколько раз открывали разделы, сказки, героев и игры. Считается прямо на панели — без сбора
            каких-либо данных о посетителях.
          </p>
        </div>
      </header>

      <div className="admin-actions">
        <button type="button" className="admin-btn" onClick={() => void reload()}>
          Обновить
        </button>
        <button
          type="button"
          className="admin-btn admin-btn--danger"
          onClick={async () => {
            if (!window.confirm("Обнулить всю статистику?")) return;
            try {
              await clearStats();
              await reload();
            } catch (error) {
              onError(error instanceof Error ? error.message : "Не удалось очистить статистику");
            }
          }}
        >
          Обнулить
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="admin-alert admin-alert--info">Пока пусто — статистика появится после первых посетителей.</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Раздел</th>
              <th>Доля от самого популярного</th>
              <th>Открытий</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <td>
                  <code>{row.key}</code>
                </td>
                <td className="admin-table__bar">
                  <i style={{ width: `${row.percent}%` }} />
                </td>
                <td>{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

/* ------------------------------ Обслуживание ------------------------------ */

function ServicePanel({
  onFlash,
  onRefresh
}: {
  onFlash: (kind: "ok" | "error" | "info", text: string) => void;
  onRefresh: () => Promise<void>;
}) {
  const [health, setHealth] = useState<CmsHealth | null>(null);
  const [base, setBase] = useState(getCmsApiBase());
  const importRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    checkHealth()
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  const download = async () => {
    try {
      const { blob, filename } = await exportCmsBackup();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      onFlash("ok", "Резервная копия скачана.");
    } catch (error) {
      onFlash("error", error instanceof Error ? error.message : "Не удалось выгрузить копию");
    }
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!window.confirm("Восстановить из копии? Текущий контент и файлы будут заменены.")) return;
    try {
      const result = await importCmsBackup(file);
      await onRefresh();
      onFlash("ok", `Восстановлено: разделов ${result.catalogs}, файлов ${result.media_files}.`);
    } catch (error) {
      onFlash("error", error instanceof Error ? error.message : "Не удалось восстановить копию");
    }
  };

  return (
    <>
      <header className="admin-head">
        <div>
          <h1>Обслуживание</h1>
          <p>Резервные копии, адрес сервера и выход из админки.</p>
        </div>
      </header>

      <div className="admin-card">
        <h4>Резервная копия</h4>
        <p className="admin-note">
          В архив попадают все разделы контента, загруженные файлы и счётчики посещаемости.
          Делайте копию после каждого крупного обновления контента.
        </p>
        <div className="admin-row" style={{ marginTop: 8 }}>
          <button type="button" className="admin-btn admin-btn--primary" onClick={() => void download()}>
            Скачать копию (.zip)
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".zip"
            hidden
            onChange={(event) => {
              void upload(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <button type="button" className="admin-btn admin-btn--danger" onClick={() => importRef.current?.click()}>
            Восстановить из копии
          </button>
        </div>
      </div>

      <div className="admin-card">
        <h4>Адрес сервера</h4>
        <div className="admin-field">
          <label htmlFor="api-base">Оставьте пустым, если админка открыта с того же устройства, где работает сервер</label>
          <input
            id="api-base"
            className="admin-input"
            value={base}
            placeholder="http://192.168.1.10:8802"
            onChange={(event) => setBase(event.target.value)}
          />
        </div>
        <button
          type="button"
          className="admin-btn"
          style={{ marginTop: 8 }}
          onClick={() => {
            const normalized = setCmsApiBase(base);
            setBase(normalized);
            onFlash("ok", "Адрес сохранён. Обновите страницу, чтобы он применился.");
          }}
        >
          Сохранить адрес
        </button>
      </div>

      <div className="admin-card">
        <h4>Состояние сервера</h4>
        {health ? (
          <div className="admin-list">
            <span>Опубликованных разделов: {health.catalogs}</span>
            <span>Файлов в медиатеке: {health.media}</span>
            {health.listen?.local_urls?.map((item) => (
              <span key={item.url}>
                Панель доступна в сети: <code>{item.url}</code>
              </span>
            ))}
          </div>
        ) : (
          <div className="admin-alert admin-alert--error">Сервер не отвечает. Панель работает в автономном режиме.</div>
        )}
      </div>

      <div className="admin-card">
        <h4>Сессия</h4>
        <button
          type="button"
          className="admin-btn admin-btn--danger"
          onClick={async () => {
            await logoutCms().catch(() => undefined);
            window.location.reload();
          }}
        >
          Выйти из админки
        </button>
      </div>
    </>
  );
}
