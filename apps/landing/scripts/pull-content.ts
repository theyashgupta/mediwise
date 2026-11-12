/**
 * Writes the security page and the FAQ of each locale from the CMS export to `content/<locale>.json`.
 *
 * @remarks
 * The build must never depend on the CMS being awake. Any failure keeps the committed snapshot, prints one warning
 * and exits 0. Both locales are written or neither, so a deploy never mixes old and new text.
 */
import { writeFile } from "node:fs/promises";

const locales = ["en", "hi"] as const;
const cmsUrl = process.env.CMS_URL?.trim().replace(/\/+$/, "");
const timeoutMs = 90_000;

type FaqItem = { key: string; question: string; html: string };
type Snapshot = {
  pages: { security: { title: string; description: string | null; html: string } };
  faq: FaqItem[];
};
type Export = {
  pages?: { security?: Partial<Snapshot["pages"]["security"]> };
  faq?: Partial<FaqItem>[];
};

const isText = (value: unknown) => typeof value === "string" && value.trim() !== "";

/**
 * Fetches the export of one locale and keeps the fields the landing reads.
 *
 * @remarks
 * Render free can take up to a minute to wake the CMS, so the timeout allows for one cold start.
 */
async function pull(locale: (typeof locales)[number]): Promise<Snapshot> {
  const response = await fetch(`${cmsUrl}/api/content/export?locale=${locale}`, {
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`the ${locale} export answered HTTP ${response.status}`);
  const body = (await response.json()) as Export | null;
  const security = body?.pages?.security;
  const faq = Array.isArray(body?.faq) ? body.faq : [];
  const valid =
    isText(security?.title) &&
    isText(security?.html) &&
    faq.length > 0 &&
    faq.every((item) => [item?.key, item?.question, item?.html].every(isText));
  if (!valid) throw new Error(`the ${locale} export has no security page or no FAQ items`);
  const { title, description, html } = security as Snapshot["pages"]["security"];
  return {
    pages: { security: { title, description: description ?? null, html } },
    faq: (faq as FaqItem[]).map(({ key, question, html }) => ({ key, question, html })),
  };
}

if (!cmsUrl) {
  process.stderr.write(
    "CMS_URL is empty. The landing builds from the committed content snapshot.\n",
  );
} else {
  try {
    const snapshots = await Promise.all(locales.map(pull));
    await Promise.all(
      locales.map((locale, index) =>
        writeFile(
          new URL(`../content/${locale}.json`, import.meta.url),
          `${JSON.stringify(snapshots[index], null, 2)}\n`,
        ),
      ),
    );
    process.stdout.write(`Pulled the landing content from ${cmsUrl}.\n`);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    process.stderr.write(
      `The CMS pull failed (${reason}). The landing builds from the committed content snapshot.\n`,
    );
  }
}
