import { useEffect, useState } from "react";

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
