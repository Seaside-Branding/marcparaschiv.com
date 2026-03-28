# marcparaschiv.com

Static portfolio site with a serverless admin panel for uploading and managing images. Deployed on Vercel with Vercel Blob storage.

---

## Local development

**Requirements:** Node.js ≥ 18

```bash
npm install
```

Optionally copy `.env.example` to `.env.local` and set custom credentials. If you skip this step, the defaults `admin` / `admin` are used automatically.

```bash
cp .env.example .env.local
```

Start the local dev server:

```bash
npm run dev
```

| URL | Page |
|---|---|
| `http://127.0.0.1:3000` | Main site |
| `http://127.0.0.1:3000/admin/` | Admin panel |

Local uploads are saved to `images/uploads-local/<category>/` and the hidden-image list persists to `.local-data/hidden.json`. Both directories are gitignored and created automatically on first use.

---

## Environment variables

### Local (`.env.local`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port the dev server listens on |
| `ADMIN_USERNAME` | `admin` | Admin login username |
| `ADMIN_PASSWORD` | `admin` | Admin login password |

`LOCAL_DEV` is set automatically by the dev server — do not set it manually.

### Production (Vercel)

Set these under **Project Settings → Environment Variables** in the Vercel dashboard:

| Variable | Description |
|---|---|
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token — auto-injected if you connect a Blob store via the Vercel dashboard |
| `ADMIN_USERNAME` | Admin login username |
| `ADMIN_PASSWORD` | Admin login password |

---

## Deployment

Push the repository to GitHub, then import the project in Vercel. Vercel detects the `api/` directory and deploys each file as a serverless function automatically.

**Files committed to GitHub:** all source files — HTML, CSS, JS, `api/`, `local-dev-server.js`, `package.json`, `.env.example`, `robots.txt`, `sitemap.xml`, `images/` (excluding `images/uploads-local/`).

**Files NOT committed** (gitignored):

| Path | Reason |
|---|---|
| `node_modules/` | Installed by `npm install` |
| `.env.local` | Local secrets |
| `.local-data/` | Local hidden-image list |
| `images/uploads-local/` | Locally uploaded files |
| `.vercel/` | Vercel CLI cache |
| `*.log` | Log files |

---

## Project structure

```
api/                  Serverless API handlers (deployed by Vercel)
  _local-dev.js       Local dev storage helpers (not a route)
  auth-check.js       POST /api/auth-check
  delete.js           DELETE /api/delete
  hide-list.js        GET/PUT /api/hide-list
  list.js             GET /api/list
  upload.js           POST /api/upload
admin/
  index.html          Admin panel
css/
  style.css
images/
  highres/
  RENDERS/
js/
  admin.js
  index.js
local-dev-server.js   Same-origin HTTP dev server (local only)
.env.example          Template for local environment variables
```
