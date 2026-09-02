import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Нижний лист (bottom sheet) — основной способ показать подробности на панели.
 *
 * Рендерится через портал в document.body: внутри страницы `position: fixed`
 * ломается из-за transform-анимаций и backdrop-filter, которые создают
 * containing block.
 */
export function Modal({
  open,
  onClose,
  children,
  label
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  label?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // Фон не должен прокручиваться под открытым листом.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={label} onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal__grip" />
        <button type="button" className="modal__close" onClick={onClose} aria-label="Закрыть">
          ✕
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}
