#!/usr/bin/env node
/**
 * Writes the raster brand files in apps/web/public, and the README banner in docs/assets, from the mark in favicon.svg.
 *
 * @remarks
 * Run once after the mark changes, then commit the output: `node scripts/generate-brand-assets.mjs`.
 * The wordmark comes as Inter outlines in docs/design/logo/wordmark.svg, because sharp on macOS ignores a font file.
 */
import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";

const sharp = createRequire(new URL("../apps/api/package.json", import.meta.url))("sharp");
const publicDir = new URL("../apps/web/public/", import.meta.url);

const colors = {
  primary: "#176B6B",
  ring: "#2D8A8A",
  background: "#FBFAF7",
  foreground: "#201C19",
};

const faviconSvg = await readFile(new URL("favicon.svg", publicDir), "utf8");
const markPath = faviconSvg.match(/ d="([^"]+)"/)[1];

/** Renders the mark, filled with one colour, on an optional square tile. */
function markSvg(size, fill, { tile, scale = 1 } = {}) {
  const offset = 10 - 10 * scale;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 20 20">` +
      (tile ? `<rect width="20" height="20" fill="${tile}"/>` : "") +
      `<path fill="${fill}" fill-rule="evenodd" transform="translate(${offset} ${offset}) scale(${scale})" d="${markPath}"/></svg>`,
  );
}

const png = (svg) => sharp(svg).png().toBuffer();

/**
 * Packs PNG images into one ICO file.
 *
 * @remarks
 * Every browser that still asks for favicon.ico reads PNG entries, so no BMP encoding is needed.
 */
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const entry = 6 + 16 * i;
    header.writeUInt8(size, entry);
    header.writeUInt8(size, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map(({ data }) => data)]);
}

/** Renders the mark and the wordmark side by side, centred on the background. */
async function lockup(width, height, markSize, gap, textHeight) {
  const wordmark = await readFile(
    new URL("../docs/design/logo/wordmark.svg", import.meta.url),
    "utf8",
  );
  const [, , viewWidth, viewHeight] = wordmark
    .match(/viewBox="([^"]+)"/)[1]
    .split(" ")
    .map(Number);
  const textWidth = Math.round((textHeight * viewWidth) / viewHeight);
  const sized = `<svg width="${textWidth}" height="${textHeight}" fill="${colors.foreground}" `;
  const left = Math.round((width - markSize - gap - textWidth) / 2);
  return sharp({ create: { width, height, channels: 4, background: colors.background } })
    .composite([
      { input: await png(markSvg(markSize, colors.primary)), left, top: (height - markSize) / 2 },
      {
        input: await png(Buffer.from(wordmark.replace("<svg ", sized))),
        left: left + markSize + gap,
        top: Math.round((height - textHeight) / 2),
      },
    ])
    .png()
    .toBuffer();
}

const appIcon = (size) =>
  png(markSvg(size, colors.background, { tile: colors.primary, scale: 0.55 }));

const files = {
  "favicon.ico": ico(
    await Promise.all(
      [16, 32, 48].map(async (size) => ({ size, data: await png(markSvg(size, colors.ring)) })),
    ),
  ),
  "apple-touch-icon.png": await appIcon(180),
  "icon-192.png": await appIcon(192),
  "icon-512.png": await appIcon(512),
  "og-image.png": await lockup(1200, 630, 150, 36, 90),
  "../../../docs/assets/banner.png": await lockup(1280, 360, 120, 28, 72),
};

for (const [name, data] of Object.entries(files)) {
  await writeFile(new URL(name, publicDir), data);
  process.stdout.write(`${name} ${data.length} bytes\n`);
}
