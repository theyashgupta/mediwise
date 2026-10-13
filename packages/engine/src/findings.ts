import {
  coreMarkerKeys,
  countsInScore,
  derived,
  markers,
  type Marker,
  studyMarkers,
} from "./catalog/index.js";
import { toCanonical } from "./normalise.js";
import { riskQuestion, runLinks } from "./patterns/run-patterns.js";
import { alertLine } from "./patterns/study-alerts.js";
import { withUnit } from "./rank.js";
import { deviation, trendDirection } from "./status.js";
import type {
  FindingDraft,
  FindingKind,
  FindingSeverity,
  MarkerResult,
  PatternMatch,
  Visit,
  VisitMarker,
} from "./types.js";

const maxFindings = 12;
const maxDoctorQuestions = 6;
const minGoodNews = 3;
const catalog = new Map(
  [...markers, ...derived].map((entry, order) => [entry.key, { entry, order }]),
);
const studyNames = new Map(studyMarkers.map((entry) => [entry.key, entry.name]));
const core = new Set(coreMarkerKeys);
const months = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
const severityOrder: Record<FindingSeverity, number> = { risk: 0, watch: 1, optimal: 2 };
const kindOrder: Record<FindingKind, number> = {
  study_alert: -1,
  link: 0,
  change: 1,
  risk: 2,
  study: 3,
  good_news: 4,
};
const studyKindNames: Record<string, string> = {
  xray: "X-ray",
  ultrasound: "ultrasound",
  ct: "CT scan",
  mri: "MRI scan",
  ecg: "ECG",
  pathology: "pathology",
};
const methodNote =
  "Different labs measured these values, so the method may differ. Compare them with care.";

type Picked = { entry: Marker; row: VisitMarker; value: number | undefined };
type Draft = Omit<FindingDraft, "rank">;

function catalogOrder({ citedKeys }: Draft) {
  return catalog.get(citedKeys[0] ?? "")?.order ?? catalog.size;
}

function isCoreChange({ kind, citedKeys }: Draft) {
  return kind === "change" && core.has(citedKeys[0] ?? "");
}

function monthYear(date: string) {
  return `${months[Number(date.slice(5, 7)) - 1]} ${date.slice(0, 4)}`;
}

function preference({ row, value }: Pick<Picked, "row" | "value">) {
  if (row.status) return 0;
  return value === undefined ? 2 : 1;
}

/**
 * Keeps one row per catalog marker of a visit, with its value in the canonical unit when the catalog can convert it.
 *
 * @remarks
 * A scored row wins over a repeat, as on the report page. Study measurements are left out, they live on their study.
 */
function pickMarkers(visit: Visit) {
  const picked = new Map<string, Picked>();
  for (const row of visit.markers) {
    const known = catalog.get(row.markerKey);
    if (!known) continue;
    const value =
      row.value === null ? undefined : toCanonical(known.entry, row.value, row.unit ?? undefined);
    const item = { entry: known.entry, row, value };
    const kept = picked.get(row.markerKey);
    if (!kept || preference(item) < preference(kept)) picked.set(row.markerKey, item);
  }
  return picked;
}

/**
 * Tells whether two visits come from different labs, by the first two words of the lab name.
 *
 * @remarks
 * Labs print branch and partner names after the brand, so "LAKEVIEW Lab (Test performed at ...)" and "Lakeview Lab" are one lab.
 */
function differentLabs(a: string | null, b: string | null) {
  const brand = (name: string) =>
    name
      .toLowerCase()
      .match(/[a-z0-9]+/g)
      ?.slice(0, 2)
      .join(" ");
  return a !== null && b !== null && brand(a) !== brand(b);
}

function statusText(status: VisitMarker["status"]) {
  return status ? `${status} status` : "no status";
}

/**
 * Builds a change finding for a marker that moved status, or that got worse while out of the optimal range.
 *
 * @remarks
 * Both values must be in the catalog's canonical unit, so two printed units are compared only after conversion.
 */
function changeFinding(
  before: Picked,
  now: Picked,
  previous: Visit,
  current: Visit,
): Draft | undefined {
  const { entry } = now;
  if (before.value === undefined || now.value === undefined) return undefined;
  const optimal = {
    low: now.row.calibratedLow ?? before.row.calibratedLow,
    high: now.row.calibratedHigh ?? before.row.calibratedHigh,
  };
  const direction = trendDirection(
    entry.direction,
    before.value,
    now.value,
    entry.precision,
    optimal,
  );
  const [was, is] = [before.row.status, now.row.status];
  const moved = was !== null && is !== null && was !== is;
  const outside = [was, is].some((status) => status === "watch" || status === "risk");
  if (!moved && !(direction === "worsening" && outside)) return undefined;
  const severity =
    is ?? (direction === "worsening" ? (was === "risk" ? "risk" : "watch") : "optimal");
  const [a, b] = [withUnit(before.value, entry.unit), withUnit(now.value, entry.unit)];
  return {
    kind: "change",
    severity,
    direction,
    title: `${entry.name} ${direction}: ${a} in ${monthYear(previous.date)}, ${b} in ${monthYear(current.date)}`,
    citedKeys: [entry.key],
    citedStudyIds: [],
    facts: [
      `${entry.name} (${entry.key}) was ${a} with ${statusText(was)} on ${previous.date}.`,
      `It is ${b} with ${statusText(is)} on ${current.date}.`,
      `Direction: ${direction}.`,
    ],
    ...(differentLabs(previous.labName, current.labName) && { note: methodNote }),
    ...(direction === "worsening" && {
      askDoctor: `My ${entry.name} went from ${a} to ${b}. What could explain this change?`,
    }),
  };
}

function toResult({ entry, row, value }: Picked): MarkerResult {
  const optimal = { optimalLow: row.calibratedLow, optimalHigh: row.calibratedHigh };
  return {
    markerKey: entry.key,
    value: value ?? row.value ?? row.valueText ?? "",
    unit: value === undefined ? (row.unit ?? "") : entry.unit,
    status: row.status ?? "unknown",
    calibrated: null,
    deviation: value === undefined || !row.status ? 0 : deviation(value, optimal),
  };
}

function linkFinding(match: PatternMatch, current: Visit): Draft {
  const studies = current.studies.filter(({ id }) => match.studyIds?.includes(id));
  return {
    kind: "link",
    severity: match.severity,
    title: match.name,
    citedKeys: match.matched.map(({ markerKey }) => markerKey),
    citedStudyIds: studies.map(({ id }) => id),
    facts: [
      ...studies.map(({ kind, impression }) => `The ${kind} impression reads: ${impression}`),
      ...match.matched.map(({ markerKey, name, value, unit }) => {
        const status = current.markers.find((row) => row.markerKey === markerKey)?.status ?? null;
        return `${name} (${markerKey}) is ${withUnit(value, unit)} with ${statusText(status)}.`;
      }),
      match.whatItSuggests,
      match.whatToDo,
    ],
    ...(match.askDoctor[0] && { askDoctor: match.askDoctor[0] }),
  };
}

function studyFindings(current: Visit): Draft[] {
  return current.studies.flatMap((study) =>
    study.measurements.flatMap(({ key, value, unit, status }) => {
      if (status !== "watch" && status !== "risk") return [];
      const name = studyNames.get(key) ?? key;
      const printed = withUnit(value, unit ?? "");
      return [
        {
          kind: "study" as const,
          severity: status,
          title: `${name} ${printed} has ${status} status`,
          citedKeys: [],
          citedStudyIds: [study.id],
          facts: [
            `The ${study.kind} printed ${name} as ${printed}, which has ${status} status.`,
            `The ${study.kind} impression reads: ${study.impression ?? "none"}`,
          ],
        },
      ];
    }),
  );
}

/**
 * Builds a risk finding for each study whose result or impression prints a line the alert table marks.
 *
 * @remarks
 * The engine note and the fallback body point to the doctor on every read, so the alert holds even when Claude fails.
 * An examination form is left out, because its verdict is the doctor's own.
 */
function alertFindings(current: Visit): Draft[] {
  return current.studies.flatMap((study) => {
    const line =
      study.kind === "examination" ? undefined : alertLine([study.result, study.impression]);
    if (!line) return [];
    const name = studyKindNames[study.kind] ?? "test";
    return [
      {
        kind: "study_alert" as const,
        severity: "risk" as const,
        title: `Your ${name} report says: "${line}"`,
        citedKeys: [],
        citedStudyIds: [study.id],
        facts: [
          `The ${name} report prints this line: ${line}`,
          "Say that the report prints this line. Do not explain what it may mean.",
        ],
        note: "Ask your doctor about this line of the report.",
        fallback: `Your ${name} report prints this line.`,
        askDoctor: `My ${name} report says: "${line}" What does this line mean for me?`,
      },
    ];
  });
}

/** Names the reports with an alert in one headline sentence, or returns undefined when no study has one. */
function alertHeadline(current: Visit, findings: Draft[]) {
  const alerted = new Set(
    findings.flatMap(({ kind, citedStudyIds }) => (kind === "study_alert" ? citedStudyIds : [])),
  );
  const names = [
    ...new Set(
      current.studies
        .filter(({ id }) => alerted.has(id))
        .map(({ kind }) => studyKindNames[kind] ?? "test"),
    ),
  ];
  if (names.length === 0) return undefined;
  return `Ask your doctor about a line in your ${names.join(" and ")} ${names.length === 1 ? "report" : "reports"}.`;
}

function riskFinding({ entry, row, value }: Picked): Draft {
  const printed = withUnit(value ?? row.value, value === undefined ? (row.unit ?? "") : entry.unit);
  return {
    kind: "risk",
    severity: "risk",
    title: `${entry.name} ${printed} has risk status`,
    citedKeys: [entry.key],
    citedStudyIds: [],
    facts: [`${entry.name} (${entry.key}) is ${printed} with risk status on this visit.`],
    askDoctor: riskQuestion({
      markerKey: entry.key,
      value: value ?? row.value ?? "",
      unit: entry.unit,
    }),
  };
}

function goodNews(optimal: Picked[]): Draft[] {
  if (optimal.length < minGoodNews) return [];
  return [
    {
      kind: "good_news",
      severity: "optimal",
      title: `${optimal.length} core markers are optimal`,
      citedKeys: optimal.map(({ entry }) => entry.key),
      citedStudyIds: [],
      facts: optimal.map(
        ({ entry, row, value }) =>
          `${entry.name} (${entry.key}) is ${withUnit(value ?? row.value, entry.unit)} with optimal status.`,
      ),
    },
  ];
}

/**
 * Picks the findings of one visit, with the previous visit for changes, the questions for the doctor and an alert headline.
 *
 * @remarks
 * Pure: the same visits give the same findings, titles and cited keys. Claude writes only the body of each finding.
 * A marker that a link or a change finding cites gets no risk or good news finding of its own.
 * Past 12 findings only core marker changes are kept, so every core marker that moved stays in the list.
 */
export function buildFindings(
  current: Visit,
  previous: Visit | undefined,
  patterns: PatternMatch[],
) {
  const now = pickMarkers(current);
  const before = previous ? pickMarkers(previous) : new Map<string, Picked>();
  const links = runLinks(
    { markers: [...now.values()].map(toResult), derived: [] },
    current.studies,
  ).map((match) => linkFinding(match, current));
  const changes = previous
    ? [...now.values()].flatMap((item) => {
        const earlier = before.get(item.entry.key);
        const found = earlier && changeFinding(earlier, item, previous, current);
        return found ? [found] : [];
      })
    : [];
  const cited = new Set([...links, ...changes].flatMap(({ citedKeys }) => citedKeys));
  const free = [...now.values()].filter(({ entry }) => !cited.has(entry.key));
  const drafts = [
    ...alertFindings(current),
    ...links,
    ...changes,
    ...free
      .filter(({ entry, row }) => row.status === "risk" && countsInScore(entry))
      .map(riskFinding),
    ...studyFindings(current),
    ...goodNews(free.filter(({ entry, row }) => core.has(entry.key) && row.status === "optimal")),
  ];
  const findings = drafts
    .toSorted(
      (a, b) =>
        severityOrder[a.severity] - severityOrder[b.severity] ||
        kindOrder[a.kind] - kindOrder[b.kind] ||
        Number(b.direction === "worsening") - Number(a.direction === "worsening") ||
        Number(core.has(b.citedKeys[0] ?? "")) - Number(core.has(a.citedKeys[0] ?? "")) ||
        catalogOrder(a) - catalogOrder(b),
    )
    .filter((draft, index) => index < maxFindings || isCoreChange(draft))
    .map((draft, rank): FindingDraft => ({ ...draft, rank }));
  const questions = new Set([
    ...findings.flatMap(({ askDoctor }) => askDoctor ?? []),
    ...patterns.flatMap(({ askDoctor }) => askDoctor),
  ]);
  return {
    findings,
    doctorQuestions: [...questions].slice(0, maxDoctorQuestions),
    headline: alertHeadline(current, findings),
  };
}
