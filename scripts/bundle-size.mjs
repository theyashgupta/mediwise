#!/usr/bin/env node
/**
 * Checks the gzip size of each web entry and of the landing first load against `scripts/bundle-size.json`.
 *
 * @remarks
 * Run after `vite build --manifest` in apps/web and `next build` in apps/landing.
 * `node scripts/bundle-size.mjs --update` writes the current sizes as the new baseline. Commit that file on purpose.
 * Growth under 500 bytes never fails, because a route wrapper of 85 bytes gains 10% from one renamed import.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const root = new URL("../", import.meta.url);
const baselineUrl = new URL("scripts/bundle-size.json", root);
const webDist = new URL("apps/web/dist/", root);
const landingOut = new URL("apps/landing/out/", root);
const maxGrowth = 0.1;
const minGrowthBytes = 500;
const landingBudget = 150_000;

/** Returns the gzip size of one built file. */
function gzipBytes(dir, file) {
  return gzipSync(readFileSync(new URL(file, dir))).length;
}

/** Returns the files a manifest chunk loads at once: the chunk, its static imports and their CSS. */
function closure(manifest, key, seen = new Set()) {
  const chunk = manifest[key];
  if (seen.has(chunk.file)) return seen;
  seen.add(chunk.file);
  for (const css of chunk.css ?? []) seen.add(css);
  for (const imported of chunk.imports ?? []) closure(manifest, imported, seen);
  return seen;
}

/**
 * Measures every web chunk on its own, and the total that `index.html` loads.
 *
 * @remarks
 * A chunk is named by its source path or its chunk name, never by its hash, so a name stays the same from build to build.
 * Chunks that share a name, such as the `dist` chunks of several packages, are summed, because the manifest order between them follows the hash.
 */
function webSizes() {
  const manifest = JSON.parse(readFileSync(new URL(".vite/manifest.json", webDist), "utf8"));
  const sizes = {};
  for (const chunk of Object.values(manifest)) {
    const name = `web ${chunk.src ?? chunk.name}`;
    sizes[name] = (sizes[name] ?? 0) + gzipBytes(webDist, chunk.file);
  }
  const main = closure(manifest, "index.html");
  sizes["web first load"] = [...main].reduce((sum, file) => sum + gzipBytes(webDist, file), 0);
  return sizes;
}

/** Measures the JavaScript the landing page loads before it is interactive. */
function landingSize() {
  const html = readFileSync(new URL("index.html", landingOut), "utf8");
  const scripts = [...html.matchAll(/<script([^>]*) src="\/([^"]+)"([^>]*)>/g)]
    .filter((match) => !/noModule/i.test(match[1] + match[3]))
    .map((match) => match[2]);
  return scripts.reduce((sum, file) => sum + gzipBytes(landingOut, file), 0);
}

const current = { ...webSizes(), "landing first load": landingSize() };

if (process.argv.includes("--update")) {
  const sorted = Object.fromEntries(Object.entries(current).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(baselineUrl, `${JSON.stringify(sorted, null, 2)}\n`);
  console.log(`Wrote ${Object.keys(sorted).length} sizes to scripts/bundle-size.json.`);
  process.exit(0);
}

const baseline = JSON.parse(readFileSync(baselineUrl, "utf8"));
const kb = (bytes) => `${(bytes / 1000).toFixed(1)} kB`;
const failures = [];
const rows = [];

for (const [name, bytes] of Object.entries(current)) {
  const before = baseline[name];
  if (before === undefined) {
    failures.push(`${name}: new entry (${kb(bytes)}), not in the baseline`);
    continue;
  }
  const growth = (bytes - before) / before;
  rows.push({
    entry: name,
    baseline: kb(before),
    now: kb(bytes),
    change: `${(growth * 100).toFixed(1)}%`,
  });
  if (growth > maxGrowth && bytes - before > minGrowthBytes) {
    failures.push(
      `${name}: ${kb(before)} to ${kb(bytes)}, ${(growth * 100).toFixed(1)}% growth, over the 10% limit`,
    );
  }
}
for (const name of Object.keys(baseline).filter((name) => !(name in current))) {
  failures.push(`${name}: in the baseline but not in the build`);
}
if (current["landing first load"] > landingBudget) {
  failures.push(
    `landing first load: ${kb(current["landing first load"])}, over the ${kb(landingBudget)} budget`,
  );
}

console.table(rows);
if (failures.length > 0) {
  console.error(`\nBundle size check failed:\n- ${failures.join("\n- ")}`);
  console.error("\nSee docs/testing.md, Bundle size, to read this and to update the baseline.");
  process.exit(1);
}
console.log("\nEvery entry is within 10% of its baseline.");
