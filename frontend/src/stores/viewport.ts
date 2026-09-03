/**
 * Определение экрана и режима представления.
 *
 * Панель живёт на разном железе: интерактивный стол 55" лёжа, вертикальная
 * панель 75", планшет библиотекаря, обычный компьютер. Ни одно из этих
 * устройств нельзя опознать по «модели браузера» — надёжны только размер
 * вьюпорта, ориентация и тип указателя. Их и меряем.
 *
 * Результат складывается в data-атрибуты на <html>, а вся вёрстка читает
 * их из CSS. Логика в одном месте, стили — в другом: так же, как уже
 * сделано с темой и крупным кеглем.
 *
 *   data-device  phone | tablet | laptop | panel  — размер экрана
 *   data-input   touch | mouse                    — чем по нему тыкают
 *   data-orient  portrait | landscape             — как он стоит на самом деле
 *   data-layout  kiosk | wide                     — какое представление выбрано
 *   data-mode    auto | kiosk | wide              — что выбрал человек
 */

import { useSyncExternalStore } from "react";

const MODE_KEY = "skazka-layout-mode";

/** Что выбрал человек в шапке. `auto` — идти за реальной ориентацией экрана. */
export type LayoutMode = "auto" | "kiosk" | "wide";

/** Во что это в итоге разворачивается: колонка с доком внизу или лента слева. */
export type Layout = "kiosk" | "wide";

export type Orientation = "portrait" | "landscape";

export type DeviceClass = "phone" | "tablet" | "laptop" | "panel";

export type ViewportState = {
  width: number;
  height: number;
  orientation: Orientation;
  device: DeviceClass;
  touch: boolean;
  mode: LayoutMode;
  layout: Layout;
};

export const MODE_TITLES: Record<LayoutMode, string> = {
  auto: "Представление: автоматически",
  kiosk: "Представление: киоск (вертикально)",
  wide: "Представление: горизонтально"
};

function readMode(): LayoutMode {
  try {
    const saved = localStorage.getItem(MODE_KEY);
    if (saved === "kiosk" || saved === "wide" || saved === "auto") return saved;
  } catch {
    /* приватный режим браузера — работаем автоматически */
  }
  return "auto";
}

/**
 * Класс устройства считаем по короткой стороне: именно она ограничивает
 * вёрстку, и именно она не меняется, когда стол кладут набок.
 *
 * Большой экран с касанием — это панель или стол, даже если по числу
 * пикселей он не отличается от монитора: пальцу нужны кнопки крупнее,
 * чем мыши.
 */
function classify(short: number, touch: boolean): DeviceClass {
  if (short < 600) return "phone";
  if (short < 900) return "tablet";
  if (touch || short >= 1300) return "panel";
  return "laptop";
}

function measure(mode: LayoutMode): ViewportState {
  const width = window.innerWidth || document.documentElement.clientWidth;
  const height = window.innerHeight || document.documentElement.clientHeight;
  const orientation: Orientation = height >= width ? "portrait" : "landscape";
  const touch = window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
  const device = classify(Math.min(width, height), touch);

  // В автоматическом режиме представление повторяет то, как экран повешен
  // или положен. Выбор человека сильнее: стол бывает горизонтальным,
  // а библиотекарю всё равно нужна вертикальная «афиша».
  const layout: Layout = mode === "auto" ? (orientation === "portrait" ? "kiosk" : "wide") : mode;

  return { width, height, orientation, device, touch, mode, layout };
}

let state: ViewportState | null = null;
const listeners = new Set<() => void>();

function publish(next: ViewportState) {
  const root = document.documentElement;
  root.dataset.device = next.device;
  root.dataset.input = next.touch ? "touch" : "mouse";
  root.dataset.orient = next.orientation;
  root.dataset.layout = next.layout;
  root.dataset.mode = next.mode;
  state = next;
  listeners.forEach((listener) => listener());
}

function same(a: ViewportState, b: ViewportState) {
  return (
    a.width === b.width &&
    a.height === b.height &&
    a.device === b.device &&
    a.touch === b.touch &&
    a.orientation === b.orientation &&
    a.layout === b.layout &&
    a.mode === b.mode
  );
}

function refresh() {
  const next = measure(state?.mode ?? readMode());
  if (!state || !same(state, next)) publish(next);
}

/**
 * Вызывается один раз до отрисовки: атрибуты должны стоять на <html> раньше,
 * чем появится первый кадр, иначе панель успевает моргнуть чужой вёрсткой.
 */
export function initViewport() {
  publish(measure(readMode()));

  // Пересчёт объединяем в один кадр: на планшете resize при повороте
  // приходит десятками событий подряд.
  let frame = 0;
  const schedule = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      refresh();
    });
  };

  window.addEventListener("resize", schedule, { passive: true });
  window.addEventListener("orientationchange", schedule, { passive: true });
  // Подключили клавиатуру и мышь к столу — кнопки могут стать компактнее.
  window.matchMedia("(pointer: coarse)").addEventListener("change", schedule);
}

export function getViewport(): ViewportState {
  if (!state) publish(measure(readMode()));
  return state as ViewportState;
}

export function setLayoutMode(mode: LayoutMode) {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    /* приватный режим — выбор живёт до перезагрузки */
  }
  publish(measure(mode));
}

/** Кнопка в шапке перебирает режимы по кругу. */
export function nextLayoutMode(mode: LayoutMode): LayoutMode {
  if (mode === "auto") return "kiosk";
  if (mode === "kiosk") return "wide";
  return "auto";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useViewport(): ViewportState {
  return useSyncExternalStore(subscribe, getViewport, getViewport);
}
