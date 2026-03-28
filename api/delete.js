const { del, list } = require("@vercel/blob");

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

function canonicalKey(pathname) {
  try {
    const segs = pathname.split("/");
    const last = segs[segs.length - 1] || "";
    let alt = "portfolio";
    const m = last.match(/__alt-([^_]+)__/);
    let base = last;
    if (m && m[1]) {
      alt = m[1];
      base = last.substring(m[0].length);
    } else if (segs.length >= 3) {
      alt = segs[1];
    }
    base = base.replace(/-[a-f0-9]{6,}(?=\.[^.]+$)/i, "").toLowerCase();
    return `${alt}/${base}`;
  } catch {
    return pathname.toLowerCase();
  }
}

module.exports = async (req, res) => {
  if (req.method !== "DELETE") {
    res.statusCode = 405;
    res.setHeader("Allow", "DELETE");
    res.end("Method Not Allowed");
    return;
  }

  const creds = parseBasicAuth(req.headers["authorization"]);
  const expectedUser = process.env.ADMIN_USERNAME || "";
  const expectedPass = process.env.ADMIN_PASSWORD || "";
  if (!creds || !safeEq(creds.user, expectedUser) || !safeEq(creds.pass, expectedPass)) {
    unauthorized(res);
    return;
  }

  const url = new URL(req.url, "http://localhost");
  const pathname = url.searchParams.get("pathname");
  const all = url.searchParams.get("all") === "true";
  if (!pathname) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "pathname_required" }));
    return;
  }

  if (!pathname.startsWith("portfolio/")) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "invalid_pathname" }));
    return;
  }

  try {
    if (!all) {
      await del(pathname);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: true, count: 1 }));
    } else {
      const key = canonicalKey(pathname);
      const l = await list({ prefix: "portfolio/" });
      const blobs = Array.isArray(l.blobs) ? l.blobs : [];
      const toDelete = blobs.filter(b => canonicalKey(b.pathname) === key).map(b => b.pathname);
      for (const p of toDelete) {
        await del(p);
      }
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: true, count: toDelete.length }));
    }
  } catch (e) {
    console.error("delete_failed", e);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "delete_failed" }));
  }
};
