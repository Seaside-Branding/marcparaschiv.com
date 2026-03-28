const fs = require("fs");
const path = require("path");
const http = require("http");
const { URL } = require("url");

const ROOT_DIR = __dirname;
const HOST = process.env.HOST || "127.0.0.1";

function loadEnvFile(fileName) {
  const filePath = path.join(ROOT_DIR, fileName);
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

if (!process.env.LOCAL_DEV) {
  process.env.LOCAL_DEV = "1";
}

const PORT = Number(process.env.PORT || "3000");

const MIME_TYPES = {
  ".avif": "image/avif",
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".otf": "font/otf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".ttf": "font/ttf",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
};

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function safeResolveFromRoot(pathnameValue) {
  const decoded = decodeURIComponent(pathnameValue);
  const relative = decoded.replace(/^\/+/, "");
  const resolved = path.resolve(ROOT_DIR, relative);
  if (!resolved.startsWith(ROOT_DIR)) {
    return null;
  }
  return resolved;
}

function tryServeFile(filePath, req, res, statusCode) {
  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) {
      const fallback404 = path.join(ROOT_DIR, "404.html");
      if (filePath !== fallback404 && fs.existsSync(fallback404)) {
        tryServeFile(fallback404, req, res, 404);
        return;
      }
      sendJson(res, 404, { error: "not_found" });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.statusCode = statusCode || 200;
    res.setHeader("Content-Type", MIME_TYPES[ext] || "application/octet-stream");
    const stream = fs.createReadStream(filePath);
    stream.on("error", () => sendJson(res, 500, { error: "read_failed" }));
    if (req.method === "HEAD") {
      res.end();
      stream.destroy();
      return;
    }
    stream.pipe(res);
  });
}

function serveStatic(req, res, pathnameValue) {
  let targetPath = pathnameValue === "/" ? "/index.html" : pathnameValue;
  if (targetPath === "/admin") {
    targetPath = "/admin/index.html";
  }

  const resolved = safeResolveFromRoot(targetPath);
  if (!resolved) {
    sendJson(res, 400, { error: "invalid_path" });
    return;
  }

  fs.stat(resolved, (error, stats) => {
    if (!error && stats.isDirectory()) {
      tryServeFile(path.join(resolved, "index.html"), req, res);
      return;
    }
    if (!error && stats.isFile()) {
      tryServeFile(resolved, req, res);
      return;
    }
    tryServeFile(resolved, req, res);
  });
}

async function handleApi(req, res, pathnameValue) {
  const apiName = pathnameValue.replace(/^\/api\//, "");
  if (!/^[a-z0-9-]+$/i.test(apiName)) {
    sendJson(res, 404, { error: "unknown_api" });
    return;
  }

  const handlerPath = path.join(ROOT_DIR, "api", `${apiName}.js`);
  if (!fs.existsSync(handlerPath)) {
    sendJson(res, 404, { error: "unknown_api" });
    return;
  }

  try {
    delete require.cache[require.resolve(handlerPath)];
    delete require.cache[require.resolve(path.join(ROOT_DIR, "api", "_local-dev.js"))];
  } catch {
    // Ignore cache invalidation failures.
  }

  try {
    const handler = require(handlerPath);
    await handler(req, res);
  } catch (error) {
    console.error("local_api_failed", apiName, error);
    if (!res.headersSent) {
      sendJson(res, 500, { error: "local_api_failed" });
    } else {
      res.end();
    }
  }
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
  const pathnameValue = requestUrl.pathname;

  if (pathnameValue.startsWith("/api/")) {
    await handleApi(req, res, pathnameValue);
    return;
  }

  serveStatic(req, res, pathnameValue);
});

server.listen(PORT, HOST, () => {
  console.log(`Local dev server running at http://${HOST}:${PORT}`);
  console.log("Local admin defaults to admin/admin unless ADMIN_USERNAME and ADMIN_PASSWORD are set in .env.local.");
});