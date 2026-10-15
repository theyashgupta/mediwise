/**
 * Writes the hash of every inline script in the export into the CSP of `out/_headers`.
 *
 * @remarks
 * Next writes its hydration data as inline scripts that change on every build, so the hashes can only be known after
 * `next build`. Cloudflare Pages ignores a `_headers` line over 2,000 characters, so a longer line fails the build.
 */
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";

const out = new URL("../out/", import.meta.url);
const headersFile = new URL("_headers", out);
const placeholder = "INLINE_SCRIPT_HASHES";
const maxLine = 2000;

const pages = (await readdir(out, { recursive: true })).filter((path) => path.endsWith(".html"));
const hashes = new Set();
for (const page of pages) {
  const html = await readFile(new URL(page, out), "utf8");
  for (const [, attributes, body] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/\bsrc=|type="application\/ld\+json"/.test(attributes)) continue;
    hashes.add(`'sha256-${createHash("sha256").update(body).digest("base64")}'`);
  }
}

const headers = await readFile(headersFile, "utf8");
if (!headers.includes(placeholder)) throw new Error(`out/_headers has no ${placeholder}`);
const filled = headers.replace(placeholder, [...hashes].join(" "));
const longest = Math.max(...filled.split("\n").map((line) => line.length));
if (longest > maxLine) throw new Error(`out/_headers has a ${longest} character line`);
await writeFile(headersFile, filled);
