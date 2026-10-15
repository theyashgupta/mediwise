import {
  alertHeadlineStart,
  categories,
  categoryLabel,
  coreMarkerKeys,
  countsInScore,
  coverageCap,
  derived,
  deviation,
  localizeAlertHeadline,
  localizeFollowUp,
  localizeVerdict,
  type Marker,
  markers,
  markerText,
  matchRange,
  normaliseUnit,
  patternText,
  rankMoveFirst,
  scoreFormula,
  studyMarkers,
  type TextLocale,
} from "@mediwise/engine";
import type { CreateReportInput, PageClass, ReportMime } from "@mediwise/shared";
import { randomUUID } from "node:crypto";
import { posix } from "node:path";
import { AppError } from "../../common/errors.js";
import { env } from "../../config/env.js";
import { createSignedUploadUrl, list, remove } from "../../lib/storage.js";
import { assertHealthDataConsent } from "../consents/index.js";
import { assertCanAddReport } from "../credits/index.js";
import { listFindings } from "../findings/index.js";
import { listReportLinks, loadSequence, settleStored } from "../links/index.js";
import { stepUsage } from "../extraction/index.js";
import { writeHindi } from "../narrative/index.js";
import { getOwnedProfile } from "../profiles/index.js";
import { claudeCostCents } from "../spend/index.js";
import { isVital } from "../studies/index.js";
import * as repo from "./reports.repo.js";
import { ruleTitle } from "./reports.title.js";

const pageSize = 20;
const draftLifetimeMs = 60 * 60 * 1000;

const extensions: Record<ReportMime, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/heic": "heic",
  "image/webp": "webp",
};

/**
 * Creates a draft report and returns one signed upload URL per file, in input order.
 *
 * @remarks
 * Supabase fixes signed upload URLs at 2 hours; a draft that is never confirmed is deleted after 1 hour on the next list.
 */
export async function createReport(userId: string, input: CreateReportInput) {
  if (env.CLAUDE_HARD_STOP) {
    throw new AppError(503, "We do not accept new reports at the moment. Try again later.");
  }
  await getOwnedProfile(userId, input.profileId);
  await assertHealthDataConsent(userId);
  const id = randomUUID();
  const files = input.files.map((file, index) => ({
    storagePath: `${userId}/${id}/${index}.${extensions[file.mime]}`,
    mime: file.mime,
    size: file.size,
    pageIndex: index,
    name: file.name,
  }));
  const sourceKind = files[0]?.mime === "application/pdf" ? "pdf" : "photos";
  await repo.insertDraftReport(
    userId,
    { id, profileId: input.profileId, sourceKind },
    files,
    assertCanAddReport,
  );
  const uploads = await Promise.all(files.map((file) => createSignedUploadUrl(file.storagePath)));
  return { id, uploadUrls: uploads.map((upload) => upload.signedUrl) };
}

/**
 * Confirms every file of a draft is in storage, then queues the report for processing.
 *
 * @remarks
 * A signed URL does not limit the size, so each object must match the size declared at creation.
 */
export async function markReportUploaded(userId: string, id: string) {
  const report = await getReport(userId, id);
  if (report.status !== "draft") return report;
  await assertHealthDataConsent(userId);
  const files = await repo.listReportFiles(id);
  const objects = await list(`${userId}/${id}`);
  const complete = files.every((file) =>
    objects.some(
      (object) =>
        object.name === posix.basename(file.storagePath) && object.metadata?.size === file.size,
    ),
  );
  if (!complete) throw new AppError(409, "Some files did not finish uploading");
  await repo.queueDraftReport(userId, id);
  return getReport(userId, id);
}

export async function listReports(userId: string, profileId: string, cursor?: string) {
  await deleteStaleDrafts(userId);
  const rows = await repo.listReportsByProfile(userId, profileId, pageSize + 1, cursor);
  const items = rows.slice(0, pageSize);
  return { items, nextCursor: rows.length > pageSize ? (items.at(-1)?.cursor ?? null) : null };
}

/**
 * Loads a report the user owns.
 *
 * @remarks
 * Another user's report answers 404, not 403, so ids cannot be probed.
 */
export async function getReport(userId: string, id: string) {
  const report = await repo.findReportById(userId, id);
  if (!report) throw new AppError(404, "We could not find this report");
  return report;
}

/**
 * Loads a report with everything the report page shows, plus its Claude cost when the admin asks.
 *
 * @remarks
 * The engine never runs here: statuses, score and follow-ups are what processing stored, so a catalog change cannot move an old report.
 * Only the split into open and settled findings is new on each load, because a link can change after the read.
 */
export async function getReportDetail(userId: string, id: string, locale: TextLocale = "en") {
  const report = await getReport(userId, id);
  const done = report.status === "done";
  const [storedFiles, storedStudies, storedFindings, sequence, links] = await Promise.all([
    repo.listReportFiles(id),
    done ? repo.listStudies(id) : [],
    done ? listFindings(id) : [],
    done ? loadSequence(id) : undefined,
    done ? listReportLinks(id) : [],
  ]);
  const files = describeFiles(storedFiles, storedStudies);
  const [rows, storedFollowUps, insights] = done
    ? await Promise.all([
        repo.listReportMarkers(id),
        repo.listFollowUps(id),
        repo.findReportInsights(id),
      ])
    : [[], [], undefined];
  const read = buildReportDetail(report, rows, storedFollowUps, insights, locale);
  const settled = sequence
    ? settleStored(id, sequence, {
        findings: storedFindings,
        doctorQuestions: read.doctorQuestions,
        narrative: read.narrative,
      })
    : {
        findings: storedFindings.map((finding) => ({ ...finding, sequence: null })),
        settled: [],
        doctorQuestions: read.doctorQuestions,
        narrative: read.narrative,
      };
  const detail = {
    ...read,
    ...withClaudeText(settled, locale, insights?.translations),
    studies: storedStudies.map((study) => toStudy(study, locale)),
    labs: [
      ...new Set([
        ...read.categories.flatMap((category) => category.labNames),
        ...storedStudies.flatMap((study) => study.labName ?? []),
      ]),
    ],
    files,
    links,
    ...(locale === "en"
      ? {}
      : {
          translation: done
            ? (insights?.translations?.[locale]?.status ?? ("missing" as const))
            : null,
        }),
  };
  if (!env.ADMIN_USER_ID || userId !== env.ADMIN_USER_ID) return detail;
  return { ...detail, costCents: await reportCostCents(id) };
}

type ClaudeText = Pick<
  ReturnType<typeof settleStored>,
  "findings" | "settled" | "doctorQuestions" | "narrative"
>;

/**
 * Swaps the Claude-written text of a report for its stored translation in the locale, once that translation passed.
 *
 * @remarks
 * Runs after the settle step, so the English logic that drops settled findings and questions stays the only logic.
 * A text with no translation keeps its English, and English returns the input as it is.
 */
function withClaudeText<T extends ClaudeText>(
  text: T,
  locale: TextLocale,
  translations: StoredTranslations | undefined,
): T {
  const stored = locale === "en" ? undefined : translations?.[locale];
  if (stored?.status !== "done") return text;
  const put = (english: string) => stored.text[english] ?? localizeAlertHeadline(english, locale);
  return {
    ...text,
    findings: text.findings.map((finding) => ({
      ...finding,
      title: put(finding.title),
      body: put(finding.body),
    })),
    settled: text.settled.map((item) => ({ ...item, title: put(item.title) })),
    doctorQuestions: text.doctorQuestions.map(put),
    narrative: text.narrative && {
      sections: text.narrative.sections.map((section) => ({
        ...section,
        sentences: section.sentences.map((sentence) => ({ ...sentence, text: put(sentence.text) })),
      })),
    },
  };
}

/** Prices the latest read of a report in US cents, to two decimals, or null when it has no read job. */
async function reportCostCents(id: string) {
  const job = await repo.findReadJobTokens(id);
  return job ? Math.round(claudeCostCents(job) * 100) / 100 : null;
}

const studyClasses = new Set<PageClass>([
  "imaging_report",
  "ecg_printout",
  "examination_form",
  "pathology_report",
]);

/**
 * Sorts a report's files into what the report page lists: other documents, images, skipped duplicates and a removed identity page.
 *
 * @remarks
 * An other document is a file MediWise does not read, named by its first page that is not an identity page. An image is a
 * raw film that sits with no study, so the page asks for its report.
 */
function describeFiles(
  files: Awaited<ReturnType<typeof repo.listReportFiles>>,
  studies: Awaited<ReturnType<typeof repo.listStudies>>,
) {
  const attached = new Set(studies.map((study) => study.filmFileId));
  const kept = (pageClasses: PageClass[] | null) =>
    (pageClasses ?? []).filter((pageClass) => pageClass !== "identity_document");
  return {
    otherDocuments: files.flatMap(({ name, pageClasses, skipReason }) => {
      const classes = kept(pageClasses);
      const read = classes.some(
        (pageClass) =>
          pageClass === "lab_panel" || pageClass === "raw_image" || studyClasses.has(pageClass),
      );
      const documentClass = classes[0];
      return name && documentClass && !skipReason && !read ? [{ name, documentClass }] : [];
    }),
    images: files.flatMap(({ id, name, pageClasses, skipReason }) => {
      const classes = kept(pageClasses);
      const film = classes.length > 0 && classes.every((pageClass) => pageClass === "raw_image");
      return name && film && !skipReason && !attached.has(id) ? [name] : [];
    }),
    duplicates: files.flatMap(({ name, skipReason }) =>
      name && skipReason === "duplicate" ? [name] : [],
    ),
    identityRemoved: files.some(
      ({ pageClasses, skipReason }) =>
        skipReason === "identity" || pageClasses?.includes("identity_document"),
    ),
  };
}

const studyCatalog = new Map(studyMarkers.map((entry, order) => [entry.key, { entry, order }]));

/** Shapes a stored study for the report page: impression first, measurements in catalog order. */
function toStudy(study: Awaited<ReturnType<typeof repo.listStudies>>[number], locale: TextLocale) {
  return {
    id: study.id,
    kind: study.kind,
    bodyRegion: study.bodyRegion,
    impression: study.impressionText,
    findings: study.findingsText,
    familyHistory: study.familyHistory,
    specimen: study.specimen,
    adequacy: study.adequacy,
    result: study.result,
    performedAt: study.performedAt,
    signedBy: study.signedBy,
    fileName: study.fileName,
    labName: study.labName,
    page: study.pageIndex + 1,
    filmName: study.filmName,
    measurements: study.measurements
      .flatMap((measurement) => {
        const known = studyCatalog.get(measurement.key);
        return known ? [{ ...measurement, known }] : [];
      })
      .sort((a, b) => a.known.order - b.known.order)
      .map(({ known: { entry }, ...measurement }) => ({
        key: measurement.key,
        name: entry.name,
        description: markerText(entry, locale).description,
        value: measurement.value,
        valueText: measurement.valueText,
        unit: measurement.unit,
        precision: entry.precision,
        printedRange: measurement.printedRange,
        status: measurement.status ?? ("unknown" as const),
      })),
  };
}

type StoredReport = Awaited<ReturnType<typeof getReport>>;
type StoredMarker = Awaited<ReturnType<typeof repo.listReportMarkers>>[number];
type StoredFollowUp = Awaited<ReturnType<typeof repo.listFollowUps>>[number];
type StoredInsights = Awaited<ReturnType<typeof repo.findReportInsights>>;
type StoredTranslations = NonNullable<StoredInsights>["translations"];

const catalog = new Map(
  [...markers, ...derived].map((entry, order) => [entry.key, { entry, order }]),
);

/**
 * Ranks the duplicate rows of one marker so the row the engine scored comes first.
 *
 * @remarks
 * The engine keeps the first value of a repeated marker, so only that row carries a status.
 */
function preference(row: StoredMarker) {
  if (row.status) return 0;
  return row.value === null ? 2 : 1;
}

function toRange(low: number | null, high: number | null) {
  return low === null && high === null ? null : { low, high };
}

const egfrEquations: [string, RegExp][] = [
  ["CKD-EPI 2021", /ckd[\s-]*epi\D*2021/i],
  ["CKD-EPI 2009", /ckd[\s-]*epi\D*2009/i],
  ["CKD-EPI", /ckd[\s-]*epi/i],
  ["MDRD", /mdrd/i],
  ["Cockcroft-Gault", /cockcroft/i],
];

/**
 * Reads the eGFR equation out of the printed test name, for example "eGFR (CKD-EPI 2021)".
 *
 * @remarks
 * Extraction puts the equation into the eGFR name when the report prints it, so the stored printed name holds it.
 */
export function egfrEquation(rawName: string) {
  return egfrEquations.find(([, pattern]) => pattern.test(rawName))?.[0] ?? null;
}

/** Returns the value as the lab printed it, only when its unit differs from the stored canonical unit. */
function printedReading(row: StoredMarker) {
  const { printedValue, printedUnit, unit } = row;
  if (printedValue === null || !printedUnit) return null;
  return normaliseUnit(printedUnit) === normaliseUnit(unit ?? "")
    ? null
    : { value: printedValue, unit: printedUnit };
}

function toMarkerRow(row: StoredMarker, entry: Marker, locale: TextLocale) {
  return {
    markerKey: entry.key,
    name: entry.name,
    shortName: entry.shortName ?? null,
    description: markerText(entry, locale).description,
    value: row.value,
    valueText: row.valueText,
    unit: row.unit,
    printed: printedReading(row),
    equation: entry.key === "egfr" && !row.derived ? egfrEquation(row.rawName) : null,
    precision: entry.precision,
    status: row.status ?? ("unknown" as const),
    deviation:
      row.status && row.value !== null
        ? deviation(row.value, { optimalLow: row.calibratedLow, optimalHigh: row.calibratedHigh })
        : null,
    labRange: toRange(row.labRangeLow, row.labRangeHigh),
    calibratedRange: toRange(row.calibratedLow, row.calibratedHigh),
    labName: row.labName,
  };
}

type MarkerRow = ReturnType<typeof toMarkerRow>;

type HistoryPoint = {
  reportId: string;
  collectedAt: string | null;
  createdAt: Date;
  value: number;
  status: MarkerRow["status"];
};

function buildReportDetail(
  report: StoredReport,
  rows: StoredMarker[],
  storedFollowUps: StoredFollowUp[],
  insights?: StoredInsights,
  locale: TextLocale = "en",
) {
  const seen = new Set<string>();
  const mapped: { row: MarkerRow; entry: Marker; order: number }[] = [];
  const derivedRows: { row: MarkerRow; order: number }[] = [];
  const unmapped: {
    rawName: string;
    value: number | null;
    valueText: string | null;
    unit: string | null;
  }[] = [];
  for (const row of rows.toSorted((a, b) => preference(a) - preference(b))) {
    const known = row.markerKey ? catalog.get(row.markerKey) : undefined;
    if (!known) {
      unmapped.push({
        rawName: row.rawName,
        value: row.value,
        valueText: row.valueText,
        unit: row.unit,
      });
      continue;
    }
    if (row.derived && countsInScore(known.entry)) {
      derivedRows.push({ row: toMarkerRow(row, known.entry, locale), order: known.order });
      continue;
    }
    if (seen.has(known.entry.key)) continue;
    seen.add(known.entry.key);
    mapped.push({
      row: toMarkerRow(row, known.entry, locale),
      entry: known.entry,
      order: known.order,
    });
  }
  const byOrder = (a: { order: number }, b: { order: number }) => a.order - b.order;
  mapped.sort(byOrder);
  derivedRows.sort(byOrder);

  const measuredCore = mapped.filter(({ row, entry }) => entry.core && row.value !== null).length;
  const core = coreMarkerKeys.length;
  const moveFirst = rankMoveFirst(
    mapped
      .filter(({ entry }) => countsInScore(entry))
      .map(({ row }) => ({
        result: { status: row.status, deviation: row.deviation ?? 0 },
        row,
      })),
  ).map(({ row }) => ({
    ...row,
    severity: row.status === "risk" ? ("critical" as const) : ("out_of_optimal" as const),
  }));

  return {
    id: report.id,
    profileId: report.profileId,
    status: report.status,
    error: report.error,
    createdAt: report.createdAt,
    header: {
      title: report.title,
      titleEdited: report.titleEdited,
      labName: report.labName,
      collectedAt: report.collectedAt,
      reportedAt: report.reportedAt,
      dateAmbiguous: report.dateAmbiguous,
      markerCount: report.markerCount,
      score: report.score,
      tier: report.tier,
      coverage: { measured: measuredCore, core, pct: report.coverage },
      capped: report.status === "done" && coverageCap(measuredCore, core) < 100,
      formula: scoreFormula,
    },
    verdict: report.verdict && localizeVerdict(report.verdict, locale),
    note: report.note,
    moveFirst,
    categories: categories.flatMap(({ key }) => {
      const label = categoryLabel(key, locale);
      const items = mapped.filter(({ entry }) => entry.category === key).map(({ row }) => row);
      const labNames = [...new Set(items.flatMap((row) => row.labName ?? []))];
      return items.length > 0 ? [{ key, label, labNames, markers: items }] : [];
    }),
    derived: derivedRows.map(({ row }) => row),
    unmapped,
    followUps: storedFollowUps.map(({ nextAction, ...followUp }) =>
      localizeFollowUp({ ...followUp, next: nextAction }, locale),
    ),
    unmeasured: storedFollowUps.flatMap((followUp) => {
      const entry =
        followUp.kind === "measure" ? catalog.get(followUp.markerKey ?? "")?.entry : undefined;
      return entry
        ? [
            {
              markerKey: entry.key,
              name: entry.name,
              description: markerText(entry, locale).description,
            },
          ]
        : [];
    }),
    patterns: (insights?.patterns ?? []).map((match) => ({
      ...match,
      ...patternText(match, locale),
    })),
    doctorQuestions: insights?.doctorQuestions ?? [],
    narrative: insights?.narrative ?? null,
  };
}

/**
 * Loads one marker of a done report with its history across the profile's done reports, catalog copy and follow-ups.
 *
 * @remarks
 * The row comes from the same build as the report page, so value, status and marker order match it.
 * History keeps one point per date, and this report wins its own date, so the page always marks its point.
 */
export async function getMarkerDetail(
  userId: string,
  id: string,
  markerKey: string,
  locale: TextLocale = "en",
) {
  const report = await getReport(userId, id);
  const notFound = new AppError(404, "This marker is not in this report");
  if (report.status !== "done") throw notFound;
  const [rows, storedFollowUps, profile] = await Promise.all([
    repo.listReportMarkers(id),
    repo.listFollowUps(id),
    repo.findReportProfile(userId, id),
  ]);
  const detail = buildReportDetail(report, rows, storedFollowUps, undefined, locale);
  const ordered = [...detail.categories.flatMap((category) => category.markers), ...detail.derived];
  const index = ordered.findIndex((row) => row.markerKey === markerKey);
  const marker = ordered[index];
  const entry = catalog.get(markerKey)?.entry;
  if (!marker || !entry || !profile) throw notFound;
  const text = markerText(entry, locale);

  const calibrated = marker.calibratedRange;
  const range =
    calibrated && marker.value !== null && marker.status !== "unknown"
      ? matchRange(
          entry,
          { sex: profile.sex ?? "other", ancestry: profile.ancestry },
          {
            value: marker.value,
            status: marker.status,
            optimal: [calibrated.low, calibrated.high],
          },
        )
      : undefined;
  const history = new Map<string, HistoryPoint>();
  for (const row of await repo.listMarkerHistory(userId, profile.id, markerKey)) {
    if (row.value === null || row.unit !== marker.unit) continue;
    const { reportId, collectedAt, createdAt, value } = row;
    const date = collectedAt ?? createdAt.toISOString().slice(0, 10);
    const kept = history.get(date);
    if (kept?.reportId === reportId && kept.status !== "unknown") continue;
    if (kept?.reportId === id && reportId !== id) continue;
    history.set(date, {
      reportId,
      collectedAt,
      createdAt,
      value,
      status: row.status ?? "unknown",
    });
  }
  const neighbour = (row: MarkerRow | undefined) =>
    row ? { markerKey: row.markerKey, name: row.name } : null;

  return {
    report: {
      id: report.id,
      title: report.title,
      labName: report.labName,
      collectedAt: report.collectedAt,
      createdAt: report.createdAt,
    },
    profile: { sex: profile.sex, ancestry: profile.ancestry },
    marker,
    watchRange: range ? toRange(range.watch[0], range.watch[1]) : null,
    calibratedSource: range
      ? (entry.sources.find((source) => source.id === range.source) ?? null)
      : null,
    history: [...history.values()],
    knowledge: {
      whatItIs: text.whatItIs,
      whyItMatters: text.whyItMatters,
      whatMovesIt: text.whatMovesIt,
    },
    southAsianNote: text.southAsianNote ?? null,
    sources: entry.sources,
    followUps: detail.followUps.filter((followUp) => followUp.markerKey === markerKey),
    previous: neighbour(ordered[index - 1]),
    next: neighbour(ordered[index + 1]),
  };
}

/** Saves the user's note on a report, and clears it when the note is empty. */
export async function setReportNote(userId: string, id: string, note: string) {
  const row = await repo.updateReportNote(userId, id, note || null);
  if (!row) throw new AppError(404, "We could not find this report");
  return row;
}

/** Builds the rule title of a stored report from its lab date, markers and studies. */
async function storedRuleTitle(id: string) {
  const facts = await repo.findTitleFacts(id);
  if (!facts) return undefined;
  return ruleTitle({
    markerCount: facts.markerKeys.filter((key) => !key || !isVital(key)).length,
    markerDate: facts.collectedAt,
    studies: facts.studies,
    uploadDate: facts.createdAt.toISOString().slice(0, 10),
  });
}

/** Saves the title the user wrote, or gives the report its rule title again when the title is empty. */
export async function setReportTitle(userId: string, id: string, title: string) {
  await getReport(userId, id);
  const next = title || (await storedRuleTitle(id));
  const row = next && (await repo.updateReportTitle(userId, id, next, title !== ""));
  if (!row) throw new AppError(404, "We could not find this report");
  return row;
}

/** Sets the rule title of every done report whose title the user did not write, and returns the count. */
export async function backfillReportTitles() {
  const ids = await repo.listRuleTitledReportIds();
  for (const id of ids) {
    const title = await storedRuleTitle(id);
    if (title) await repo.saveRuleTitle(id, title);
  }
  return ids.length;
}

export async function retryReport(userId: string, id: string) {
  const report = await getReport(userId, id);
  if (report.status !== "failed")
    throw new AppError(409, "You can retry only a report that failed");
  await assertHealthDataConsent(userId);
  await repo.requeueFailedReport(userId, id);
  return getReport(userId, id);
}

export async function deleteReport(userId: string, id: string) {
  const report = await getReport(userId, id);
  if (report.status === "processing") throw new AppError(409, "We are reading this report");
  const { deletedCount, paths } = await repo.deleteReport(userId, id);
  if (deletedCount === 0) throw new AppError(409, "We are reading this report");
  if (paths.length > 0) await remove(paths);
}

async function deleteStaleDrafts(userId: string) {
  const { paths } = await repo.deleteDraftsCreatedBefore(
    userId,
    new Date(Date.now() - draftLifetimeMs),
  );
  if (paths.length > 0) await remove(paths);
}

/**
 * Writes the Hindi text of a done report's narrative, findings and doctor questions once, and returns its status.
 *
 * @remarks
 * A stored result, done or failed, is returned with no new call, so each report pays for one translation at most.
 * The step's tokens join the report's read job, so the report cost and the monthly cap count them.
 */
export async function translateReport(userId: string, id: string) {
  const report = await getReport(userId, id);
  if (report.status !== "done") {
    throw new AppError(409, "MediWise can write the Hindi text only after it reads the report");
  }
  const [insights, storedFindings, rows] = await Promise.all([
    repo.findReportInsights(id),
    listFindings(id),
    repo.listReportMarkers(id),
  ]);
  const stored = insights?.translations?.hi;
  if (stored) return { status: stored.status };
  if (env.CLAUDE_HARD_STOP) {
    throw new AppError(503, "We cannot write the Hindi text at the moment. Try again later.");
  }
  const english = [
    ...new Set([
      ...(insights?.narrative?.sections ?? [])
        .flatMap((section) => section.sentences.map((sentence) => sentence.text))
        .filter((text) => !text.startsWith(alertHeadlineStart)),
      ...storedFindings.flatMap((finding) => [finding.title, finding.body]),
      ...(insights?.doctorQuestions ?? []),
    ]),
  ];
  const printedNames = [
    ...new Set(
      rows.flatMap((row) => {
        const entry = row.markerKey ? catalog.get(row.markerKey)?.entry : undefined;
        return entry ? [entry.name, ...(entry.shortName ? [entry.shortName] : [])] : [];
      }),
    ),
  ];
  const usage = stepUsage(env.ANTHROPIC_NARRATIVE_MODEL);
  const hindi = await writeHindi(english, printedNames, usage);
  const translation = hindi
    ? { status: "done" as const, text: Object.fromEntries(hindi) }
    : { status: "failed" as const, text: {} };
  await repo.saveTranslation(id, { ...insights?.translations, hi: translation }, usage);
  return { status: translation.status };
}
