import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";
import { createGzip } from "node:zlib";

const types: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};
const compressible = new Set([
  ".html",
  ".js",
  ".css",
  ".json",
  ".webmanifest",
  ".txt",
  ".xml",
  ".svg",
]);

/** Returns the file for a request path: the file itself, its `index.html`, or `<path>.html`. */
function findFile(root: string, pathname: string) {
  const path = resolve(join(root, decodeURIComponent(pathname)));
  if (path !== root && !path.startsWith(root + sep)) return undefined;
  for (const candidate of [path, join(path, "index.html"), `${path}.html`]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return undefined;
}

/**
 * Serves a built folder with gzip, as Cloudflare Pages serves the web and the landing.
 *
 * @remarks
 * Lighthouse scores an uncompressed build far too low, and neither `vite preview` nor `next start` serves a static export with compression.
 * A single-page app answers an unknown path with `index.html`, the landing with `404.html`.
 */
function serve(dir: string, port: number, spa: boolean) {
  const root = resolve(dir);
  createServer((req, res) => {
    const { pathname } = new URL(req.url ?? "/", "http://localhost");
    const found = findFile(root, pathname);
    const file = found ?? join(root, spa ? "index.html" : "404.html");
    const ext = extname(file);
    const gzip = compressible.has(ext) && /\bgzip\b/.test(req.headers["accept-encoding"] ?? "");
    res.writeHead(found || spa ? 200 : 404, {
      "content-type": types[ext] ?? "application/octet-stream",
      ...(gzip && { "content-encoding": "gzip", vary: "accept-encoding" }),
    });
    const stream = createReadStream(file);
    (gzip ? stream.pipe(createGzip()) : stream).pipe(res);
  }).listen(port);
}

const [webPort, landingPort] = process.argv.slice(2);
serve(join(import.meta.dirname, "../../web/dist"), Number(webPort), true);
serve(join(import.meta.dirname, "../../landing/out"), Number(landingPort), false);
