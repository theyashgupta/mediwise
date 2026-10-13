import type Anthropic from "@anthropic-ai/sdk";
import { env } from "../../config/env.js";

export type StepUsage = {
  model: string;
  inputTokens: number;
  cachedInputTokens: number;
  cacheWriteTokens: number;
  outputTokens: number;
};
export type ReportUsage = {
  classify: StepUsage;
  extract: StepUsage;
  map: StepUsage;
  narrative: StepUsage;
  findings: StepUsage;
  studies: StepUsage;
  studyScans: StepUsage;
  translate?: StepUsage;
};

/** Starts an empty token count for one pipeline step on one model. */
export function stepUsage(model: string): StepUsage {
  return { model, inputTokens: 0, cachedInputTokens: 0, cacheWriteTokens: 0, outputTokens: 0 };
}

/**
 * Starts an empty token count for one report read, on the models set in the environment.
 *
 * @remarks
 * Mapping leftover names runs on `ANTHROPIC_MODEL`, because claude-haiku-5-5 mapped "HDL/LDL" to the LDL/HDL ratio.
 * Scanned study pages also run on it, because claude-haiku-5-5 read a printed QTc of 433 as 483 in 2 of 5 reads.
 */
export function reportUsage(): ReportUsage {
  return {
    classify: stepUsage(env.ANTHROPIC_EXTRACT_MODEL),
    extract: stepUsage(env.ANTHROPIC_EXTRACT_MODEL),
    map: stepUsage(env.ANTHROPIC_MODEL),
    narrative: stepUsage(env.ANTHROPIC_NARRATIVE_MODEL),
    findings: stepUsage(env.ANTHROPIC_FINDINGS_MODEL),
    studies: stepUsage(env.ANTHROPIC_EXTRACT_MODEL),
    studyScans: stepUsage(env.ANTHROPIC_MODEL),
  };
}

/** Adds one response's token counts to a step. */
export function addUsage(step: StepUsage, usage: Anthropic.Usage) {
  step.inputTokens += usage.input_tokens;
  step.cachedInputTokens += usage.cache_read_input_tokens ?? 0;
  step.cacheWriteTokens += usage.cache_creation_input_tokens ?? 0;
  step.outputTokens += usage.output_tokens;
}

/** Sums every step into the input and output totals the jobs table keeps next to the per-step counts. */
export function usageTotals(usage: ReportUsage) {
  const steps = Object.values(usage);
  return {
    inputTokens: steps.reduce(
      (sum, s) => sum + s.inputTokens + s.cachedInputTokens + s.cacheWriteTokens,
      0,
    ),
    outputTokens: steps.reduce((sum, s) => sum + s.outputTokens, 0),
  };
}
