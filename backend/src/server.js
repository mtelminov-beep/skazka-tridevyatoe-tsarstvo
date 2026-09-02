import { createCmsApp } from "./app.js";

// API_PORT — общее имя для бэкенда и фронта (Vite берёт его же для прокси),
// поэтому оба сервера поднимаются одной переменной. PORT оставлен для хостингов,
// которые задают его сами. 8803 не пересекается с соседними панелями на этой машине.
const PORT = Number(process.env.API_PORT || process.env.PORT || 8803);
const HOST = process.env.HOST || "0.0.0.0";

createCmsApp({ port: PORT, host: HOST }).listen(PORT, HOST, () => {
  console.log(`«Тридевятое царство» CMS API: http://${HOST}:${PORT}`);
  console.log("Админка защищена входом по логину и паролю (по умолчанию admin / admin)");
});
