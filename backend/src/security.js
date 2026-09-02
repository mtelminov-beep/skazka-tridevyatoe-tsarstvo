import { randomBytes, timingSafeEqual } from "node:crypto";

const DEFAULT_ADMIN_USER = "admin";
const DEFAULT_ADMIN_PASSWORD = "admin";
const SESSION_TTL_MS = Number(process.env.CMS_SESSION_TTL_MINUTES || 8 * 60) * 60 * 1000;

/** @type {Map<string, { username: string, expiresAt: number }>} */
const sessions = new Map();

function nowIso() {
  return new Date().toISOString();
}

function sendAuthFail(res, code, message) {
  res.status(401).json({ error: { code, message }, meta: { version: nowIso() } });
}

function sendAuthData(res, data) {
  res.json({ data, meta: { version: nowIso() } });
}

/** Сравнение секретов без утечки по времени. */
function safeMatches(actual, expected) {
  if (typeof actual !== "string" || typeof expected !== "string") return false;
  const a = Buffer.from(actual, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function cmsTokenMatches(header, expected) {
  if (typeof expected !== "string" || expected.length === 0) return false;
  return safeMatches(header, expected);
}

function readCredentials() {
  return {
    username: process.env.CMS_ADMIN_USER || DEFAULT_ADMIN_USER,
    password: process.env.CMS_ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD
  };
}

function createSession(username) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + SESSION_TTL_MS;
  sessions.set(token, { username, expiresAt });
  return { token, expiresAt };
}

function readSession(req) {
  const token = req.header("x-cms-session");
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }
  return { token, ...session };
}

export function loginCms(req, res) {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const username = typeof body.username === "string" ? body.username : "";
  const password = typeof body.password === "string" ? body.password : "";
  const expected = readCredentials();

  if (!safeMatches(username, expected.username) || !safeMatches(password, expected.password)) {
    sendAuthFail(res, "CMS_LOGIN_FAILED", "Неверный логин или пароль");
    return;
  }

  const session = createSession(username);
  sendAuthData(res, {
    username,
    token: session.token,
    expires_at: new Date(session.expiresAt).toISOString()
  });
}

export function getCmsSession(req, res) {
  const session = readSession(req);
  if (!session) {
    sendAuthFail(res, "CMS_SESSION_EXPIRED", "Сессия админки истекла или не найдена");
    return;
  }
  sendAuthData(res, {
    username: session.username,
    expires_at: new Date(session.expiresAt).toISOString()
  });
}

export function logoutCms(req, res) {
  const token = req.header("x-cms-session");
  if (token) sessions.delete(token);
  sendAuthData(res, { logged_out: true });
}

/**
 * Middleware для защищённых CMS-маршрутов.
 * Основной доступ — сессия после входа по логину и паролю.
 * X-CMS-Token оставлен для автоматизации (выгрузка резервных копий по расписанию).
 */
export function requireCmsAuth(req, res, next) {
  if (readSession(req)) {
    next();
    return;
  }

  const expected = process.env.CMS_TOKEN;
  const header = req.header("x-cms-token") ?? undefined;
  if (expected && cmsTokenMatches(header, expected)) {
    next();
    return;
  }

  sendAuthFail(res, "CMS_UNAUTHORIZED", "Войдите в админку");
}
