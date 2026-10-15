import { readdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { log } from "../middleware/logger.js";
import { readPages, reportUsage } from "../modules/extraction/index.js";
import type { NarrativeUsage } from "../modules/narrative/index.js";
import { readReport } from "../modules/reports/index.js";
import { claudeCostCents } from "../modules/spend/index.js";

type GoldenMarker = {
  rawName: string;
  markerKey: string | null;
  value: number | null;
  valueText: string | null;
  unit: string | null;
  status: string | null;
};
type LabNameGolden = {
  sample: string;
  person: Parameters<typeof readReport>[2];
  labName: string | null;
};
type Golden =
  | LabNameGolden
  | (LabNameGolden & { score: number; mapped: number; total: number; markers: GoldenMarker[] });

const capCents = 100;
const goldenDirs = [
  new URL("../../fixtures/golden/", import.meta.url),
  pathToFileURL(join(homedir(), "Work/mediwise-samples/golden/")),
];

/** Prints a stored row as "value unit (status)", rounded so float noise does not count as a change. */
function shown({ value, valueText, unit, status }: Omit<GoldenMarker, "rawName" | "markerKey">) {
  const printed = value === null ? valueText : String(Number(value.toPrecision(6)));
  return `${printed} ${unit ?? ""} (${status ?? "no status"})`;
}

/** Groups rows by catalog key, or by raw name for an unmapped row, into sorted lists of shown rows. */
function byKey(markers: GoldenMarker[]) {
  const groups = new Map<string, string[]>();
  for (const marker of markers) {
    const key = marker.markerKey ?? `unmapped: ${marker.rawName}`;
    groups.set(key, [...(groups.get(key) ?? []), shown(marker)].toSorted());
  }
  return groups;
}

/**
 * Runs the real read pipeline on each golden sample and prints every difference from the golden file, with the cost.
 *
 * @remarks
 * Every run calls Claude, so it never runs in CI, and it stops before the next sample could pass $1 in total. The read
 * lab name must contain the golden `labName`, and a null `labName` expects none, because a phone screenshot names no lab.
 * Real reports stay in `~/Work/mediwise-samples/golden`, never in the repo.
 */
async function evalExtraction() {
  const only = process.argv[2];
  const files = (
    await Promise.all(
      goldenDirs.map(async (dir) =>
        (await readdir(dir).catch(() => []))
          .filter((name) => name.endsWith(".json"))
          .toSorted()
          .map((name) => ({ name, url: new URL(name, dir) })),
      ),
    )
  ).flat();
  let spent = 0;
  let largest = 0;
  for (const { name, url } of files) {
    const golden = JSON.parse(await readFile(url, "utf8")) as Golden;
    if (only && golden.sample !== only && name !== only) continue;
    if (spent + largest > capCents) {
      log.error(
        `stopped: ${spent.toFixed(2)} cents spent, the next sample could pass the ${capCents} cent cap`,
      );
      process.exitCode = 1;
      return;
    }
    const data = await readFile(new URL(golden.sample, url));
    const usage = reportUsage();
    const read = await readReport(
      "eval",
      await readPages({ mime: "application/pdf", data }),
      golden.person,
      usage,
    ).catch((error: unknown) => error as Error);
    const cents = claudeCostCents({ usage, inputTokens: null, outputTokens: null });
    spent += cents;
    largest = Math.max(largest, cents);
    log.info(`== ${golden.sample}`);
    for (const [step, counts] of Object.entries(usage)) {
      log.info(
        `${step} ${counts.model}: input=${counts.inputTokens} cached=${counts.cachedInputTokens} cache_write=${counts.cacheWriteTokens} output=${counts.outputTokens}`,
      );
    }
    log.info(`cost ${cents.toFixed(2)} cents`);
    const narrative: NarrativeUsage = usage.narrative;
    const narrativeCents = claudeCostCents({
      usage: { ...reportUsage(), narrative },
      inputTokens: null,
      outputTokens: null,
    });
    log.info(
      `narrative cost ${narrativeCents.toFixed(3)} cents, rejected: ${narrative.rejections?.join(" ") ?? "none"}`,
    );
    if (read instanceof Error) {
      log.error(`read failed: ${read.message}`);
      process.exitCode = 1;
      continue;
    }

    const labName = read.extraction.lab?.name;
    log.info(`lab name ${labName ?? "none"} (golden ${golden.labName})`);
    const labMatches =
      golden.labName === null
        ? labName === undefined
        : labName?.toLowerCase().includes(golden.labName.toLowerCase());
    if (!labMatches) process.exitCode = 1;
    if (!("markers" in golden)) continue;

    const actual = read.markerRows;
    const mapped = actual.filter((row) => row.markerKey).length;
    const score = Math.round(read.output.score.overall);
    log.info(`mapped ${mapped}/${actual.length} (golden ${golden.mapped}/${golden.total})`);
    log.info(`score ${score} (golden ${golden.score})`);

    const want = byKey(golden.markers);
    const got = byKey(actual);
    const differences = [...new Set([...want.keys(), ...got.keys()])].toSorted().flatMap((key) => {
      const before = want.get(key)?.join(" | ") ?? "missing";
      const after = got.get(key)?.join(" | ") ?? "missing";
      return before === after ? [] : [`  ${key}: golden ${before}, now ${after}`];
    });
    log.info(differences.length ? `differences:\n${differences.join("\n")}` : "no differences");
    if (differences.length || score !== golden.score || mapped < golden.mapped)
      process.exitCode = 1;
  }
  log.info(`total cost ${spent.toFixed(2)} cents`);
}

await evalExtraction();
