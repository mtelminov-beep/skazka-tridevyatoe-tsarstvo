import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { appRouter } from "./router";
import "./styles/theme.css";
import "./styles/animations.css";
import "./styles/components.css";
import "./styles/folk.css";
import "./styles/admin.css";

// Тема выбирается в панели и запоминается: в зале её ставят один раз под освещение.
try {
  const saved = localStorage.getItem("skazka-theme");
  document.documentElement.dataset.theme = saved === "day" ? "day" : "night";
} catch {
  document.documentElement.dataset.theme = "night";
}

// Крупный кегль для слабовидящих читателей — переключается в шапке панели.
try {
  if (localStorage.getItem("skazka-large-text") === "on") {
    document.documentElement.dataset.text = "large";
  }
} catch {
  /* приватный режим браузера — панель работает с обычным кеглем */
}

// Киоск: жест «щипок» и двойной тап не должны масштабировать интерфейс панели.
document.addEventListener("gesturestart", (event) => event.preventDefault());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={appRouter} />
  </StrictMode>
);
