function qs(id) { return document.getElementById(id); }
function qsa(sel, root=document) { return Array.from(root.querySelectorAll(sel)); }

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
  const t = getAuth();
  return t ? { "Authorization": "Basic " + t } : {};
}

async function checkAuth() {
  try {
    const r = await apiFetch("/api/auth-check", { method: "POST" });
    return r.ok;
  } catch {
    return false;
  }
}

async function apiFetch(url, options={}) {
  const headers = Object.assign({}, options.headers || {}, authHeader());
  return fetch(url, Object.assign({}, options, { headers }));
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
  const buttons = qsa(".tabs button");
  buttons.forEach(btn => btn.addEventListener("click", () => {
    buttons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const id = btn.dataset.tab;
    qsa(".section").forEach(s => s.classList.remove("active"));
    qs(id).classList.add("active");
  }));
}

async function uploadFiles() {
  const category = qs("category").value;
  const input = qs("files");
  const box = qs("status");
  box.textContent = "";

  if (!getAuth()) {
    box.textContent = "Please sign in first";
    return;
  }
  if (!input.files || input.files.length === 0) {
    box.textContent = "Select at least one image";
    return;
  }

  const btn = qs("uploadBtn");
  btn.disabled = true;
  try {
    for (const file of input.files) {
      const name = encodeURIComponent(file.name);
      const ct = encodeURIComponent(file.type || "application/octet-stream");
      const alt = encodeURIComponent(category);
      const url = `/api/upload?filename=${name}&contentType=${ct}&alt=${alt}`;
      const res = await apiFetch(url, {
        method: "POST",
        body: file
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        box.textContent += `\n${file.name} -> failed ${res.status} ${t}`;
        continue;
      }
      const data = await res.json();
      box.textContent += `\n${file.name} -> ${data.url}`;
    }
    box.textContent += "\nDone.";
  } catch (e) {
    box.textContent += "\nUnexpected error";
  } finally {
    btn.disabled = false;
  }
}

async function renderBlobGrid() {
  const grid = qs("blobGrid");
  grid.innerHTML = "";
  const res = await fetch("/api/list");
  if (!res.ok) {
    qs("status").textContent = `Failed to load cloud images (${res.status})`;
    return;
  }
  const data = await res.json().catch(() => ({ items: [] }));
  const items = Array.isArray(data.items) ? data.items : [];
  for (const it of items) {
    const tile = document.createElement("div");
    tile.className = "tile";
    const img = document.createElement("img");
    img.src = it.url;
    img.alt = it.alt || "";
    const meta = document.createElement("div");
    meta.className = "meta";
    const span = document.createElement("span");
    span.textContent = it.alt || "portfolio";
    const del = document.createElement("button");
    del.className = "danger";
    del.textContent = "Delete";
    del.addEventListener("click", async () => {
      if (!confirm("Delete this image?")) return;
      const r = await apiFetch(`/api/delete?pathname=${encodeURIComponent(it.pathname)}&all=true`, { method: "DELETE" });
      if (r.ok) {
        tile.remove();
        renderBlobGrid();
      }
    });
    meta.appendChild(span);
    meta.appendChild(del);
    tile.appendChild(img);
    tile.appendChild(meta);
    grid.appendChild(tile);
  }
}

async function getHideList() {
  const r = await fetch("/api/hide-list");
  if (!r.ok) return [];
  const j = await r.json().catch(() => ({}));
  return Array.isArray(j.items) ? j.items : [];
}
async function setHideList(list) {
  await apiFetch("/api/hide-list", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: list })
  });
}

async function renderLocalGrid() {
  const grid = qs("localGrid");
  grid.innerHTML = "";
  const hide = await getHideList();

  const html = await fetch("/index.html").then(r => r.text());
  const doc = new DOMParser().parseFromString(html, "text/html");
  const srcs = new Set();
  qsa("img.gallery-img", doc).forEach(img => {
    const s = img.getAttribute("src") || "";
    if (s.startsWith("images/")) srcs.add(s);
  });
  for (const src of srcs) {
    const tile = document.createElement("div");
    tile.className = "tile";
    const img = document.createElement("img");
    img.src = src;
    const meta = document.createElement("div");
    meta.className = "meta";
    const span = document.createElement("span");
    span.textContent = src.split("/").pop();
    const toggle = document.createElement("button");
    const isHidden = hide.includes(src);
    toggle.className = "ghost";
    toggle.textContent = isHidden ? "Unhide" : "Hide";
    toggle.addEventListener("click", async () => {
      const next = new Set(await getHideList());
      if (next.has(src)) next.delete(src); else next.add(src);
      await setHideList(Array.from(next));
      renderLocalGrid();
    });
    meta.appendChild(span);
    meta.appendChild(toggle);
    tile.appendChild(img);
    tile.appendChild(meta);
    grid.appendChild(tile);
  }
}

function wireAuth() {
  const loginBtn = qs("loginBtn");
  loginBtn.addEventListener("click", async () => {
    const u = qs("username").value.trim();
    const p = qs("password").value.trim();
    if (!u || !p) {
      qs("loginStatus").textContent = "Missing username or password";
      return;
    }
    setAuth(u, p);
    const ok = await checkAuth();
    if (!ok) {
      clearAuth();
      qs("loginStatus").textContent = "Invalid username or password";
      return;
    }
    qs("loginStatus").textContent = "Signed in";
    showApp();
    renderBlobGrid();
    renderLocalGrid();
  });
  qs("logout").addEventListener("click", () => {
    clearAuth();
    showLogin();
  });
}

window.addEventListener("DOMContentLoaded", () => {
  // Migrate legacy localStorage auth to sessionStorage once.
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
      showApp();
      renderBlobGrid();
      renderLocalGrid();
    } else {
      showLogin();
    }
  })();
  const ub = qs("uploadBtn");
  if (ub) ub.addEventListener("click", uploadFiles);
});
