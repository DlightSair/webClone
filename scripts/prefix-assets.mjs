// Post-build step for GitHub Pages project sites (served from /<repo>/).
// Next prefixes routes and /_next assets with basePath, but not root-relative URLs of files in /public
// (e.g. "/media/x.jpg", "/fonts/y.woff2"). This rewrites exactly those URLs, using the real list of
// files in /public so routes such as /shop/<id> are never touched.
//
//   BASE_PATH=/webClone node scripts/prefix-assets.mjs <exported-dir>
import fs from "node:fs";
import path from "node:path";

const base = (process.env.BASE_PATH || "").replace(/\/$/, "");
const outDir = path.resolve(process.argv[2] || ".next-export");

if (!base) {
  console.log("[prefix-assets] BASE_PATH is empty (root site) - nothing to rewrite");
  process.exit(0);
}
if (!fs.existsSync(outDir)) {
  console.error(`[prefix-assets] export directory not found: ${outDir}`);
  process.exit(1);
}

// every file under /public as a root-relative URL path
const publicFiles = new Set();
(function collect(dir, rel) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const r = `${rel}/${e.name}`;
    if (e.isDirectory()) collect(path.join(dir, e.name), r);
    else publicFiles.add(r);
  }
})(path.resolve("public"), "");

const TEXT = new Set([".html", ".js", ".css", ".json", ".txt", ".xml", ".webmanifest", ".map"]);
// a root-relative path with a file extension, preceded by a delimiter and followed by one
const URL_RE = /([\s"'(,=`])(\/[A-Za-z0-9_@.%~+\-/]+\.[A-Za-z0-9]{2,5})(?=[\s"'),?#\\`;<]|$)/g;

function rewrite(text) {
  return text.replace(URL_RE, (m, pre, p) => {
    let decoded = p;
    try {
      decoded = decodeURIComponent(p);
    } catch {}
    return publicFiles.has(p) || publicFiles.has(decoded) ? pre + base + p : m;
  });
}

let scanned = 0;
let changed = 0;
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "media" && path.dirname(full) === outDir) continue; // images only
      walk(full);
    } else if (TEXT.has(path.extname(e.name).toLowerCase())) {
      scanned++;
      const src = fs.readFileSync(full, "utf8");
      const out = rewrite(src);
      if (out !== src) {
        fs.writeFileSync(full, out);
        changed++;
      }
    }
  }
}
walk(outDir);

// the web app manifest also needs its start URL / scope under the subpath
const manifestPath = path.join(outDir, "manifest.json");
if (fs.existsSync(manifestPath)) {
  const m = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  m.start_url = `${base}/`;
  m.scope = `${base}/`;
  for (const s of m.shortcuts ?? []) if (typeof s.url === "string" && s.url.startsWith("/") && !s.url.startsWith(`${base}/`)) s.url = base + s.url;
  fs.writeFileSync(manifestPath, JSON.stringify(m, null, 2));
}

// GitHub Pages: keep _next/ (Jekyll would otherwise drop underscore folders)
fs.writeFileSync(path.join(outDir, ".nojekyll"), "");
console.log(`[prefix-assets] base=${base} scanned=${scanned} rewritten=${changed} files`);
