import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

/** Builds a new PDF that holds only the given zero-based pages, in order, with poppler's pdfseparate and pdfunite. */
export async function keepPdfPages(data: Buffer, pageIndexes: number[]) {
  const dir = await mkdtemp(join(tmpdir(), "mediwise-pages-"));
  try {
    const input = join(dir, "in.pdf");
    await writeFile(input, data);
    await run("pdfseparate", [input, join(dir, "page-%d.pdf")]);
    const output = join(dir, "out.pdf");
    const pages = pageIndexes.map((index) => join(dir, `page-${index + 1}.pdf`));
    if (pages.length === 1) return await readFile(pages[0] ?? "");
    await run("pdfunite", [...pages, output]);
    return await readFile(output);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
