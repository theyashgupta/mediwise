import { markers } from "./catalog/index.js";
import { alertKeys, alertLine, sentencesOf, studyAlertRules } from "./patterns/study-alerts.js";
import { withUnit } from "./rank.js";
import type {
  FindingDraft,
  FindingSeverity,
  LaterVisit,
  Settlement,
  Visit,
  VisitMarker,
  VisitStudy,
} from "./types.js";

export const repeatStudyDays = 90;
export const repeatMarkerDays = 30;

const names = new Map(markers.map((entry) => [entry.key, entry.name]));

export function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
}

function region(study: Pick<VisitStudy, "bodyRegion">) {
  return (study.bodyRegion ?? "")
    .toLowerCase()
    .replace(/[^a-z]+/g, " ")
    .trim();
}

export function sameStudy(a: VisitStudy, b: VisitStudy) {
  return (
    a.kind === b.kind && a.kind !== "examination" && region(a) !== "" && region(a) === region(b)
  );
}

/**
 * Tells whether two visits hold a study of the same kind and body region within 90 days, so the later may repeat the earlier.
 *
 * @remarks
 * ponytail: the region match is exact after case and punctuation, so "Pelvis" and "Abdomen and pelvis" never match. The user
 * links that pair by hand.
 */
export function repeatsStudy(
  a: Pick<Visit, "date" | "studies">,
  b: Pick<Visit, "date" | "studies">,
) {
  if (Math.abs(daysBetween(a.date, b.date)) > repeatStudyDays) return false;
  return a.studies.some((study) => b.studies.some((other) => sameStudy(study, other)));
}

/** Finds the sentence of a later study that speaks about the same alert rules, negated or not, else its first sentence. */
function answerLine(study: VisitStudy, keys: Set<string>) {
  const sentences = sentencesOf([study.impression, study.result]);
  const rules = studyAlertRules.filter(({ key }) => keys.has(key));
  return (
    sentences.find((sentence) =>
      rules.some(({ says }) => new RegExp(says.source, "i").test(sentence)),
    ) ??
    sentences[0] ??
    ""
  );
}

function settleAlert(study: VisitStudy, later: LaterVisit[]): Settlement | undefined {
  const line = alertLine([study.result, study.impression]);
  if (!line) return undefined;
  const keys = alertKeys([study.result, study.impression]);
  let settlement: Settlement | undefined;
  for (const visit of later.filter(({ linked }) => linked)) {
    const kind = visit.studies.filter((other) => other.kind === study.kind);
    const match = kind.find((other) => region(other) === region(study)) ?? kind[0];
    if (!match) continue;
    const found = alertKeys([match.result, match.impression]);
    const repeats = [...keys].some((key) => found.has(key));
    if (!repeats && found.size > 0) continue;
    settlement = {
      state: repeats ? "confirmed" : "settled",
      reportId: visit.reportId,
      date: visit.date,
      earlier: line,
      later: answerLine(match, keys),
      subject: line,
      alertKeys: [...keys],
    };
  }
  return settlement;
}

function scored(visit: Visit, key: string) {
  return visit.markers.find(
    (row): row is VisitMarker & { value: number; status: FindingSeverity } =>
      row.markerKey === key && row.status !== null && row.value !== null,
  );
}

function valueText(row: VisitMarker & { value: number; status: FindingSeverity }) {
  return `${withUnit(row.value, row.unit ?? "")} with ${row.status} status`;
}

function settleMarker(key: string, current: Visit, later: LaterVisit[]): Settlement | undefined {
  const before = scored(current, key);
  if (!before) return undefined;
  const repeat = later
    .filter(({ date }) => {
      const days = daysBetween(current.date, date);
      return days > 0 && days <= repeatMarkerDays;
    })
    .flatMap((visit) => {
      const row = scored(visit, key);
      return row ? [{ visit, row }] : [];
    })
    .at(-1);
  if (!repeat) return undefined;
  const { visit, row } = repeat;
  return {
    state: row.status === "optimal" ? "settled" : "confirmed",
    reportId: visit.reportId,
    date: visit.date,
    earlier: valueText(before),
    later: valueText(row),
    subject: names.get(key) ?? key,
    alertKeys: [],
    markerKey: key,
    severity: row.status,
  };
}

/**
 * Tells whether a later report settles or confirms one finding of this visit, or undefined when none speaks to it.
 *
 * @remarks
 * A study alert needs a linked later study of the same kind: no alert line there settles it, the same alert rule confirms it,
 * and a different alert leaves it open. A risk or change finding of one marker takes the status of the latest repeat of
 * that marker within 30 days, linked or not. `later` must be in date order.
 */
export function settleFinding(
  finding: Pick<FindingDraft, "kind" | "citedKeys" | "citedStudyIds">,
  current: Visit,
  later: LaterVisit[],
): Settlement | undefined {
  if (finding.kind === "study_alert") {
    const study = current.studies.find(({ id }) => id === finding.citedStudyIds[0]);
    return study && settleAlert(study, later);
  }
  const [key] = finding.citedKeys;
  if ((finding.kind === "risk" || finding.kind === "change") && key) {
    return settleMarker(key, current, later);
  }
  return undefined;
}

/**
 * Lists the questions for the doctor that do not name a settled finding.
 *
 * @remarks
 * Each engine question quotes the alert line or names the marker, so the subject alone finds it.
 */
export function openQuestions(questions: string[], settled: Pick<Settlement, "subject">[]) {
  return questions.filter((question) => !settled.some(({ subject }) => question.includes(subject)));
}
