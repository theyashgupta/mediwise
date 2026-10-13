import { markers } from "./catalog/index.js";
import { alertKeys, alertLine, sentencesOf, studyAlertRules } from "./patterns/study-alerts.js";
import { withUnit } from "./rank.js";
import type {
  FindingDraft,
  FindingSeverity,
  LaterVisit,
  MarkerStatus,
  Settlement,
  Visit,
  VisitMarker,
  VisitStudy,
} from "./types.js";

export const repeatStudyDays = 90;
export const repeatMarkerDays = 30;
const cadenceDates = 5;

const names = new Map(markers.map((entry) => [entry.key, entry.name]));

export function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
}

/**
 * Gives the median number of days between the newest report dates of a profile, or null with fewer than three dates.
 *
 * @remarks
 * It tells a weekly history from a yearly one, so the stale line and the repeat rule fit how often this person tests.
 */
export function typicalGapDays(dates: string[]) {
  const newest = [...new Set(dates)].sort().slice(-cadenceDates);
  if (newest.length < 3) return null;
  const gaps = newest
    .slice(1)
    .map((date, i) => daysBetween(newest[i]!, date))
    .sort((a, b) => a - b);
  return gaps[Math.floor(gaps.length / 2)]!;
}

/**
 * Tells whether a marker measured again `days` after an earlier value repeats it, so the two values belong together.
 *
 * @remarks
 * A person who tests every week or month measures the marker again by habit. For them only a recheck of a watch or risk
 * value counts. An unknown gap (fewer than three report dates) counts as a long one.
 */
export function repeatsMarker(
  days: number,
  earlier: MarkerStatus | null,
  typicalGap: number | null,
) {
  if (days <= 0 || days > repeatMarkerDays) return false;
  return (
    earlier === "watch" ||
    earlier === "risk" ||
    typicalGap === null ||
    typicalGap > repeatMarkerDays
  );
}

const modalityWords: [string, RegExp][] = [
  ["mammogram", /mammo/],
  ["ultrasound", /\b(usg|ultra ?sound|sonography|tvs|tas|doppler|echo)/],
  ["ct", /\b(ct|cect|ncct|hrct)\b|computed tomography/],
  ["mri", /\bmri\b|magnetic resonance/],
  ["x-ray", /x ?ray|radiograph|\bcxr\b/],
  ["ecg", /\b(ecg|ekg)\b/],
];

const kindModality: Record<string, string> = {
  ultrasound: "ultrasound",
  xray: "x-ray",
  ct: "ct",
  mri: "mri",
  ecg: "ecg",
};

const regionWords: [string, RegExp][] = [
  ["abdomen", /(?<!trans ?)abdom|\b(kub|kidneys?|renal|liver|gall ?bladder|hepat\w*)\b/],
  ["pelvis", /pelvi|\b(tvs|tas|transvaginal|uterus|ovar\w*|adnex\w*|endometri\w*)\b/],
  ["breast", /breast|mammo/],
  ["chest", /\b(chest|thora\w*|lungs?|heart|cardiac|echo\w*)\b/],
  ["neck", /\b(neck|thyroid|carotid)\b/],
  ["head", /\b(head|brain|skull|sinus\w*|orbits?)\b/],
  [
    "limb",
    /\b(limbs?|arms?|legs?|knees?|hips?|shoulders?|ankles?|wrists?|elbows?|hands?|feet|foot)\b/,
  ],
  ["whole body", /whole body/],
];

function printed(study: Pick<VisitStudy, "bodyRegion">) {
  return (study.bodyRegion ?? "")
    .toLowerCase()
    .replace(/[^a-z]+/g, " ")
    .trim();
}

/** Names the modality of a study from its printed name, else from its kind, or null for a kind that is not imaging. */
function modality(study: Pick<VisitStudy, "kind" | "bodyRegion">) {
  const name = printed(study);
  return (
    modalityWords.find(([, words]) => words.test(name))?.[0] ?? kindModality[study.kind] ?? null
  );
}

/**
 * Lists the body regions a study covers, from a small fixed list.
 *
 * @remarks
 * A printed name with no known region word keeps its whole printed name, so two odd names still match when they are equal.
 */
function regions(study: Pick<VisitStudy, "bodyRegion">) {
  const name = printed(study);
  const found = regionWords.filter(([, words]) => words.test(name)).map(([key]) => key);
  return new Set(found.length > 0 ? found : name ? [name] : []);
}

/** Tells whether two studies have the same modality and cover at least one same body region. */
export function sameStudy(a: VisitStudy, b: VisitStudy) {
  const kind = modality(a);
  if (!kind || kind !== modality(b)) return false;
  const other = regions(b);
  return [...regions(a)].some((key) => other.has(key));
}

function studyDate(visit: Pick<Visit, "date">, study: VisitStudy) {
  return study.performedAt ?? visit.date;
}

/**
 * Gives the days from a study of `a` to the same study in `b` within 90 days, or undefined when `b` repeats no study of `a`.
 *
 * @remarks
 * The dates are the study dates, because one report can hold studies of several dates.
 */
export function repeatGap(a: Pick<Visit, "date" | "studies">, b: Pick<Visit, "date" | "studies">) {
  for (const study of a.studies) {
    for (const other of b.studies) {
      const days = daysBetween(studyDate(a, study), studyDate(b, other));
      if (Math.abs(days) <= repeatStudyDays && sameStudy(study, other)) return days;
    }
  }
  return undefined;
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

function settleAlert(
  study: VisitStudy,
  current: Visit,
  later: LaterVisit[],
): Settlement | undefined {
  const line = alertLine([study.result, study.impression]);
  if (!line) return undefined;
  const keys = alertKeys([study.result, study.impression]);
  let settlement: Settlement | undefined;
  for (const visit of later.filter(({ linked }) => linked)) {
    const kind = visit.studies.filter((other) => other.kind === study.kind);
    const match =
      visit.studies.find((other) => sameStudy(study, other)) ??
      (kind.length === 1 ? kind[0] : undefined);
    if (!match) continue;
    const found = alertKeys([match.result, match.impression]);
    const repeats = [...keys].some((key) => found.has(key));
    if (!repeats && found.size > 0) continue;
    settlement = {
      state: repeats ? "confirmed" : "settled",
      reportId: visit.reportId,
      date: studyDate(visit, match),
      earlierDate: studyDate(current, study),
      labName: visit.labName,
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

function settleMarker(
  key: string,
  current: Visit,
  later: LaterVisit[],
  typicalGap: number | null,
): Settlement | undefined {
  const before = scored(current, key);
  if (!before) return undefined;
  const repeat = later
    .filter(({ date }) => repeatsMarker(daysBetween(current.date, date), before.status, typicalGap))
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
    earlierDate: current.date,
    labName: visit.labName,
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
 * A study alert needs a linked later study of the same modality and region: no alert line there settles it, the same alert rule confirms it,
 * and a different alert leaves it open. A risk or change finding of one marker takes the status of the latest repeat of
 * that marker by `repeatsMarker`, linked or not. `later` must be in date order.
 */
export function settleFinding(
  finding: Pick<FindingDraft, "kind" | "citedKeys" | "citedStudyIds">,
  current: Visit,
  later: LaterVisit[],
  typicalGap: number | null = null,
): Settlement | undefined {
  if (finding.kind === "study_alert") {
    const study = current.studies.find(({ id }) => id === finding.citedStudyIds[0]);
    return study && settleAlert(study, current, later);
  }
  const [key] = finding.citedKeys;
  if ((finding.kind === "risk" || finding.kind === "change") && key) {
    return settleMarker(key, current, later, typicalGap);
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
