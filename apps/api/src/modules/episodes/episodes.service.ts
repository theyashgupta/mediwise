import { createHash } from "node:crypto";
import type Anthropic from "@anthropic-ai/sdk";
import {
  buildEpisode,
  daysBetween,
  type Episode,
  type EpisodeVisit,
  proposeEpisode,
} from "@mediwise/engine";
import type { EpisodeFields } from "@mediwise/shared";
import { z } from "zod";
import { AppError } from "../../common/errors.js";
import { env } from "../../config/env.js";
import { log } from "../../middleware/logger.js";
import { callTool, type StepUsage, stepUsage } from "../extraction/index.js";
import { findVisit } from "../findings/index.js";
import { validateNarrative } from "../narrative/index.js";
import { getOwnedProfile } from "../profiles/index.js";
import { stepCostCents } from "../spend/index.js";
import * as repo from "./episodes.repo.js";

const maxSummarySentences = 4;
const testAdvice =
  /\bretest|\b(further|more|another|next|repeat) (tests?|scans?)\b|\btest again\b/i;
const notFound = () => new AppError(404, "We could not find this episode");

function emptyToNull(note: string | undefined) {
  return note ? note : null;
}

/**
 * Lists the episodes of a profile and the episode the detector proposes, if any.
 *
 * @remarks
 * The detector runs on every read over the done reports in no episode. A dismissed proposal stays hidden until a report
 * dated after it joins a new run.
 */
export async function listEpisodes(userId: string, profileId: string) {
  await getOwnedProfile(userId, profileId);
  const [episodes, free, dismissedOn] = await Promise.all([
    repo.listEpisodes(profileId),
    repo.listFreeReports(profileId),
    repo.findDismissedOn(profileId),
  ]);
  const proposal = proposeEpisode(free);
  return {
    episodes,
    proposal: proposal && (!dismissedOn || proposal.to > dismissedOn) ? proposal : null,
  };
}

/** Hides the current proposal of a profile until a later report makes a new one. */
export async function dismissProposal(userId: string, profileId: string) {
  const { proposal } = await listEpisodes(userId, profileId);
  if (proposal) await repo.saveDismissedOn(profileId, proposal.to);
  return listEpisodes(userId, profileId);
}

/**
 * Loads owned done reports of one profile, or throws the problem the user can act on.
 *
 * @remarks
 * Another user's report answers 404, the same as a report that does not exist.
 */
async function ownedDoneReports(userId: string, profileId: string, ids: string[]) {
  const unique = [...new Set(ids)];
  const rows = await repo.listOwnedReports(userId, unique);
  if (rows.length !== unique.length) throw new AppError(404, "We could not find this report");
  if (rows.some((row) => row.profileId !== profileId)) {
    throw new AppError(422, "Select reports of the same person");
  }
  if (rows.some((row) => row.status !== "done")) {
    throw new AppError(422, "Wait until we read the report");
  }
  return rows;
}

/** Makes an open episode from reports of one profile. It starts on the date of its oldest report. */
export async function createEpisode(
  userId: string,
  profileId: string,
  input: Pick<EpisodeFields, "name"> & { note?: string; reportIds: string[] },
) {
  await getOwnedProfile(userId, profileId);
  const rows = await ownedDoneReports(userId, profileId, input.reportIds);
  const startedOn = rows.map(({ date }) => date).toSorted()[0]!;
  return repo.insertEpisode(
    { profileId, name: input.name, note: emptyToNull(input.note), startedOn },
    rows.map(({ id }) => id),
  );
}

/** Renames an episode, changes its note, or ends or opens it again. */
export async function updateEpisode(
  userId: string,
  id: string,
  patch: Partial<EpisodeFields> & { endedOn?: string | null },
) {
  const episode = await repo.findOwnedEpisode(userId, id);
  if (!episode) throw notFound();
  if (patch.endedOn && patch.endedOn < episode.startedOn) {
    throw new AppError(422, "Select an end date on or after the start date");
  }
  await repo.updateEpisode(id, {
    name: patch.name,
    endedOn: patch.endedOn,
    note: patch.note === undefined ? undefined : emptyToNull(patch.note),
  });
  return { id };
}

/** Deletes an episode. Its reports stay and belong to no episode. */
export async function deleteEpisode(userId: string, id: string) {
  if (!(await repo.findOwnedEpisode(userId, id))) throw notFound();
  await repo.deleteEpisode(id);
}

/** Puts a done report in an episode of the same profile, or takes it out of its episode. */
export async function setReportEpisode(userId: string, reportId: string, episodeId: string | null) {
  const [report] = await repo.listOwnedReports(userId, [reportId]);
  if (!report) throw new AppError(404, "We could not find this report");
  if (episodeId === null) {
    await repo.setReportEpisode(reportId, null);
    return { episodeId };
  }
  const episode = await repo.findOwnedEpisode(userId, episodeId);
  if (!episode) throw notFound();
  await ownedDoneReports(userId, episode.profileId, [reportId]);
  await repo.setReportEpisode(reportId, { id: episodeId, date: report.date });
  return { episodeId };
}

function plural(count: number, one: string, other: string) {
  return `${count} ${count === 1 ? one : other}`;
}

/** Writes the summary from the grouped episode alone, for when Claude gives no summary that passes the validator. */
export function engineSummary(episode: Episode) {
  const { timeline, repeated, outstanding, from, to } = episode;
  if (!from || !to) return ["This episode has no reports yet."];
  const sentences = [
    from === to
      ? `This episode has ${plural(timeline.length, "report", "reports")} from one day.`
      : `This episode has ${plural(timeline.length, "report", "reports")} over ${daysBetween(from, to)} days.`,
  ];
  if (repeated.length > 0) {
    sentences.push(`${plural(repeated.length, "marker has", "markers have")} more than one value.`);
    const improving = repeated.filter(({ direction }) => direction === "improving").length;
    const worsening = repeated.filter(({ direction }) => direction === "worsening").length;
    if (improving > 0)
      sentences.push(`${plural(improving, "of them is", "of them are")} improving.`);
    if (worsening > 0)
      sentences.push(`${plural(worsening, "of them is", "of them are")} worsening.`);
  }
  const once = outstanding.markers.length + outstanding.studies.length;
  if (once > 0) {
    sentences.push(
      `${plural(once, "result has", "results have")} watch or risk status and one value only.`,
    );
  }
  return sentences;
}

const summaryExample = {
  sentences: [
    { text: "This episode has five reports over six weeks.", citedKeys: [] },
    {
      text: "TSH moved from risk status to optimal status across three values.",
      citedKeys: ["tsh"],
    },
    { text: "The pelvis ultrasound of March shows no cyst.", citedKeys: ["study_c"] },
  ],
};

const system = `You write a short summary of one episode. An episode is a set of lab reports and scans of one person from a few weeks. The user message gives the episode facts and the episode key list. Call the write_summary tool once.

Rules:
1. Write 2 to ${maxSummarySentences} sentences. Each sentences item holds one sentence.
2. Each sentence has 20 words or fewer. Aim for 15 words. Name three markers or fewer in one sentence.
3. Do not use a semicolon. Use active voice. Do not use a phrasal verb.
4. Cite in citedKeys each marker and study that the sentence names, and only those. Copy each key exactly from the episode key list.
5. Start with the most important change from the first value to the last value. Do not list every marker.
6. Say what the facts say and nothing more. Do not add a cause, a diagnosis or a fact that is not in the facts.
7. Do not name or guess a condition that the episode could be about.
8. Keep every hedge. "May be low" stays "may be low". Never make a hedge into a fact.
9. Do not use diagnosis words. Do not write "you have", "diagnosed" or "disease".
10. Do not suggest a test, a retest or a scan. Do not tell the reader what to do. Do not name a drug.
11. Use these words: report, marker, value, study, status. Use the status names optimal, watch and risk. Give each marker one direction word, the one the facts give: improving, worsening or stable.
12. Keep the medical names the facts use, for example HbA1c or LDL.
13. Name a study by its kind, body region and month. Do not count studies or give them an order number.

A summary that passes every rule, as write_summary input:
${JSON.stringify(summaryExample)}`;

function summaryShape(key: z.ZodType<string>) {
  return z.object({
    sentences: z
      .array(
        z.object({
          text: z.string().trim().min(1).describe("One sentence of 20 words or fewer"),
          citedKeys: z
            .array(key)
            .describe("Keys from the episode key list that this sentence names"),
        }),
      )
      .min(1)
      .max(maxSummarySentences),
  });
}
const summarySchema = summaryShape(z.string());
type Sentence = z.infer<typeof summarySchema>["sentences"][number];

function summaryTool(keys: string[]): Anthropic.Tool {
  const key = keys.length > 0 ? z.enum(keys as [string, ...string[]]) : z.string();
  return {
    name: "write_summary",
    description: "Records the plain-English summary of one episode, one cited sentence at a time.",
    input_schema: z.toJSONSchema(summaryShape(key)) as Anthropic.Tool.InputSchema,
  };
}

/**
 * Gives each study a key with a letter, not a number.
 *
 * @remarks
 * Claude read `study_3` as "the third ultrasound" when it was the second of its kind, so a key carries no order.
 */
function studyKey(index: number) {
  return `study_${String.fromCharCode(97 + (index % 26))}${index >= 26 ? index : ""}`;
}

/**
 * Writes the grouped episode as short lines with every key, the only facts Claude may use.
 *
 * @remarks
 * Takes the engine output alone, so the episode name and the user's note can never reach a prompt.
 */
export function episodeFacts(episode: Episode) {
  const status = (value: string | null) => (value ? value : "no status");
  const lines = [
    `Episode: ${episode.timeline.length} reports from ${episode.from} to ${episode.to}.`,
    "",
    "Episode key list. Cite only these keys.",
    "Markers with two values or more (key | name | values in date order with status | direction from first to last):",
    ...episode.repeated.map(
      (m) =>
        `${m.markerKey} | ${m.name} | ${m.points.map((p) => `${p.value}${m.unit ? ` ${m.unit}` : ""} (${status(p.status)})`).join(", ")} | ${m.direction}`,
    ),
    "Markers with one value and watch or risk status (key | name | value | status):",
    ...episode.outstanding.markers.map(
      (m) =>
        `${m.markerKey} | ${m.name} | ${m.value ?? m.valueText}${m.unit ? ` ${m.unit}` : ""} | ${m.status}`,
    ),
    "Studies in date order (key | date | kind | body region | impression):",
    ...episode.studies.map(
      (s, index) =>
        `${studyKey(index)} | ${s.date} | ${s.kind} | ${s.bodyRegion ?? "not printed"} | ${(s.impression ?? "none").replace(/\s+/g, " ")}`,
    ),
  ];
  return lines.join("\n");
}

type Problem = { message: string; index?: number };

/** Lists every reason a summary breaks the narrative copy rules, cites an unknown key, or suggests a test. */
export function validateSummary(sentences: Sentence[], allowed: Set<string>): Problem[] {
  const problems: Problem[] = validateNarrative(
    sentences.map((sentence) => ({ ...sentence, section: "The headline" as const })),
    allowed,
  );
  sentences.forEach(({ text }, index) => {
    if (testAdvice.test(text)) problems.push({ message: "It suggests a test.", index });
  });
  return problems;
}

/**
 * Asks Claude for the summary and returns its sentences once they pass the validator.
 *
 * @remarks
 * A rejected draft gets one more call with the problems listed. A second rejection returns null.
 */
async function writeSummary(facts: string, keys: string[], usage: StepUsage) {
  const allowed = new Set(keys);
  const tool = summaryTool(keys);
  const factsBlock: Anthropic.TextBlockParam = { type: "text", text: facts };
  const ask = "Write the summary for this episode with the write_summary tool.";
  const draft = async (text: string) => {
    const input = await callTool(tool, system, [factsBlock, { type: "text", text }], usage);
    const parsed = summarySchema.safeParse(input);
    if (!parsed.success) {
      const message =
        input === undefined ? "No write_summary call was made." : z.prettifyError(parsed.error);
      return { sentences: null, problems: [{ message }] as Problem[] };
    }
    return {
      sentences: parsed.data.sentences,
      problems: validateSummary(parsed.data.sentences, allowed),
    };
  };

  const first = await draft(ask);
  if (first.sentences && first.problems.length === 0) {
    return first.sentences.map(({ text }) => text);
  }
  const reasons = first.problems.map(({ message, index }) =>
    index === undefined ? message : `"${first.sentences?.[index]?.text}" ${message}`,
  );
  const second = await draft(
    `${ask}\n\nWe rejected your previous write_summary call:\n${reasons.map((reason) => `- ${reason}`).join("\n")}\nCall it again and fix every problem.`,
  );
  if (second.sentences && second.problems.length === 0) {
    return second.sentences.map(({ text }) => text);
  }
  log.warn("Episode summary rejected twice", [...first.problems, ...second.problems]);
  return null;
}

/**
 * Returns the summary sentences of an episode: the cached ones when its facts did not change, else a new Claude summary.
 *
 * @remarks
 * The cache key hashes the model, the system prompt and the facts. A rejected summary is cached as null too, so a second
 * open never pays for a call the validator already refused.
 */
async function summaryFor(
  id: string,
  cached: { hash: string; sentences: string[] | null } | null,
  episode: Episode,
) {
  if (episode.timeline.length === 0) return engineSummary(episode);
  const facts = episodeFacts(episode);
  const model = env.ANTHROPIC_NARRATIVE_MODEL;
  const hash = createHash("sha256").update(`${model}\n${system}\n${facts}`).digest("hex");
  if (cached?.hash === hash) return cached.sentences ?? engineSummary(episode);

  const keys = [
    ...episode.repeated.map(({ markerKey }) => markerKey),
    ...episode.outstanding.markers.map(({ markerKey }) => markerKey),
    ...episode.studies.map((_, index) => studyKey(index)),
  ];
  const usage = stepUsage(model);
  try {
    const sentences = await writeSummary(facts, keys, usage);
    await repo.saveSummary(id, { hash, sentences });
    return sentences ?? engineSummary(episode);
  } catch (error) {
    log.warn("Episode summary failed", error);
    return engineSummary(episode);
  } finally {
    log.info(`Episode summary cost ${stepCostCents(usage).toFixed(4)} cents`, usage);
  }
}

/** Loads one owned episode with its timeline, repeated markers, studies, outstanding items and summary. */
export async function getEpisode(userId: string, id: string) {
  const stored = await repo.findOwnedEpisode(userId, id);
  if (!stored) throw notFound();
  const rows = await repo.listEpisodeReports(id);
  const visits = await Promise.all(
    rows.map(async ({ id: reportId }): Promise<EpisodeVisit[]> => {
      const found = await findVisit(reportId);
      return found ? [{ ...found.visit, reportId }] : [];
    }),
  );
  const episode = buildEpisode(visits.flat());
  const titles = new Map(rows.map((row) => [row.id, row.title]));
  const timeline = episode.timeline.map((row) => ({
    ...row,
    title: titles.get(row.reportId) ?? null,
  }));
  const { summary, ...fields } = stored;
  return { ...fields, ...episode, timeline, summary: await summaryFor(id, summary, episode) };
}
