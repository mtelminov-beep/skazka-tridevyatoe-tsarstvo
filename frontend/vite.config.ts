import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Порты вынесены в переменные окружения: на одной машине рядом крутятся
 * соседние панели, и жёстко занятый порт мешает запустить проект.
 * По умолчанию 5275 / 8803 — они не пересекаются с панелью «Лукоморье».
 * Если порт занят, Vite сам возьмёт следующий свободный (strictPort: false).
 */
const API_PORT = process.env.API_PORT ?? "8803";
const WEB_PORT = Number(process.env.WEB_PORT ?? 5275);
const API = process.env.VITE_API_PROXY ?? `http://127.0.0.1:${API_PORT}`;
const ALLOWED_HOST = process.env.VITE_ALLOWED_HOST;

export default defineConfig({
  plugins: [react()],
  server: {
    port: WEB_PORT,
    strictPort: false,
    host: true,
    allowedHosts: ALLOWED_HOST ? [ALLOWED_HOST] : [],
    // В dev фронт и API живут на разных портах: проксируем, чтобы в коде
    // остались относительные пути и сборка для киоска работала без правок.
    proxy: {
      "/public": API,
      "/cms": API,
      "/health": API,
      "/media/uploads": API
    }
  },
  build: {
    target: "es2020",
    chunkSizeWarningLimit: 1100
  }
});
