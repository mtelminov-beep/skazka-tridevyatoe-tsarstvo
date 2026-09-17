/// <reference types="vite/client" />

interface Window {
  tridevyatoeApp?: { quit: () => void; cmsBase: () => string };
}

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
