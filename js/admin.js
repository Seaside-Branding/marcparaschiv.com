function qs(id) { return document.getElementById(id); }
function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

function getAuth() { return sessionStorage.getItem("adminAuth") || ""; }
function setAuth(user, pass) {
  const token = btoa(`${user}:${pass}`);
  sessionStorage.setItem("adminAuth", token);
  sessionStorage.setItem("adminUser", user);
}
function clearAuth() {
  sessionStorage.removeItem("adminAuth");
  sessionStorage.removeItem("adminUser");
}
function authHeader() {
  const token = getAuth();
  return token ? { Authorization: `Basic ${token}` } : {};
}

function isStaticDevServer() {
  const host = window.location.hostname;
  const port = window.location.port;
  return (host === "localhost" || host === "127.0.0.1") && port === "5500";
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, Object.assign({}, options, { signal: controller.signal }));
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function setStatus(el, message, append = false) {
  if (!el) return;
  const nextMessage = String(message || "");
  if (append && el.textContent) {
    el.textContent += `\n${nextMessage}`;
    return;
  }
  el.textContent = nextMessage;
}

function clearStatusBoxes() {
  setStatus(qs("loginStatus"), "");
  setStatus(qs("status"), "");
  setStatus(qs("manageStatus"), "");
}

function handleUnauthorized(statusTargetEl) {
  clearAuth();
  showLogin();
  qs("password").value = "";
  setStatus(statusTargetEl, "");
  setStatus(qs("loginStatus"), "Session expired. Please sign in again.");
}

async function apiFetch(url, options = {}) {
  const headers = Object.assign({}, options.headers || {}, authHeader());
  return fetchWithTimeout(url, Object.assign({}, options, { headers }));
}

async function checkAuth() {
  if (!getAuth() || isStaticDevServer()) return false;
  try {
    const response = await apiFetch("/api/auth-check", { method: "POST" });
    return response.ok;
  } catch {
    return false;
  }
}

function showApp() {
  qs("login").style.display = "none";
  qs("app").style.display = "block";
  qs("who").textContent = sessionStorage.getItem("adminUser") || "";
}
function showLogin() {
  qs("login").style.display = "block";
  qs("app").style.display = "none";
}

function wireTabs() {
  const buttons = qsa(".nav button");
  buttons.forEach((btn) => btn.addEventListener("click", () => {
    buttons.forEach((button) => button.classList.remove("active"));
    btn.classList.add("active");
    const id = btn.dataset.tab;
    qsa(".section").forEach((section) => section.classList.remove("active"));
    qs(id).classList.add("active");
    if (id === "manage") {
      renderBlobGrid();
      renderLocalGrid();
    }
  }));
}

async function uploadFiles() {
  const category = qs("category").value;
  const input = qs("files");
  const box = qs("status");
  const btn = qs("uploadBtn");

  setStatus(box, "");

  if (isStaticDevServer()) {
    setStatus(box, "Uploads are unavailable on Five Server. Run the admin against a backend that serves /api routes.");
    return;
  }
  if (!getAuth()) {
    setStatus(box, "Please sign in first");
    return;
  }
  if (!input.files || input.files.length === 0) {
    setStatus(box, "Select at least one image");
    return;
  }

  btn.disabled = true;
  try {
    for (const file of input.files) {
      const name = encodeURIComponent(file.name);
      const contentType = encodeURIComponent(file.type || "application/octet-stream");
      const alt = encodeURIComponent(category);
      const url = `/api/upload?filename=${name}&contentType=${contentType}&alt=${alt}`;

      try {
        const response = await apiFetch(url, {
          method: "POST",
          body: file,
        });

        if (response.status === 401) {
          handleUnauthorized(box);
          return;
        }
        if (!response.ok) {
          const message = await response.text().catch(() => "");
          setStatus(box, `${file.name} -> failed ${response.status} ${message}`.trim(), true);
          continue;
        }

        const data = await response.json().catch(() => ({}));
        setStatus(box, `${file.name} -> ${data.url || "uploaded"}`, true);
      } catch {
        setStatus(box, `${file.name} -> failed (network or timeout)`, true);
      }
    }

    setStatus(box, "Done.", true);
    input.value = "";
  } finally {
    btn.disabled = false;
  }
}

async function renderBlobGrid() {
  const grid = qs("blobGrid");
  const box = qs("manageStatus");
  grid.innerHTML = "";

  if (isStaticDevServer()) {
    setStatus(box, "Cloud uploads are unavailable on Five Server because /api/list is not mounted in static local serving.");
    return;
  }

  try {
    const response = await apiFetch("/api/list");
    if (response.status === 401) {
      handleUnauthorized(box);
      return;
    }
    if (!response.ok) {
      setStatus(box, `Failed to load cloud images (${response.status})`);
      return;
    }

    const data = await response.json().catch(() => ({ items: [] }));
    const items = Array.isArray(data.items) ? data.items : [];
    setStatus(box, items.length ? "" : "No cloud images found.");

    for (const item of items) {
      const tile = document.createElement("div");
      tile.className = "tile";

      const img = document.createElement("img");
      img.src = item.url;
      img.alt = item.alt || "";

      const meta = document.createElement("div");
      meta.className = "meta";

      const span = document.createElement("span");
      span.textContent = item.alt || "portfolio";

      const del = document.createElement("button");
      del.className = "danger";
      del.textContent = "Delete";
      del.addEventListener("click", async () => {
        if (!confirm("Delete this image?")) return;
        del.disabled = true;
        try {
          const result = await apiFetch(`/api/delete?pathname=${encodeURIComponent(item.pathname)}&all=true`, {
            method: "DELETE",
          });
          if (result.status === 401) {
            handleUnauthorized(box);
            return;
          }
          if (!result.ok) {
            const message = await result.text().catch(() => "");
            setStatus(box, `Delete failed (${result.status}) ${message}`.trim());
            return;
          }
          setStatus(box, "Image deleted.");
          await renderBlobGrid();
        } catch {
          setStatus(box, "Delete failed due to a network error.");
        } finally {
          del.disabled = false;
        }
      });

      meta.appendChild(span);
      meta.appendChild(del);
      tile.appendChild(img);
      tile.appendChild(meta);
      grid.appendChild(tile);
    }
  } catch {
    setStatus(box, "Failed to load cloud images due to a network error.");
  }
}

async function getHideList() {
  if (isStaticDevServer()) return [];
  try {
    const response = await fetchWithTimeout("/api/hide-list");
    if (!response.ok) return [];
    const json = await response.json().catch(() => ({}));
    return Array.isArray(json.items) ? json.items : [];
  } catch {
    return [];
  }
}

async function setHideList(list) {
  if (isStaticDevServer()) return false;
  try {
    const response = await apiFetch("/api/hide-list", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: list }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function renderLocalGrid() {
  const grid = qs("localGrid");
  const box = qs("manageStatus");
  grid.innerHTML = "";

  const notices = [];
  if (isStaticDevServer()) {
    notices.push("Hide and unhide actions are disabled on Five Server because /api/hide-list is not available.");
  }

  const hiddenItems = await getHideList();

  try {
    const response = await fetchWithTimeout("/index.html");
    if (!response.ok) {
      setStatus(box, `Failed to inspect local gallery markup (${response.status}).`);
      return;
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    const srcs = new Set();

    qsa("img.gallery-img", doc).forEach((img) => {
      const src = img.getAttribute("src") || "";
      if (src.startsWith("images/")) srcs.add(src);
    });

    if (!srcs.size) {
      notices.push("No local gallery images found.");
    }

    for (const src of srcs) {
      const tile = document.createElement("div");
      tile.className = "tile";

      const img = document.createElement("img");
      img.src = src;
      img.alt = src.split("/").pop() || "local image";

      const meta = document.createElement("div");
      meta.className = "meta";

      const span = document.createElement("span");
      span.textContent = src.split("/").pop() || src;

      const toggle = document.createElement("button");
      const isHidden = hiddenItems.includes(src);
      toggle.className = "ghost";
      toggle.textContent = isHidden ? "Unhide" : "Hide";
      toggle.disabled = isStaticDevServer();
      toggle.addEventListener("click", async () => {
        toggle.disabled = true;
        try {
          const next = new Set(await getHideList());
          if (next.has(src)) {
            next.delete(src);
          } else {
            next.add(src);
          }
          const updated = await setHideList(Array.from(next));
          if (!updated) {
            setStatus(box, "Failed to update hide list.");
            return;
          }
          setStatus(box, `Updated visibility for ${span.textContent}.`);
          await renderLocalGrid();
        } finally {
          toggle.disabled = false;
        }
      });

      meta.appendChild(span);
      meta.appendChild(toggle);
      tile.appendChild(img);
      tile.appendChild(meta);
      grid.appendChild(tile);
    }

    setStatus(box, notices.join("\n"));
  } catch {
    const message = notices.concat("Failed to inspect the local gallery due to a network error.").join("\n");
    setStatus(box, message);
  }
}

function wireAuth() {
  async function handleLogin() {
    const username = qs("username").value.trim();
    const password = qs("password").value.trim();
    const statusEl = qs("loginStatus");
    const loginBtn = qs("loginBtn");

    if (isStaticDevServer()) {
      setStatus(statusEl, "Admin auth cannot run on Five Server. Use the deployed site or a local backend runtime that serves /api routes.");
      return;
    }
    if (!username || !password) {
      setStatus(statusEl, "Missing username or password");
      return;
    }

    loginBtn.disabled = true;
    setAuth(username, password);
    try {
      const ok = await checkAuth();
      if (!ok) {
        clearAuth();
        setStatus(statusEl, "Invalid username or password");
        return;
      }
      qs("password").value = "";
      clearStatusBoxes();
      setStatus(statusEl, "Signed in");
      showApp();
      await renderBlobGrid();
      await renderLocalGrid();
    } finally {
      loginBtn.disabled = false;
    }
  }

  qs("loginBtn").addEventListener("click", handleLogin);
  [qs("username"), qs("password")].forEach((input) => {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleLogin();
      }
    });
  });

  qs("logout").addEventListener("click", () => {
    clearAuth();
    qs("password").value = "";
    clearStatusBoxes();
    showLogin();
  });
}

window.addEventListener("DOMContentLoaded", () => {
  if (!getAuth()) {
    const legacyToken = localStorage.getItem("adminAuth");
    const legacyUser = localStorage.getItem("adminUser");
    if (legacyToken) sessionStorage.setItem("adminAuth", legacyToken);
    if (legacyUser) sessionStorage.setItem("adminUser", legacyUser);
  }
  localStorage.removeItem("adminAuth");
  localStorage.removeItem("adminUser");

  wireTabs();
  wireAuth();

  (async () => {
    if (getAuth() && await checkAuth()) {
      clearStatusBoxes();
      showApp();
      await renderBlobGrid();
      await renderLocalGrid();
    } else {
      showLogin();
      if (isStaticDevServer()) {
        setStatus(qs("loginStatus"), "Admin APIs are unavailable on Five Server. Use a backend runtime to test login, upload, delete, and hide-list actions.");
      }
    }
  })();

  const uploadBtn = qs("uploadBtn");
  if (uploadBtn) uploadBtn.addEventListener("click", uploadFiles);
});
