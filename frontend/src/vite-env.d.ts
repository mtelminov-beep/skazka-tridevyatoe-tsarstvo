/// <reference types="vite/client" />

interface Window {
  tridevyatoeApp?: {
    quit: () => void;
    cmsBase: () => string;
    licenseStatus: () => Promise<import("./nativeLicense").LicenseStatus>;
    activateLicense: (license: string) => Promise<{ status: import("./nativeLicense").LicenseStatus }>;
  };
}

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
