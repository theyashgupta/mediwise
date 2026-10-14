import { createHash } from "node:crypto";
import type { AssistantReviewVerdict } from "../db/schema.js";
import type { loadReviewDay } from "../modules/assistant/index.js";

export type Verdict = AssistantReviewVerdict;

type Range = { low: number | null; high: number | null };

export type ReviewItem = Awaited<ReturnType<typeof loadReviewDay>>[number];

const exitBar = { reviewed: 200, critical: 0, minorShare: 0.02 };

/**
 * Tells whether a question of the day belongs to the review sample.
 *
 * @remarks
 * Every refusal, fallback and flagged answer is in. Of the rest, the md5 of the id picks about 1 in 5, so a second run
 * picks the same questions.
 */
export function isSampled(item: { id: string; refusalKind: string | null; flagged: boolean }) {
  if (item.refusalKind || item.flagged) return true;
  return parseInt(createHash("md5").update(item.id).digest("hex").slice(0, 8), 16) % 5 === 0;
}

/**
 * Replaces control characters with a space, so stored text cannot move the cursor or fake a line on the terminal.
 */
function plain(text: string) {
  return text.replace(
    // eslint-disable-next-line no-control-regex
    /[\u0000-\u001f\u007f-\u009f\u200e\u200f\u2028\u2029\u202a-\u202e\u2066-\u2069]/g,
    " ",
  );
}

function rangeText({ low, high }: Range) {
  if (low !== null && high !== null) return `${low} to ${high}`;
  if (high !== null) return `up to ${high}`;
  if (low !== null) return `${low} or more`;
  return "none";
}

export function itemLines(item: ReviewItem, position: string) {
  const lines = [
    `--- ${position} ${item.id} ${new Date(item.createdAt).toISOString()}${item.flagged ? " FLAGGED" : ""}${
      item.refusalKind ? ` refusal=${item.refusalKind}` : ""
    }`,
    `Q: ${plain(item.question)}`,
  ];
  for (const { text, cites } of item.sentences) {
    lines.push(`A: ${plain(text)}`);
    for (const cite of cites) {
      lines.push(
        cite.deleted
          ? `   [${cite.kind}] report deleted`
          : `   [${cite.kind}] ${plain([cite.label, cite.labName, cite.date].filter(Boolean).join(" · "))}`,
      );
    }
  }
  if (item.copy) lines.push(`Copy: ${plain(item.copy)}`);
  for (const fact of item.facts) {
    lines.push(
      `   value ${plain(fact.markerKey ?? "unmapped")}: ${plain(String(fact.value ?? fact.valueText ?? "none"))} ${plain(fact.unit ?? "")} status=${
        fact.status ?? "none"
      } lab=${rangeText({ low: fact.labRangeLow, high: fact.labRangeHigh })} calibrated=${rangeText(
        {
          low: fact.calibratedLow,
          high: fact.calibratedHigh,
        },
      )}`,
    );
  }
  return lines;
}

export function tallyLines(counts: { verdict: Verdict; total: number }[]) {
  const total = (verdict: Verdict) => counts.find((row) => row.verdict === verdict)?.total ?? 0;
  const reviewed = counts.reduce((sum, row) => sum + row.total, 0);
  const minorShare = reviewed === 0 ? 0 : total("minor") / reviewed;
  const met =
    reviewed >= exitBar.reviewed &&
    total("critical") <= exitBar.critical &&
    minorShare <= exitBar.minorShare;
  return [
    `Reviewed ${reviewed} of ${exitBar.reviewed}. Critical ${total("critical")}. Minor ${(minorShare * 100).toFixed(1)}% (bar ${exitBar.minorShare * 100}%).`,
    met ? "The exit bar is met." : "The exit bar is not met yet.",
  ];
}
