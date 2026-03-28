const fs = require("fs/promises");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const LOCAL_UPLOAD_ROOT = path.join(ROOT_DIR, "images", "uploads-local");
const LOCAL_META_ROOT = path.join(ROOT_DIR, ".local-data");
const LOCAL_HIDDEN_PATH = path.join(LOCAL_META_ROOT, "hidden.json");

function isLocalDevRuntime() {
  return process.env.LOCAL_DEV === "1" || process.env.LOCAL_DEV_STORAGE === "1";
}

function getAdminCredentials() {
  return {
    user: process.env.ADMIN_USERNAME || (isLocalDevRuntime() ? "admin" : ""),
    pass: process.env.ADMIN_PASSWORD || (isLocalDevRuntime() ? "admin" : ""),
  };
}

function sanitizeFilename(name) {
  const cleaned = String(name || "")
    .replace(/\.{2,}/g, "")
    .replace(/[\\/]/g, "_")
    .replace(/[^a-z0-9_.-]/gi, "_")
    .replace(/^\.+/, "")
    .slice(0, 120);

  const dot = cleaned.lastIndexOf(".");
  if (dot <= 0 || dot === cleaned.length - 1) {
    return "upload.jpg";
  }

  const base = cleaned.slice(0, dot);
  const ext = cleaned.slice(dot + 1).toLowerCase();
  return `${base}.${ext}`;
}

function sanitizeSegment(value, fallback = "portfolio") {
  const cleaned = String(value || "")
    .toLowerCase()
    .replace(/\.{2,}/g, "")
    .replace(/[\\/]/g, "-")
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return cleaned || fallback;
}

function createLocalPathname(alt, filename) {
  const safeAlt = sanitizeSegment(alt, "portfolio");
  const safeFilename = sanitizeFilename(filename);
  return path.posix.join("portfolio", safeAlt, safeFilename);
}

function parseLocalPathname(pathnameValue) {
  const pathname = String(pathnameValue || "").replace(/\\/g, "/");
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 3 || parts[0] !== "portfolio") return null;
  const alt = sanitizeSegment(parts[1], "portfolio");
  const filename = sanitizeFilename(parts.slice(2).join("_"));
  return { alt, filename, pathname: path.posix.join("portfolio", alt, filename) };
}

function localPathnameToFsPath(pathnameValue) {
  const parsed = parseLocalPathname(pathnameValue);
  if (!parsed) return null;
  return path.join(LOCAL_UPLOAD_ROOT, parsed.alt, parsed.filename);
}

function localPathnameToUrl(pathnameValue) {
  const parsed = parseLocalPathname(pathnameValue);
  if (!parsed) return null;
  return `/${path.posix.join("images", "uploads-local", parsed.alt, parsed.filename)}`;
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function saveLocalUpload(req, { alt, filename, maxBytes }) {
  const pathname = createLocalPathname(alt, filename);
  const filePath = localPathnameToFsPath(pathname);
  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) {
      throw new Error("file_too_large");
    }
    chunks.push(chunk);
  }

  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, Buffer.concat(chunks));

  return {
    pathname,
    url: localPathnameToUrl(pathname),
  };
}

async function listLocalUploads() {
  try {
    await ensureDir(LOCAL_UPLOAD_ROOT);
    const categoryEntries = await fs.readdir(LOCAL_UPLOAD_ROOT, { withFileTypes: true });
    const items = [];

    for (const categoryEntry of categoryEntries) {
      if (!categoryEntry.isDirectory()) continue;
      const alt = sanitizeSegment(categoryEntry.name, "portfolio");
      const categoryPath = path.join(LOCAL_UPLOAD_ROOT, categoryEntry.name);
      const fileEntries = await fs.readdir(categoryPath, { withFileTypes: true });

      for (const fileEntry of fileEntries) {
        if (!fileEntry.isFile()) continue;
        const pathname = createLocalPathname(alt, fileEntry.name);
        const filePath = path.join(categoryPath, fileEntry.name);
        const stats = await fs.stat(filePath);
        items.push({
          alt,
          pathname,
          url: localPathnameToUrl(pathname),
          mtimeMs: stats.mtimeMs,
        });
      }
    }

    items.sort((a, b) => b.mtimeMs - a.mtimeMs);
    return items.map(({ mtimeMs, ...item }) => item);
  } catch {
    return [];
  }
}

async function deleteLocalUpload(pathnameValue) {
  const filePath = localPathnameToFsPath(pathnameValue);
  if (!filePath) return false;
  try {
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readLocalHiddenList() {
  try {
    const raw = await fs.readFile(LOCAL_HIDDEN_PATH, "utf8");
    const json = JSON.parse(raw || "{}");
    if (Array.isArray(json.items)) return json.items;
    if (Array.isArray(json)) return json;
    return [];
  } catch {
    return [];
  }
}

async function writeLocalHiddenList(items) {
  await ensureDir(LOCAL_META_ROOT);
  await fs.writeFile(LOCAL_HIDDEN_PATH, JSON.stringify({ items }, null, 2), "utf8");
}

module.exports = {
  createLocalPathname,
  deleteLocalUpload,
  getAdminCredentials,
  isLocalDevRuntime,
  listLocalUploads,
  localPathnameToUrl,
  readLocalHiddenList,
  sanitizeFilename,
  sanitizeSegment,
  saveLocalUpload,
  writeLocalHiddenList,
};