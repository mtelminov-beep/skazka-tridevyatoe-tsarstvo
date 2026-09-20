import { useCallback, useEffect, useState, type ReactNode } from "react";
import { NativeLicense, type LicenseStatus } from "./nativeLicense";

export function LicenseGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<LicenseStatus | null>(null);
  const [license, setLicense] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setStatus(await NativeLicense.getStatus());
      setMessage("");
    } catch {
      setMessage("Не удалось проверить состояние лицензии.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const activate = useCallback(async () => {
    if (!license.trim()) {
      setMessage("Вставьте текст файла лицензии JSON, созданного активатором.");
      return;
    }
    setLoading(true);
    try {
      const result = await NativeLicense.activate({ license: license.trim() });
      setStatus(result.status);
      setLicense("");
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Лицензия отклонена.");
    } finally {
      setLoading(false);
    }
  }, [license]);

  if (status?.licenseValid && !status.needsActivation) return <>{children}</>;

  return (
    <main className="license-screen">
      <section className="license-card" aria-busy={loading}>
        <p className="license-eyebrow">ТРИДЕВЯТОЕ ЦАРСТВО</p>
        <h1>{loading && !status ? "Проверка лицензии" : "Активация приложения"}</h1>
        <p>Для этого устройства нужна лицензия, созданная тем же Windows-активатором.</p>
        <div className="license-code"><span>Код запроса</span><code>{status?.requestCode ?? "Подготавливается…"}</code></div>
        <p className="license-device">{status ? `${status.manufacturer} ${status.model}` : ""}</p>
        <label className="license-input">
          <span>Текст лицензии JSON</span>
          <textarea value={license} onChange={(event) => setLicense(event.target.value)} placeholder='{"payload":"…","signature":"…"}' rows={8} spellCheck={false} />
        </label>
        {message ? <p className="license-error">{message}</p> : null}
        <div className="license-actions">
          <button type="button" onClick={() => void activate()} disabled={loading}>Активировать</button>
          <button type="button" className="license-secondary" onClick={() => void refresh()} disabled={loading}>Обновить</button>
        </div>
      </section>
    </main>
  );
}
