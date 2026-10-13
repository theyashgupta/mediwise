import { createInterface } from "node:readline";
import { db } from "../db/client.js";
import { log } from "../middleware/logger.js";
import { countReviews, loadReviewDay, storeReview } from "../modules/assistant/index.js";
import { isSampled, itemLines, tallyLines, type Verdict } from "./review.js";

const usage = "Usage: pnpm --filter @mediwise/api assistant:review [YYYY-MM-DD]";
const keys: Record<string, Verdict> = { p: "pass", m: "minor", c: "critical" };
const day = process.argv[2] ?? new Date().toISOString().slice(0, 10);

/** Tells whether a YYYY-MM-DD string is a real calendar day, so 2026-02-30 is refused before any query. */
function isRealDay(text: string) {
  const parsed = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(text);
}

if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !isRealDay(day)) {
  log.error(usage);
  process.exitCode = 1;
} else {
  const sample = await loadReviewDay(day, isSampled);
  const open = sample.filter((item) => item.verdict === null);
  log.info(
    `${day} (UTC): ${sample.length} sampled, ${sample.length - open.length} already reviewed.`,
  );
  const terminal = createInterface({ input: process.stdin });
  const answers = terminal[Symbol.asyncIterator]();
  try {
    for (const [index, item] of open.entries()) {
      log.info(itemLines(item, `${index + 1}/${open.length}`).join("\n"));
      let key = "";
      while (!["p", "m", "c", "s", "q"].includes(key)) {
        log.info("p pass, m minor, c critical, s skip, q quit");
        const answer = await answers.next();
        key = answer.done ? "q" : String(answer.value).trim().toLowerCase();
      }
      if (key === "q") break;
      const verdict = keys[key];
      if (verdict) await storeReview(item.id, verdict);
    }
  } finally {
    terminal.close();
  }
  log.info(tallyLines(await countReviews()).join("\n"));
}
await db.$client.end();
