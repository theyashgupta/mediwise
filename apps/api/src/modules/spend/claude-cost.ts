import type { ReportUsage, StepUsage } from "../extraction/index.js";

const sonnet = { input: 200, output: 1000 };
const centsPerMTok: Record<string, { input: number; output: number }> = {
  "claude-haiku-5-5": { input: 10, output: 50 },
  "claude-sonnet-5-5": sonnet,
};
const cacheWriteRate = 1.25;
const cacheReadRate = 0.1;

/**
 * Prices one pipeline step in US cents from its model's list price per million tokens.
 *
 * @remarks
 * Cache writes cost 1.25 times input and cache reads 0.1 times. A model with no price here is charged at Sonnet 5.5, so the guard errs high.
 * ponytail: Haiku 5.5 charges more above 100K prompt tokens, add that tier if a report ever gets that long.
 */
export function stepCostCents(step: StepUsage) {
  const price = centsPerMTok[step.model] ?? sonnet;
  const input =
    step.inputTokens +
    step.cacheWriteTokens * cacheWriteRate +
    step.cachedInputTokens * cacheReadRate;
  return (input * price.input + step.outputTokens * price.output) / 1_000_000;
}

/**
 * Converts one job's token counts to US cents.
 *
 * @remarks
 * Jobs from before MEDI-26 have totals only and ran every step on claude-sonnet-5-5, so they are priced at Sonnet 5.5.
 */
export function claudeCostCents(job: {
  usage: ReportUsage | null;
  inputTokens: number | null;
  outputTokens: number | null;
}) {
  if (job.usage)
    return Object.values(job.usage).reduce((sum, step) => sum + stepCostCents(step), 0);
  return stepCostCents({
    model: "claude-sonnet-5-5",
    inputTokens: job.inputTokens ?? 0,
    cachedInputTokens: 0,
    cacheWriteTokens: 0,
    outputTokens: job.outputTokens ?? 0,
  });
}
