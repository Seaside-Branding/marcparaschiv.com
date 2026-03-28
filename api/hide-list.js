const { list, put } = require("@vercel/blob");

const HIDDEN_PATH = "portfolio/_meta/hidden.json";
const MAX_BODY_BYTES = 128 * 1024;

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

function isValidHidePath(value) {
  if (typeof value !== "string") return false;
  if (!value.startsWith("images/")) return false;
  if (value.includes("..") || value.includes("\\")) return false;
  return /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(value);
}

function unauthorized(res) {
  res.statusCode = 401;
  res.setHeader("WWW-Authenticate", 'Basic realm="admin"');
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ error: "unauthorized" }));
}

async function readHidden() {
  const l = await list({ prefix: HIDDEN_PATH });
  const found = (l.blobs || []).find(b => b.pathname === HIDDEN_PATH);
  if (!found) return [];
  try {
    const r = await fetch(found.url);
    if (!r.ok) return [];
    const json = await r.json().catch(() => null);
    if (json && Array.isArray(json.items)) return json.items;
    if (Array.isArray(json)) return json;
    return [];
  } catch {
    return [];
  }
}

async function writeHidden(items) {
  const body = JSON.stringify({ items });
  await put(HIDDEN_PATH, body, {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true
  });
}

module.exports = async (req, res) => {
  if (req.method === "GET") {
    try {
      const items = await readHidden();
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ items }));
    } catch {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ items: [] }));
    }
    return;
  }

  if (req.method === "PUT") {
    const creds = parseBasicAuth(req.headers["authorization"]);
    const expectedUser = process.env.ADMIN_USERNAME || "";
    const expectedPass = process.env.ADMIN_PASSWORD || "";
    if (!creds || !safeEq(creds.user, expectedUser) || !safeEq(creds.pass, expectedPass)) {
      return unauthorized(res);
    }

    const contentLength = Number(req.headers["content-length"] || "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      res.statusCode = 413;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "payload_too_large" }));
      return;
    }

    try {
      const raw = await new Promise((resolve, reject) => {
        let data = "";
        req.setEncoding("utf8");
        req.on("data", (c) => {
          data += c;
          if (data.length > MAX_BODY_BYTES) {
            reject(new Error("payload_too_large"));
          }
        });
        req.on("end", () => resolve(data));
        req.on("error", reject);
      });
      let payload = {};
      try { payload = JSON.parse(raw || "{}"); } catch { payload = {}; }
      const current = await readHidden();
      let next = current.slice();
      if (Array.isArray(payload.items)) {
        next = payload.items.filter(isValidHidePath);
      } else {
        if (Array.isArray(payload.add)) {
          for (const u of payload.add) {
            if (isValidHidePath(u) && !next.includes(u)) next.push(u);
          }
        }
        if (Array.isArray(payload.remove)) {
          const removeSet = new Set(payload.remove.filter(isValidHidePath));
          next = next.filter(u => !removeSet.has(u));
        }
      }
      await writeHidden(next);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ items: next }));
    } catch (e) {
      if (String(e && e.message) === "payload_too_large") {
        res.statusCode = 413;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "payload_too_large" }));
        return;
      }

      console.error("hide_list_update_failed", e);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "update_failed" }));
    }
    return;
  }

  res.statusCode = 405;
  res.setHeader("Allow", "GET, PUT");
  res.end("Method Not Allowed");
};
