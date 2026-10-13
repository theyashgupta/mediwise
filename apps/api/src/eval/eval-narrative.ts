import type { EngineProfile } from "@mediwise/engine";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { log } from "../middleware/logger.js";
import { readPages, reportUsage } from "../modules/extraction/index.js";
import {
  type NarrativeRule,
  type NarrativeUsage,
  writeNarrative,
} from "../modules/narrative/index.js";
import { readReport } from "../modules/reports/index.js";
import { claudeCostCents } from "../modules/spend/index.js";

const capCents = 100;
const samplesDir = join(homedir(), "Work/mediwise-samples");
const goldenDir = fileURLToPath(new URL("../../fixtures/golden/", import.meta.url));
type Sample = { file: string; sex: "male" | "female" };
const privateSamples = await readFile(join(samplesDir, "narrative.json"), "utf8").then(
  (text) => JSON.parse(text) as Sample[],
  () => [],
);
const samples: Sample[] = [
  { file: join(goldenDir, "sample-2024.pdf"), sex: "male" },
  { file: join(goldenDir, "sample-2025.pdf"), sex: "male" },
  ...privateSamples.map((sample) => ({ ...sample, file: join(samplesDir, sample.file) })),
];

/**
 * Reads each sample once, then writes its narrative several times and prints the first-try pass rate, the rejection
 * reasons and the narrative cost.
 *
 * @remarks
 * Every run calls Claude, so it never runs in CI. It stops when the spend passes $1. Pass the number of runs per sample
 * (default 3) and optionally one sample file name. Real reports stay out of the repo, listed in
 * `~/Work/mediwise-samples/narrative.json`.
 */
async function evalNarrative() {
  const runs = Number(process.argv[2] ?? 3);
  const only = process.argv[3];
  let spent = 0;
  let firstTry = 0;
  let passed = 0;
  let total = 0;
  const narrativeCents: number[] = [];
  const reasons = new Map<NarrativeRule, number>();
  for (const sample of samples) {
    if (only && basename(sample.file) !== only) continue;
    const readUsage = reportUsage();
    const read = await readReport(
      "eval",
      await readPages({
        mime: "application/pdf",
        data: await readFile(sample.file),
      }),
      { dateOfBirth: null, sex: sample.sex, ancestry: "south_asian" },
      readUsage,
    );
    const ageYears = read.extraction.patient?.ageYears;
    if (ageYears === undefined) throw new Error(`${basename(sample.file)} prints no age`);
    const profile: EngineProfile = { ageYears, sex: sample.sex, ancestry: "south_asian" };
    spent += claudeCostCents({ usage: readUsage, inputTokens: null, outputTokens: null });
    log.info(
      `== ${basename(sample.file)}: ${read.mappedCount} mapped, ${read.output.patterns.length} patterns`,
    );

    for (let run = 1; run <= runs; run++) {
      if (spent > capCents) {
        log.error(`stopped: ${spent.toFixed(2)} cents spent, over the ${capCents} cent cap`);
        process.exitCode = 1;
        return;
      }
      const usage = reportUsage();
      const narrative =
        run === 1 ? read.narrative : await writeNarrative(read.output, profile, usage.narrative);
      const step: NarrativeUsage = run === 1 ? readUsage.narrative : usage.narrative;
      const cents = claudeCostCents({
        usage: { ...reportUsage(), narrative: step },
        inputTokens: null,
        outputTokens: null,
      });
      if (run > 1) spent += cents;
      const rejections = step.rejections ?? [];
      total++;
      if (narrative) passed++;
      if (narrative && rejections.length === 0) firstTry++;
      narrativeCents.push(cents);
      for (const rule of rejections) reasons.set(rule, (reasons.get(rule) ?? 0) + 1);
      log.info(
        `run ${run}: ${narrative ? (rejections.length ? "passed on retry" : "passed first try") : "failed"}, ${cents.toFixed(3)} cents, input=${step.inputTokens} cached=${step.cachedInputTokens} cache_write=${step.cacheWriteTokens} output=${step.outputTokens}${rejections.length ? `, rejected: ${rejections.join(" ")}` : ""}`,
      );
      for (const section of narrative?.sections ?? []) {
        for (const sentence of section.sentences) {
          log.info(`  [${section.heading}] ${sentence.text} {${sentence.markerKeys.join(", ")}}`);
        }
      }
    }
  }
  const mean = narrativeCents.reduce((sum, cents) => sum + cents, 0) / narrativeCents.length;
  log.info(`first try ${firstTry}/${total}, passed ${passed}/${total}`);
  log.info(
    `narrative cost mean ${mean.toFixed(3)} cents, max ${Math.max(...narrativeCents).toFixed(3)} cents`,
  );
  log.info(
    `rejections: ${[...reasons].map(([rule, count]) => `${rule}=${count}`).join(" ") || "none"}`,
  );
  log.info(`total cost ${spent.toFixed(2)} cents`);
}

await evalNarrative();
