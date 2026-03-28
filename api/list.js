const { list } = require("@vercel/blob");
const { isLocalDevRuntime, listLocalUploads } = require("./_local-dev");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET");
    res.end("Method Not Allowed");
    return;
  }

  try {
    if (isLocalDevRuntime()) {
      const items = await listLocalUploads();
      res.statusCode = 200;
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ items }));
      return;
    }

    const result = await list({ prefix: "portfolio/" });
    const blobs = Array.isArray(result.blobs) ? result.blobs : [];
    function extractMeta(pathname) {
      let alt = "portfolio";
      const segs = pathname.split("/");
      const last = segs[segs.length - 1] || "";
      const m = last.match(/__alt-([^_]+)__/);
      if (m && m[1]) {
        alt = m[1];
      } else if (segs.length >= 3) {
        alt = segs[1]; // portfolio/<alt>/<file>
      }
      let base = last;
      if (m && m[0]) {
        base = last.substring(m[0].length); // strip prefix marker
      }
      base = base.replace(/-[a-f0-9]{6,}(?=\.[^.]+$)/i, ""); // strip random suffix before extension
      return { alt, base: base.toLowerCase() };
    }
    const seen = new Set();
    const items = [];
    for (const b of blobs) {
      const meta = extractMeta(b.pathname);
      const key = `${meta.alt}/${meta.base}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({ url: b.url, alt: meta.alt, pathname: b.pathname });
    }
    items.reverse();
    res.statusCode = 200;
    res.setHeader("Cache-Control", "public, max-age=30, s-maxage=60, stale-while-revalidate=300");
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ items }));
  } catch (e) {
    console.error("list_failed", e);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "list_failed" }));
  }
};
