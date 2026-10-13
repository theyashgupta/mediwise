/**
 * Copies the brand files that MEDI-40 generates in apps/web/public into this app's public folder.
 *
 * @remarks
 * `scripts/generate-brand-assets.mjs` owns these files, so the landing keeps no second copy in git.
 */
import { copyFile } from "node:fs/promises";

const files = ["favicon.svg", "favicon.ico", "apple-touch-icon.png", "og-image.png"];
const from = new URL("../../web/public/", import.meta.url);
const to = new URL("../public/", import.meta.url);

await Promise.all(files.map((file) => copyFile(new URL(file, from), new URL(file, to))));
