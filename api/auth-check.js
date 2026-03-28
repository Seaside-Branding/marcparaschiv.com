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

const { getAdminCredentials } = require("./_local-dev");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    res.end("Method Not Allowed");
    return;
  }

  const creds = parseBasicAuth(req.headers["authorization"]);
  const { user: expectedUser, pass: expectedPass } = getAdminCredentials();
  if (!creds || !safeEq(creds.user, expectedUser) || !safeEq(creds.pass, expectedPass)) {
    res.statusCode = 401;
    res.setHeader("WWW-Authenticate", 'Basic realm="admin"');
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false }));
    return;
  }
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ ok: true }));
};
