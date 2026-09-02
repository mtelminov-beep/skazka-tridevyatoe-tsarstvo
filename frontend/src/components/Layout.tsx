import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useCatalog, useCatalogs } from "../stores/catalogStore";
import { trackEvent } from "../stores/cmsClient";
import { Sky } from "./Sky";

const THEME_KEY = "skazka-theme";
const TEXT_KEY = "skazka-large-text";

type NavIconId =
  | "home"
  | "ages"
  | "tales"
  | "heroes"
  | "traditions"
  | "dictionary"
  | "quiz"
  | "games"
  | "gallery"
  | "library";

function readTheme(): "night" | "day" {
  try {
    return localStorage.getItem(THEME_KEY) === "day" ? "day" : "night";
  } catch {
    return "night";
  }
}

function readLargeText(): boolean {
  try {
    return localStorage.getItem(TEXT_KEY) === "on";
  } catch {
    return false;
  }
}

/**
 * Иконки дока нарисованы вручную, а не взяты эмодзи: на панели 75"
 * системный эмодзи выглядит чужеродно и по-разному в разных сборках ОС.
 * Мотивы — из предметного мира сказки: изба, прялка, короб, вышивка.
 */
function DockIcon({ id }: { id: string }) {
  const iconId = id as NavIconId;

  return (
    <span className={`dock-icon dock-icon--${iconId}`} aria-hidden="true">
      <svg viewBox="0 0 64 64" role="img" focusable="false">
        <defs>
          <linearGradient id={`${iconId}-gold`} x1="16" y1="8" x2="52" y2="58">
            <stop stopColor="#ffe9a8" />
            <stop offset="45%" stopColor="#e0a12b" />
            <stop offset="100%" stopColor="#8a5316" />
          </linearGradient>
          <linearGradient id={`${iconId}-wood`} x1="12" y1="10" x2="50" y2="56">
            <stop stopColor="#c98f52" />
            <stop offset="100%" stopColor="#75461f" />
          </linearGradient>
          <linearGradient id={`${iconId}-linen`} x1="12" y1="10" x2="50" y2="56">
            <stop stopColor="#fff4dd" />
            <stop offset="100%" stopColor="#d9b98a" />
          </linearGradient>
          <linearGradient id={`${iconId}-gzhel`} x1="10" y1="8" x2="52" y2="58">
            <stop stopColor="#cfe6ff" />
            <stop offset="52%" stopColor="#3f7ec4" />
            <stop offset="100%" stopColor="#1b3f74" />
          </linearGradient>
          <filter id={`${iconId}-shadow`} x="-30%" y="-30%" width="160%" height="170%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#1a0d06" floodOpacity="0.38" />
          </filter>
        </defs>

        {/* Главная — изба с трубой и резным крыльцом */}
        {iconId === "home" ? (
          <g filter={`url(#${iconId}-shadow)`}>
            <path d="M8 30 32 10l24 20v24H8V30Z" fill={`url(#${iconId}-wood)`} />
            <path d="M32 6 60 30H4L32 6Z" fill="#a8452c" />
            <rect x="41" y="12" width="7" height="12" rx="2" fill="#7b3a22" />
            <rect x="18" y="34" width="12" height="12" rx="2" fill="#ffdf9c" />
            <rect x="35" y="34" width="12" height="12" rx="2" fill="#ffdf9c" />
            <path className="dock-icon__spark" d="M32 15l2.4 5 5 2.4-5 2.4-2.4 5-2.4-5-5-2.4 5-2.4L32 15Z" fill="#ffe9a8" />
          </g>
        ) : null}

        {/* Полки — лесенка из книг по возрастам */}
        {iconId === "ages" ? (
          <g filter={`url(#${iconId}-shadow)`}>
            <rect x="9" y="42" width="46" height="10" rx="3" fill={`url(#${iconId}-wood)`} />
            <rect x="12" y="30" width="12" height="12" rx="2" fill="#3f8f63" />
            <rect x="26" y="24" width="12" height="18" rx="2" fill="#d8452f" />
            <rect x="40" y="16" width="12" height="26" rx="2" fill={`url(#${iconId}-gold)`} />
            <path d="M18 33v6M32 27v12M46 19v20" stroke="#fff4dd" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
          </g>
        ) : null}

        {/* Сказки — раскрытая книга с закладкой */}
        {iconId === "tales" ? (
          <g filter={`url(#${iconId}-shadow)`}>
            <path d="M12 15c9-4 16-2 20 3 4-5 11-7 20-3v35c-8-3-15-2-20 4-5-6-12-7-20-4V15Z" fill={`url(#${iconId}-linen)`} />
            <path d="M32 18v36M18 24h9M18 31h9M37 24h9M37 31h9" fill="none" stroke="#7a4a22" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
            <path className="dock-icon__page" d="M12 15c9-4 16-2 20 3v36c-5-6-12-7-20-4V15Z" fill="#fff8e6" opacity="0.5" />
            <path d="M44 15v22l-4-5-4 5V15h8Z" fill="#d8452f" />
          </g>
        ) : null}

        {/* Герои — кокошник */}
        {iconId === "heroes" ? (
          <g filter={`url(#${iconId}-shadow)`}>
            <path className="dock-icon__crown" d="M12 44c0-16 9-26 20-26s20 10 20 26H12Z" fill={`url(#${iconId}-gold)`} />
            <path d="M14 44h36v8H14z" fill="#8f4d1f" />
            <circle cx="32" cy="26" r="4" fill="#d8452f" />
            <circle cx="21" cy="33" r="3" fill="#3f7ec4" />
            <circle cx="43" cy="33" r="3" fill="#3f7ec4" />
            <path d="M18 39h28" stroke="#fff4dd" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
          </g>
        ) : null}

        {/* Как рождалась сказка — лучина в светце */}
        {iconId === "traditions" ? (
          <g filter={`url(#${iconId}-shadow)`}>
            <path d="M28 30h8l3 24H25l3-24Z" fill={`url(#${iconId}-wood)`} />
            <path d="M23 54h18" stroke="#e0a12b" strokeWidth="4" strokeLinecap="round" />
            <path className="dock-icon__flame" d="M32 6c9 9 8 19 0 26-8-7-10-16 0-26Z" fill="#ffcf5a" />
            <path className="dock-icon__flame-small" d="M33 15c4 5 3 11-1 15-4-4-4-10 1-15Z" fill="#e8552a" />
          </g>
        ) : null}

        {/* Словарик — лупа над строкой */}
        {iconId === "dictionary" ? (
          <g filter={`url(#${iconId}-shadow)`}>
            <circle className="dock-icon__lens" cx="27" cy="27" r="15" fill="#e6f2ff" stroke={`url(#${iconId}-gzhel)`} strokeWidth="5" />
            <path d="M38 38l13 13" stroke="#7a4a22" strokeWidth="7" strokeLinecap="round" />
            <path d="M19 26h15M20 32h10" stroke="#2a5688" strokeWidth="2.4" strokeLinecap="round" opacity="0.75" />
            <path d="M22 20c5-2 10-1 13 2" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
          </g>
        ) : null}

        {/* Викторина — мишень со стрелой */}
        {iconId === "quiz" ? (
          <g filter={`url(#${iconId}-shadow)`}>
            <circle cx="32" cy="32" r="22" fill="#d8452f" />
            <circle cx="32" cy="32" r="15" fill="#fff2cf" />
            <circle cx="32" cy="32" r="8" fill="#a83421" />
            <path className="dock-icon__arrow" d="M45 13l6-6v9h9l-6 6-15 15-3-3 15-15Z" fill={`url(#${iconId}-gold)`} />
            <path d="M32 32l14-14" stroke="#4a1c14" strokeWidth="3" strokeLinecap="round" />
          </g>
        ) : null}

        {/* Игры — бабки-кости и мяч */}
        {iconId === "games" ? (
          <g filter={`url(#${iconId}-shadow)`}>
            <rect className="dock-icon__dice-a" x="11" y="14" width="24" height="24" rx="6" fill="#fff4dd" transform="rotate(-10 23 26)" />
            <rect className="dock-icon__dice-b" x="29" y="27" width="24" height="24" rx="6" fill="#3f8f63" transform="rotate(9 41 39)" />
            <circle cx="19" cy="22" r="2.4" fill="#8b4b23" />
            <circle cx="28" cy="30" r="2.4" fill="#8b4b23" />
            <circle cx="37" cy="35" r="2.4" fill="#f5ecd4" />
            <circle cx="45" cy="43" r="2.4" fill="#f5ecd4" />
          </g>
        ) : null}

        {/* Галерея — картина в резной раме */}
        {iconId === "gallery" ? (
          <g filter={`url(#${iconId}-shadow)`}>
            <rect x="10" y="13" width="44" height="38" rx="4" fill={`url(#${iconId}-wood)`} />
            <rect x="16" y="19" width="32" height="26" rx="2" fill="#f7e3b6" />
            <path className="dock-icon__picture" d="M17 44l10-11 7 7 5-5 8 9H17Z" fill="#3f8f63" />
            <circle cx="40" cy="27" r="4" fill="#e0a12b" />
            <path d="M12 15h40M12 49h40" stroke="#ffe9a8" strokeWidth="2" opacity="0.5" />
          </g>
        ) : null}

        {/* Библиотека — здание с колоннами */}
        {iconId === "library" ? (
          <g filter={`url(#${iconId}-shadow)`}>
            <path className="dock-icon__roof" d="M8 26 32 12l24 14H8Z" fill={`url(#${iconId}-gold)`} />
            <rect x="12" y="28" width="40" height="5" rx="2" fill="#fff4dd" />
            <path d="M17 33h6v17h-6zM29 33h6v17h-6zM41 33h6v17h-6z" fill="#dceaf5" />
            <rect x="11" y="50" width="42" height="5" rx="2" fill="#7a4a22" />
            <circle cx="32" cy="22" r="3" fill="#7a4a22" />
          </g>
        ) : null}
      </svg>
    </span>
  );
}

/**
 * Оболочка панели: живой фон, шапка, прокручиваемый контент и нижний док.
 *
 * Док внизу не только ради моды: панель 75" стоит вертикально, и верхняя
 * половина экрана недосягаема для ребёнка. Всё, что нажимают, живёт снизу.
 */
export function AppLayout() {
  const navigation = useCatalog("skazka-navigation-v1");
  const { online } = useCatalogs();
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<"night" | "day">(readTheme);
  const [largeText, setLargeText] = useState<boolean>(readLargeText);
  const idleTimer = useRef<number | null>(null);

  const visibleItems = navigation.items.filter((item) => item.visible);
  const current = visibleItems.find((item) => item.path === location.pathname);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* приватный режим — тема живёт до перезагрузки */
    }
  }, [theme]);

  // Крупный кегль: библиотекарь включает его для слабовидящего читателя
  // и выключает после — поэтому кнопка в шапке, а не в настройках.
  useEffect(() => {
    if (largeText) document.documentElement.dataset.text = "large";
    else delete document.documentElement.dataset.text;
    try {
      localStorage.setItem(TEXT_KEY, largeText ? "on" : "off");
    } catch {
      /* приватный режим — настройка живёт до перезагрузки */
    }
  }, [largeText]);

  // Счётчик посещений разделов — библиотекарь видит его в админке.
  useEffect(() => {
    const key = location.pathname.replace(/^\//, "") || "home";
    trackEvent(`section:${key}`);
  }, [location.pathname]);

  // Прокрутка наверх при смене раздела: панель не должна открывать
  // новый раздел с середины предыдущего.
  useEffect(() => {
    document.querySelector(".app-main")?.scrollTo({ top: 0 });
  }, [location.pathname]);

  /** Возврат на заставку, если панель осталась без внимания. */
  const resetIdle = useCallback(() => {
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    const minutes = Number(navigation.idleTimeoutMinutes) || 0;
    if (minutes <= 0) return;
    idleTimer.current = window.setTimeout(() => navigate("/"), minutes * 60_000);
  }, [navigate, navigation.idleTimeoutMinutes]);

  useEffect(() => {
    resetIdle();
    const events: Array<keyof DocumentEventMap> = ["pointerdown", "keydown", "wheel", "touchstart"];
    events.forEach((event) => document.addEventListener(event, resetIdle, { passive: true }));
    return () => {
      events.forEach((event) => document.removeEventListener(event, resetIdle));
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
    };
  }, [resetIdle]);

  return (
    <div className="app-shell">
      <Sky />

      {!online ? <div className="offline-badge">Автономный режим</div> : null}

      <header className="topbar">
        <button type="button" className="icon-btn" onClick={() => navigate("/")} aria-label="На заставку">
          🏠
        </button>
        <div className="topbar__title">
          <strong>{current?.title ?? "Тридевятое царство"}</strong>
          <span>{current?.subtitle ?? "Русские народные сказки"}</span>
        </div>
        <div className="topbar__tools">
          <button
            type="button"
            className={`icon-btn${largeText ? " icon-btn--on" : ""}`}
            onClick={() => setLargeText((value) => !value)}
            aria-pressed={largeText}
            aria-label={largeText ? "Обычный размер текста" : "Крупный текст"}
          >
            {largeText ? "A" : "ᴀ"}
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setTheme(theme === "night" ? "day" : "night")}
            aria-label={theme === "night" ? "Светлая тема" : "Тёмная тема"}
          >
            {theme === "night" ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className="page page-enter" key={location.pathname}>
          <Outlet />
        </div>
      </main>

      <nav className="dock" aria-label="Разделы панели">
        <div className="dock__scroll">
          {visibleItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) => `dock__btn tint--${item.tint}${isActive ? " dock__btn--active" : ""}`}
            >
              <DockIcon id={item.id} />
              {item.title}
            </NavLink>
          ))}
        </div>
        <div className="dock__footer">{navigation.footer}</div>
      </nav>
    </div>
  );
}
