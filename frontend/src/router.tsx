import { createBrowserRouter, Navigate, useRouteError } from "react-router-dom";
import type { ComponentType } from "react";
import { CatalogProvider } from "./stores/catalogStore";

/** Каждый раздел — отдельный чанк: панель стартует быстро даже на слабом мини-ПК. */
function route<T extends Record<string, unknown>, K extends keyof T>(loader: () => Promise<T>, name: K) {
  return async () => {
    const module = await loader();
    return { Component: module[name] as ComponentType };
  };
}

function LoadingPage() {
  return (
    <main className="loading-screen" aria-busy="true">
      <div className="spinner" />
      <span style={{ color: "var(--text-faint)", letterSpacing: "0.1em" }}>Открываем тридевятое царство…</span>
    </main>
  );
}

function ErrorPage() {
  const error = useRouteError();
  const message = error instanceof Error ? error.message : "Страница не найдена или временно недоступна.";
  return (
    <main className="loading-screen">
      <div className="glass" style={{ padding: 44, textAlign: "center", maxWidth: 600 }}>
        <div style={{ fontSize: "3.4rem", marginBottom: 14 }}>🏚️</div>
        <h1 style={{ marginBottom: 14 }}>Избушка повернулась не тем боком</h1>
        <p style={{ color: "var(--text-dim)", marginBottom: 28 }}>{message}</p>
        <a className="btn btn--primary btn--lg" href="/">
          На заставку
        </a>
      </div>
    </main>
  );
}

const withCatalogs = (Component: ComponentType) => () => (
  <CatalogProvider>
    <Component />
  </CatalogProvider>
);

export const appRouter = createBrowserRouter([
  {
    path: "/",
    errorElement: <ErrorPage />,
    hydrateFallbackElement: <LoadingPage />,
    lazy: async () => {
      const { StartPage } = await import("./pages/StartPage");
      return { Component: withCatalogs(StartPage) };
    }
  },
  {
    path: "/admin",
    errorElement: <ErrorPage />,
    hydrateFallbackElement: <LoadingPage />,
    lazy: async () => {
      const { AdminPage } = await import("./pages/AdminPage");
      return { Component: withCatalogs(AdminPage) };
    }
  },
  {
    path: "/",
    errorElement: <ErrorPage />,
    hydrateFallbackElement: <LoadingPage />,
    lazy: async () => {
      const { AppLayout } = await import("./components/Layout");
      return { Component: withCatalogs(AppLayout) };
    },
    children: [
      { path: "home", hydrateFallbackElement: <LoadingPage />, lazy: route(() => import("./pages/HomePage"), "HomePage") },
      { path: "ages", hydrateFallbackElement: <LoadingPage />, lazy: route(() => import("./pages/AgesPage"), "AgesPage") },
      { path: "tales", hydrateFallbackElement: <LoadingPage />, lazy: route(() => import("./pages/TalesPage"), "TalesPage") },
      { path: "heroes", hydrateFallbackElement: <LoadingPage />, lazy: route(() => import("./pages/HeroesPage"), "HeroesPage") },
      {
        path: "traditions",
        hydrateFallbackElement: <LoadingPage />,
        lazy: route(() => import("./pages/TraditionsPage"), "TraditionsPage")
      },
      {
        path: "dictionary",
        hydrateFallbackElement: <LoadingPage />,
        lazy: route(() => import("./pages/DictionaryPage"), "DictionaryPage")
      },
      { path: "quiz", hydrateFallbackElement: <LoadingPage />, lazy: route(() => import("./pages/QuizPage"), "QuizPage") },
      { path: "games", hydrateFallbackElement: <LoadingPage />, lazy: route(() => import("./pages/GamesPage"), "GamesPage") },
      {
        path: "gallery",
        hydrateFallbackElement: <LoadingPage />,
        lazy: route(() => import("./pages/GalleryPage"), "GalleryPage")
      },
      {
        path: "library",
        hydrateFallbackElement: <LoadingPage />,
        lazy: route(() => import("./pages/LibraryPage"), "LibraryPage")
      },
      { path: "*", element: <Navigate to="/home" replace /> }
    ]
  }
]);
