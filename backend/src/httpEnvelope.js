/** Единый конверт ответов API: { data, meta } либо { error, meta }. */

/** @param {import("express").Request} req */
export function makeMeta(req) {
  return {
    version: new Date().toISOString(),
    locale: typeof req.query.locale === "string" ? req.query.locale : "ru-RU"
  };
}

/**
 * @param {import("express").Response} res
 * @param {import("express").Request} req
 * @param {unknown} data
 */
export function sendData(res, req, data) {
  res.json({ data, meta: makeMeta(req) });
}

/**
 * @param {import("express").Response} res
 * @param {import("express").Request} req
 * @param {number} status
 * @param {string} code
 * @param {string} message
 */
export function sendFail(res, req, status, code, message) {
  res.status(status).json({ error: { code, message }, meta: makeMeta(req) });
}
