import { registerPlugin } from "@capacitor/core";

export type LicenseStatus = {
  platform: "android" | "web";
  appId: string;
  packageName: string;
  manufacturer: string;
  model: string;
  deviceRequestId: string;
  requestCode: string;
  licensePresent: boolean;
  licenseValid: boolean;
  needsActivation: boolean;
  reason: string;
  licenseSummary: { customer: string; issuedAt: string; expiresAt: string | null; features: string[] } | null;
};

type ActivationResult = { status: LicenseStatus };

interface NativeLicensePlugin {
  getStatus(): Promise<LicenseStatus>;
  activate(options: { license: string }): Promise<ActivationResult>;
}

const browserStatus: LicenseStatus = {
  platform: "web",
  appId: "ru.tridevyatoe.skazki",
  packageName: "ru.tridevyatoe.skazki",
  manufacturer: "Браузер",
  model: "Режим разработки",
  deviceRequestId: "WEB-DEVELOPMENT",
  requestCode: "WEB-DEVELOPMENT",
  licensePresent: true,
  licenseValid: true,
  needsActivation: false,
  reason: "browser_bypass",
  licenseSummary: null
};

export const NativeLicense = registerPlugin<NativeLicensePlugin>("TridevyatoeLicense", {
  web: () => ({
    async getStatus() { return browserStatus; },
    async activate() { return { status: browserStatus }; }
  })
});
