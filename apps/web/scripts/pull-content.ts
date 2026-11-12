import { writeFileSync } from "node:fs";
import { z } from "zod";

const snapshotUrl = new URL("../content/legal.en.json", import.meta.url);
const timeoutMs = 90_000;

const pageSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable(),
  html: z.string().min(1),
  updatedAt: z.iso.datetime({ offset: true }),
});

const exportSchema = z.object({
  pages: z.object({
    terms: pageSchema,
    privacy: pageSchema,
    refunds: pageSchema,
    contact: pageSchema,
  }),
});

/** Prints one line, as a GitHub annotation in Actions. */
function warn(message: string) {
  const prefix = process.env.GITHUB_ACTIONS ? "::warning::" : "";
  process.stdout.write(`${prefix}${message} The build uses the committed snapshot.\n`);
}

/**
 * Fetches the English export and returns the four legal pages, or a reason to keep the snapshot.
 *
 * @remarks
 * The schema strips every other page, so the security page stays out of the web bundle.
 */
async function pull(cmsUrl: string) {
  const response = await fetch(`${cmsUrl.replace(/\/$/, "")}/api/content/export?locale=en`, {
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) return `The CMS export returned HTTP ${response.status}.`;
  const parsed = exportSchema.safeParse(await response.json());
  if (!parsed.success) return `The CMS export has a bad shape: ${z.prettifyError(parsed.error)}`;
  const { pages } = parsed.data;
  if (!pages.privacy.html.includes('<span id="washington"></span>')) {
    return "The privacy page has no washington anchor.";
  }
  return pages;
}

/**
 * Writes the legal pages of the English CMS export to `content/legal.en.json`.
 *
 * @remarks
 * A missing `CMS_URL`, a CMS outage or a bad export keeps the committed snapshot and exits 0, so a deploy never stops on the CMS.
 */
async function main() {
  const cmsUrl = process.env.CMS_URL;
  if (!cmsUrl) return warn("CMS_URL is not set.");
  try {
    const result = await pull(cmsUrl);
    if (typeof result === "string") return warn(result);
    writeFileSync(snapshotUrl, `${JSON.stringify({ pages: result }, null, 2)}\n`);
    process.stdout.write("Wrote the legal pages from the CMS.\n");
  } catch (error) {
    warn(`The CMS export failed: ${error instanceof Error ? error.message : String(error)}.`);
  }
}

await main();
