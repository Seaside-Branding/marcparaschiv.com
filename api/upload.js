const { put } = require("@vercel/blob");
const {
  getAdminCredentials,
  isLocalDevRuntime,
  saveLocalUpload,
  sanitizeFilename,
  sanitizeSegment,
} = require("./_local-dev");

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

function parseBasicAuth(header) {
  if (!header || !header.startsWith("Basic ")) return null;
  try {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const idx = decoded.indexOf(":");
    if (idx === -1) return null;
    return { user: decoded.slice(0, idx), pass: decoded.slice(idx + 1) };
  } catch {
    return null;
  }
}

function safeEq(a, b) {
  const x = String(a || "");
  const y = String(b || "");
  if (x.length !== y.length) return false;
  let out = 0;
  for (let i = 0; i < x.length; i++) {
    out |= x.charCodeAt(i) ^ y.charCodeAt(i);
  }
  return out === 0;
}

function unauthorized(res) {
  res.statusCode = 401;
  res.setHeader("WWW-Authenticate", 'Basic realm="admin"');
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ error: "unauthorized" }));
}

function badRequest(res, msg) {
  res.statusCode = 400;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ error: msg || "bad_request" }));
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    res.end("Method Not Allowed");
    return;
  }

  const authHeader = req.headers["authorization"] || "";
  let ok = false;
  const { user: expectedUser, pass: expectedPass } = getAdminCredentials();
  const basic = parseBasicAuth(authHeader);
  if (basic && safeEq(basic.user, expectedUser) && safeEq(basic.pass, expectedPass)) ok = true;
  if (!ok && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    if (token && safeEq(token, expectedPass)) ok = true;
  }
  if (!ok) return unauthorized(res);

  const url = new URL(req.url, "http://localhost");
  const filename = url.searchParams.get("filename");
  const contentType = String(url.searchParams.get("contentType") || "").toLowerCase();
  const alt = url.searchParams.get("alt") || "portfolio";
  const contentLength = Number(req.headers["content-length"] || "0");

  if (!filename) {
    badRequest(res, "filename_required");
    return;
  }

  if (!ALLOWED_MIME.has(contentType)) {
    badRequest(res, "invalid_content_type");
    return;
  }

  if (Number.isFinite(contentLength) && contentLength > MAX_UPLOAD_BYTES) {
    res.statusCode = 413;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "file_too_large" }));
    return;
  }

  const base = sanitizeFilename(filename);
  const safeAlt = sanitizeSegment(alt, "portfolio");
  const path = `portfolio/${safeAlt}/${base}`;

  try {
    if (isLocalDevRuntime()) {
      const localUpload = await saveLocalUpload(req, {
        alt: safeAlt,
        filename: base,
        maxBytes: MAX_UPLOAD_BYTES,
      });
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(localUpload));
      return;
    }

    const blob = await put(path, req, {
      access: "public",
      contentType,
      addRandomSuffix: false,
      // Overwrite same-name uploads to avoid duplicates
      ifExists: "replace"
    });

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ url: blob.url, pathname: blob.pathname }));
  } catch (e) {
    console.error("upload_failed", e);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "upload_failed" }));
  }
};
