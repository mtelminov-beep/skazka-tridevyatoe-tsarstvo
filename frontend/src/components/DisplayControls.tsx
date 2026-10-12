import { useEffect, useState } from "react";
import { setLayoutMode, useViewport } from "../stores/viewport";

const CONTRAST_KEY = "skazka-high-contrast";

function readContrast() {
  try { return localStorage.getItem(CONTRAST_KEY) === "true"; } catch { return false; }
}

/** Единый переключатель контрастной версии для заставки и разделов панели. */
export function DisplayControls({ className = "" }: { className?: string }) {
  const [highContrast, setHighContrast] = useState(readContrast);
  useEffect(() => {
    document.documentElement.dataset.contrast = highContrast ? "high" : "normal";
    try { localStorage.setItem(CONTRAST_KEY, String(highContrast)); } catch { /* настройка действует до перезагрузки */ }
  }, [highContrast]);
  return <div className={`display-controls ${className}`.trim()} aria-label="Настройки отображения"><button type="button" className={`icon-btn display-controls__button${highContrast ? " icon-btn--on" : ""}`} onClick={(event) => { event.stopPropagation(); setHighContrast((value) => !value); }} aria-pressed={highContrast} aria-label={highContrast ? "Обычная версия" : "Контрастная версия для слабовидящих"} title={highContrast ? "Обычная версия" : "Контрастная версия для слабовидящих"}>◐</button></div>;
}

/** Переключатель вертикального и горизонтального представления. */
export function OrientationControl({ className = "" }: { className?: string }) {
  const { layout } = useViewport();
  const isPortrait = layout === "kiosk";
  const label = isPortrait ? "Переключить на горизонтальное представление" : "Переключить на вертикальное представление";

  return (
    <button
      type="button"
      className={`icon-btn mode-btn ${className}`.trim()}
      onClick={() => setLayoutMode(isPortrait ? "wide" : "kiosk")}
      aria-label={label}
      title={label}
    >
      {isPortrait ? (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <rect className="mode-btn__screen" x="7" y="2.5" width="10" height="19" rx="2.5" />
          <path d="M9.8 18.4h4.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <rect className="mode-btn__screen" x="2.5" y="6" width="19" height="12" rx="2.5" />
          <path d="M6.2 14.8V9.2" />
        </svg>
      )}
    </button>
  );
}
