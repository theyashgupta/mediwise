import { findMarker } from "@mediwise/engine";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { pdfPageTexts } from "../lib/poppler.js";
import { log } from "../middleware/logger.js";
import { checkedLabName, printedHeader } from "../modules/extraction/extraction.header.js";
import { printedTests } from "./printed-tests.js";

const samplesDir = process.argv[2] ?? join(homedir(), "Work/mediwise-samples");

/** Lists every PDF under the samples folder and its subfolders, skipping byte-identical copies. */
async function samplePdfs() {
  const entries = await readdir(samplesDir, { recursive: true, withFileTypes: true });
  const seen = new Set<string>();
  const files: { path: string; data: Buffer }[] = [];
  for (const entry of entries.filter((e) => e.isFile() && e.name.endsWith(".pdf")).toSorted()) {
    const path = join(entry.parentPath, entry.name);
    const data = await readFile(path);
    const hash = createHash("sha256").update(data).digest("hex");
    if (!seen.has(hash)) files.push({ path, data });
    seen.add(hash);
  }
  return files.toSorted((a, b) => a.path.localeCompare(b.path));
}

/**
 * Maps the printed test names of every sample by alias alone and prints mapped/total per file with the unmapped names.
 *
 * @remarks
 * No Claude call runs, so it costs nothing. Pages without a text layer are skipped and counted. The lab name line shows
 * only what the page 1 text layer gives, so a logo letterhead prints as none.
 */
async function evalMapping() {
  let mapped = 0;
  let total = 0;
  for (const { path, data } of await samplePdfs()) {
    const pages = (await pdfPageTexts(data)) ?? [];
    const tests = printedTests(pages.map((page) => page ?? ""));
    const unmapped = tests.filter(
      (test) => !findMarker(test.name, test.panel, Number(test.result) || test.result),
    );
    const name = path.slice(samplesDir.length + 1);
    const scanned = pages.filter((page) => page === null).length;
    log.info(
      `${name}: ${tests.length - unmapped.length}/${tests.length} mapped, ${scanned}/${pages.length} pages without text`,
    );
    const firstPage = pages[0] ?? "";
    const labName = checkedLabName({}, firstPage) ?? "none in the text layer";
    log.info(
      `  lab name: ${labName}, ref by: ${printedHeader(firstPage).referredBy ?? "not printed"}`,
    );
    for (const test of unmapped) log.info(`  unmapped: ${test.name} [${test.panel ?? "no panel"}]`);
    mapped += tests.length - unmapped.length;
    total += tests.length;
  }
  log.info(`total: ${mapped}/${total} mapped`);
}

await evalMapping();
