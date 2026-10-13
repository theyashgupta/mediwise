import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const minPageChars = 100;
const minRepeatPages = 3;
const minRepeatChars = 30;

async function withPdf<T>(data: Buffer, read: (path: string, dir: string) => Promise<T>) {
  const dir = await mkdtemp(join(tmpdir(), "mediwise-pdf-"));
  try {
    const path = join(dir, "in.pdf");
    await writeFile(path, data);
    return await read(path, dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/**
 * Returns the text layer of each PDF page, or `undefined` when pdftotext is missing or cannot read the file.
 *
 * @remarks
 * A page with fewer than 100 printed characters comes back as `null`: it is a scan, and only an image of it shows the values.
 */
export async function pdfPageTexts(data: Buffer): Promise<(string | null)[] | undefined> {
  try {
    const { stdout } = await withPdf(data, (path) =>
      run("pdftotext", ["-layout", "-enc", "UTF-8", path, "-"], { maxBuffer: 64 * 1024 * 1024 }),
    );
    return stdout
      .split("\f")
      .slice(0, -1)
      .map((page) => (page.replace(/\s/g, "").length >= minPageChars ? page : null));
  } catch {
    return undefined;
  }
}

/** Renders one zero-based PDF page as a JPEG at most 1568 pixels on the long side, the largest size Claude reads without scaling. */
export async function renderPdfPage(data: Buffer, pageIndex: number) {
  return withPdf(data, async (path, dir) => {
    const page = String(pageIndex + 1);
    const out = join(dir, "page");
    await run("pdftoppm", [
      "-jpeg",
      "-scale-to",
      "1568",
      "-f",
      page,
      "-l",
      page,
      "-singlefile",
      path,
      out,
    ]);
    return readFile(`${out}.jpg`);
  });
}

/**
 * Renders the top of the first PDF page as an 800 by 200 JPEG, the strip where a letterhead prints.
 *
 * @remarks
 * Lab letterheads are often a logo with no text layer, so without this strip Claude never sees the lab name.
 */
export async function renderPdfHeader(data: Buffer) {
  return withPdf(data, async (path, dir) => {
    const out = join(dir, "header");
    await run("pdftoppm", [
      "-jpeg",
      "-scale-to-x",
      "800",
      "-scale-to-y",
      "-1",
      "-W",
      "800",
      "-H",
      "200",
      "-f",
      "1",
      "-l",
      "1",
      "-singlefile",
      path,
      out,
    ]);
    return readFile(`${out}.jpg`);
  });
}

/**
 * Shrinks layout text for the model: drops blank lines and keeps a long line repeated on many pages only once.
 *
 * @remarks
 * Page headers and footers repeat on every page and were most of the tokens on a 25-page report. Column spacing stays,
 * because without it an empty unit column made the model read the range as the unit. Short repeated lines stay too,
 * because a panel heading such as "Urine Examination" can repeat and decides how a bare "Protein" maps.
 */
export function compactPageTexts(pages: string[]): string[] {
  const lines = pages.map((page) =>
    page
      .split("\n")
      .map((line) => line.trimEnd())
      .filter(Boolean),
  );
  const pageCount = new Map<string, number>();
  for (const page of lines) {
    for (const line of new Set(page.map((l) => l.trim()))) {
      pageCount.set(line, (pageCount.get(line) ?? 0) + 1);
    }
  }
  const seen = new Set<string>();
  return lines.map((page) =>
    page
      .filter((line) => {
        const key = line.trim();
        if (key.length < minRepeatChars || (pageCount.get(key) ?? 0) < minRepeatPages) return true;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .join("\n"),
  );
}
