import { buildFindings } from "@mediwise/engine";
import { eq } from "drizzle-orm";
import { env } from "../config/env.js";
import { db } from "../db/client.js";
import { reports } from "../db/schema.js";
import { log } from "../middleware/logger.js";
import { reportUsage, stepUsage } from "../modules/extraction/index.js";
import {
  findEarlierVisits,
  findVisit,
  type FindingRule,
  type FindingsUsage,
  writeFindings,
} from "../modules/findings/index.js";
import { claudeCostCents } from "../modules/spend/index.js";

const capCents = 100;

/**
 * Writes the findings of every done report in the database several times and prints the first-try pass rate, the
 * rejection reasons, the findings cost and whether every run kept the same set of findings.
 *
 * @remarks
 * It reads stored visits, so it never pays for extraction. Every run calls Claude, so it never runs in CI, and it stops
 * past $1. Pass the number of runs (default 3), the model (default `ANTHROPIC_FINDINGS_MODEL`) and optionally a report id.
 */
async function evalFindings() {
  const runs = Number(process.argv[2] ?? 3);
  const model = process.argv[3] ?? env.ANTHROPIC_FINDINGS_MODEL;
  const only = process.argv[4];
  const done = await db
    .select({ id: reports.id })
    .from(reports)
    .where(eq(reports.status, "done"))
    .orderBy(reports.collectedAt, reports.createdAt);
  let spent = 0;
  let firstTry = 0;
  let passed = 0;
  let stable = 0;
  let reportCount = 0;
  const cents: number[] = [];
  const reasons = new Map<FindingRule, number>();
  for (const { id } of done) {
    if (only && id !== only) continue;
    const found = await findVisit(id);
    if (!found) continue;
    const earlier = await findEarlierVisits(found.profileId, id, found.visit.date);
    const { findings: drafts } = buildFindings(found.visit, earlier, found.patterns);
    log.info(
      `== report ${id} ${found.visit.date}, earlier visits ${earlier.length}, ${drafts.length} drafts`,
    );
    if (drafts.length === 0) continue;
    reportCount++;
    const sets = new Set<string>();
    for (let run = 1; run <= runs; run++) {
      if (spent > capCents) {
        log.error(`stopped: ${spent.toFixed(2)} cents spent, over the ${capCents} cent cap`);
        process.exitCode = 1;
        return;
      }
      const usage: FindingsUsage = stepUsage(model);
      const findings = await writeFindings(drafts, [found.visit], usage);
      const cost = claudeCostCents({
        usage: { ...reportUsage(), findings: usage },
        inputTokens: null,
        outputTokens: null,
      });
      spent += cost;
      cents.push(cost);
      const rejections = usage.rejections ?? [];
      if (usage.dropped === 0) passed++;
      if (usage.dropped === 0 && rejections.length === 0) firstTry++;
      for (const rule of rejections) reasons.set(rule, (reasons.get(rule) ?? 0) + 1);
      sets.add(JSON.stringify(findings.map(({ title, citedKeys }) => [title, citedKeys])));
      log.info(
        `run ${run}: kept ${findings.length}/${drafts.length}, ${cost.toFixed(3)} cents, input=${usage.inputTokens} cached=${usage.cachedInputTokens} cache_write=${usage.cacheWriteTokens} output=${usage.outputTokens}${rejections.length ? `, rejected: ${rejections.join(" ")}` : ""}`,
      );
      if (run === 1) {
        for (const finding of findings) {
          log.info(`  [${finding.kind}/${finding.severity}] ${finding.title}`);
          log.info(
            `    ${finding.body} {${[...finding.citedKeys, ...finding.citedStudyIds].join(", ")}}`,
          );
        }
      }
    }
    if (sets.size === 1) stable++;
  }
  const total = cents.length;
  const mean = cents.reduce((sum, cost) => sum + cost, 0) / total;
  log.info(`model ${model}: first try ${firstTry}/${total}, nothing dropped ${passed}/${total}`);
  log.info(`same findings set in every run: ${stable}/${reportCount} reports`);
  log.info(
    `findings cost mean ${mean.toFixed(3)} cents, max ${Math.max(...cents).toFixed(3)} cents`,
  );
  log.info(
    `rejections: ${[...reasons].map(([rule, count]) => `${rule}=${count}`).join(" ") || "none"}`,
  );
  log.info(`total cost ${spent.toFixed(2)} cents`);
}

await evalFindings();
await db.$client.end();
