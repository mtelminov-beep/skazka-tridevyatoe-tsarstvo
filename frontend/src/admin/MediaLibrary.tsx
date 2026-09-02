import { useCallback, useEffect, useRef, useState } from "react";
import { deleteMedia, listMedia, uploadMedia, type MediaItemDto } from "../stores/cmsClient";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

function kindIcon(mime: string): string {
  if (mime.startsWith("video/")) return "🎬";
  if (mime.startsWith("audio/")) return "🎧";
  return "🖼️";
}

/**
 * Медиатека: всё, что библиотека загрузила на панель.
 *
 * Путь файла показан как код, чтобы его можно было выделить и вставить
 * в любое поле «Ссылка» вручную — например, использовать одну обложку
 * сразу в нескольких разделах.
 */
export function MediaLibrary() {
  const [items, setItems] = useState<MediaItemDto[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const reload = useCallback(async () => {
    try {
      const response = await listMedia();
      setItems(response.items);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить список файлов");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const send = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        await uploadMedia(file);
      }
      await reload();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Не удалось загрузить файл");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item: MediaItemDto) => {
    if (!window.confirm(`Удалить файл «${item.original_name}» безвозвратно?`)) return;
    try {
      await deleteMedia(item.id);
      await reload();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Не удалось удалить файл");
    }
  };

  return (
    <div>
      {error ? <div className="admin-alert admin-alert--error">{error}</div> : null}

      <div className="admin-actions">
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          accept="image/*,video/mp4,video/webm,audio/mpeg,audio/ogg"
          onChange={(event) => {
            void send(event.target.files);
            event.target.value = "";
          }}
        />
        <button type="button" className="admin-btn admin-btn--primary" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? "Загрузка…" : "Загрузить файлы"}
        </button>
        <button type="button" className="admin-btn" onClick={() => void reload()}>
          Обновить
        </button>
        <span className="admin-note">{items.length} файлов · до 64 МБ каждый</span>
      </div>

      {items.length === 0 ? (
        <div className="admin-alert admin-alert--info">
          Файлов пока нет. Загрузите иллюстрации, аудиозаписи сказок или видео — и вставляйте их пути в разделы контента.
        </div>
      ) : (
        <div className="media-grid">
          {items.map((item) => (
            <div className="media-item" key={item.id}>
              <div className="media-item__preview">
                {item.mime.startsWith("image/") ? (
                  <img src={item.url} alt={item.original_name} loading="lazy" />
                ) : (
                  <span aria-hidden="true">{kindIcon(item.mime)}</span>
                )}
              </div>
              <div className="media-item__body">
                <strong className="media-item__name">{item.original_name}</strong>
                <code>{item.url}</code>
                <span>{formatBytes(item.bytes)}</span>
                <div className="admin-row">
                  <button
                    type="button"
                    className="admin-btn"
                    onClick={() => void navigator.clipboard?.writeText(item.url)}
                  >
                    Копировать путь
                  </button>
                  <button type="button" className="admin-btn admin-btn--danger" onClick={() => void remove(item)}>
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
