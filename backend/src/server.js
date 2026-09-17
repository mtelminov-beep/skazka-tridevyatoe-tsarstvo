import { createCmsApp } from "./app.js";
import { readNetworkSettings } from "./networkConfig.js";

// API_PORT — общее имя для бэкенда и фронта (Vite берёт его же для прокси),
// поэтому оба сервера поднимаются одной переменной. PORT оставлен для хостингов,
// которые задают его сами. 8803 не пересекается с соседними панелями на этой машине.
const networkConfigPath = process.env.CMS_NETWORK_CONFIG_PATH;
const storedNetwork = readNetworkSettings(networkConfigPath);
const PORT = Number(process.env.API_PORT || process.env.PORT || storedNetwork.port);
const HOST = process.env.HOST || storedNetwork.host;

createCmsApp({
  port: PORT,
  host: HOST,
  frontendDist: process.env.CMS_FRONTEND_DIST,
  networkConfigPath,
  onNetworkChange: (settings) => process.send?.({ type: "cms-network-change", settings })
}).listen(PORT, HOST, () => {
  console.log(`«Тридевятое царство» CMS API: http://${HOST}:${PORT}`);
  console.log("Админка защищена входом по логину и паролю (по умолчанию admin / admin)");
});
