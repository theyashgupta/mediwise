import {
  assessMeasurements,
  buildFindings,
  derived,
  type FindingDraft,
  type EngineOutput,
  type EngineProfile,
  type EngineValue,
  isPopulationRow,
  joinWrappedNames,
  runEngine,
  type Visit,
} from "@mediwise/engine";
import type { ExtractedMarker, ExtractedReport, PageClass } from "@mediwise/shared";
import { createHash, randomUUID } from "node:crypto";
import sharp from "sharp";
import { AppError } from "../../common/errors.js";
import { keepPdfPages } from "../../lib/pdf-pages.js";
import { download, remove, upload } from "../../lib/storage.js";
import { log } from "../../middleware/logger.js";
import { classifyPages } from "../classification/index.js";
import {
  extractReport,
  mapMarkers,
  type ReportFileData,
  type ReportPage,
  readPages,
  type ReportUsage,
  type StepUsage,
} from "../extraction/index.js";
import { refundReport } from "../credits/index.js";
import {
  fallbackFindings,
  findPreviousVisit,
  type FindingsUsage,
  writeFindings,
} from "../findings/index.js";
import { listLaterVisits, proposeLinks } from "../links/index.js";
import { withHeadline, writeNarrative } from "../narrative/index.js";
import { readStudies, type StudyDraft, type StudyPage, vitalValues } from "../studies/index.js";
import * as repo from "./reports.repo.js";

const maxPagesBytes = 40 * 1024 * 1024;
const photoPixels = 1568;
const derivedNames = new Map(derived.map((entry) => [entry.key, entry.name]));

/**
 * Checks an uploaded file and turns a photo into a JPEG Claude can read.
 *
 * @remarks
 * A file without a PDF header is refused here, so a damaged upload fails without spending a Claude call.
 * Claude reads no HEIC and no image over 5 MB, so every photo becomes a JPEG at most 1568 pixels on the long side.
 */
async function readableFile(mime: string, data: Buffer): Promise<ReportFileData> {
  if (mime === "application/pdf") {
    if (!data.subarray(0, 1024).includes("%PDF-")) {
      throw new AppError(422, "This file is damaged or is not a PDF. Upload the report again.");
    }
    return { mime, data };
  }
  try {
    const jpeg = await sharp(data)
      .rotate()
      .resize(photoPixels, photoPixels, { fit: "inside", withoutEnlargement: true })
      .jpeg()
      .toBuffer();
    return { mime: "image/jpeg", data: jpeg };
  } catch {
    throw new AppError(422, "We could not open the photos. Upload JPEG or PNG photos.");
  }
}

type StoredReport = NonNullable<Awaited<ReturnType<typeof repo.findReportForProcessing>>>;

const studyClasses = new Set<PageClass>([
  "imaging_report",
  "ecg_printout",
  "examination_form",
  "pathology_report",
]);

/**
 * Skips duplicate files, classifies every page, cuts identity pages from storage and sorts the pages to read.
 *
 * @remarks
 * A file classified on an earlier attempt keeps its classes unless `reclassify` is set, so a worker retry costs no extra call.
 * A new class replaces the old one page by page, and a page cut as an identity page stays cut.
 * The cut file is uploaded before its classes are saved, so a crash in between can never leave an identity page marked as cut.
 */
async function sortFiles(report: StoredReport, usage: StepUsage, reclassify: boolean) {
  const known = new Set(await repo.listProfileFileHashes(report.profileId, report.id));
  for (const file of report.files) if (file.pageClasses && file.sha256) known.add(file.sha256);
  const lab: ReportPage[] = [];
  const studyFiles: { fileId: string; pages: StudyPage[] }[] = [];
  const films: string[] = [];
  let duplicates = report.files.filter((file) => file.skipReason === "duplicate").length;
  for (const file of report.files.filter((stored) => !stored.skipReason)) {
    const raw = await download(file.storagePath);
    const pages = await readPages(await readableFile(file.mime, raw));
    let classes: PageClass[] | undefined = file.pageClasses?.filter(
      (pageClass) => pageClass !== "identity_document",
    );
    let uploadedIndexes = file.pageClasses?.flatMap((pageClass, index) =>
      pageClass === "identity_document" ? [] : [index],
    );
    const sha256 = file.sha256 ?? createHash("sha256").update(raw).digest("hex");
    if (!file.pageClasses) {
      if (known.has(sha256)) {
        await repo.updateReportFile(file.id, { sha256, skipReason: "duplicate" });
        await remove([file.storagePath]);
        duplicates++;
        continue;
      }
      known.add(sha256);
    }
    if (!file.pageClasses || reclassify) {
      const fresh = await classifyPages(pages, usage);
      let next = 0;
      const pageClasses =
        file.pageClasses?.map((pageClass) =>
          pageClass === "identity_document" ? pageClass : (fresh[next++] ?? pageClass),
        ) ?? fresh;
      const kept = fresh.flatMap((pageClass, index) =>
        pageClass === "identity_document" ? [] : [index],
      );
      if (kept.length === 0) {
        await remove([file.storagePath]);
        await repo.updateReportFile(file.id, { sha256, pageClasses, skipReason: "identity" });
        continue;
      }
      if (kept.length < fresh.length) {
        await upload(file.storagePath, await keepPdfPages(raw, kept), file.mime);
      }
      await repo.updateReportFile(file.id, { sha256, pageClasses });
      classes = fresh;
      uploadedIndexes ??= fresh.map((_, index) => index);
    }
    const sorted = pages.flatMap((page, index) => {
      const pageClass = classes?.[index];
      const pageIndex = uploadedIndexes?.[index];
      return pageClass && pageIndex !== undefined ? [{ page, pageClass, pageIndex }] : [];
    });
    lab.push(
      ...sorted.filter(({ pageClass }) => pageClass === "lab_panel").map(({ page }) => page),
    );
    const study = sorted.filter(({ pageClass }) => studyClasses.has(pageClass));
    if (study.length > 0) studyFiles.push({ fileId: file.id, pages: study });
    if (sorted.length > 0 && sorted.every(({ pageClass }) => pageClass === "raw_image")) {
      films.push(file.id);
    }
  }
  if (lab.length + studyFiles.length + films.length === 0) {
    if (duplicates === report.files.length) {
      throw new AppError(409, "This file is already in your reports.");
    }
    throw new AppError(422, "We found no lab values in this file. Upload a lab report.");
  }
  const size = lab.reduce(
    (total, page) => total + ("text" in page ? page.text.length : page.image.length),
    0,
  );
  if (size > maxPagesBytes) {
    throw new AppError(413, "These files are larger than 40 MB together. Upload a smaller PDF.");
  }
  return { lab, studyFiles, films };
}

/**
 * Writes the narrative, or returns null when it fails validation twice or the call throws.
 *
 * @remarks
 * A thrown error does not fail the job, because the worker retry would repeat the whole extraction for an optional section.
 */
async function narrate(
  reportId: string,
  output: EngineOutput,
  profile: EngineProfile,
  usage: StepUsage,
) {
  try {
    return await writeNarrative(output, profile, usage);
  } catch (error) {
    const name = error instanceof Error ? error.name : "unknown";
    log.error(`process_report report=${reportId} step=narrative error=${name}`);
    return null;
  }
}

/**
 * Writes the body of each finding, or keeps only the findings with an engine fallback body when the call throws.
 *
 * @remarks
 * Findings are optional like the narrative, so a provider error never fails the job.
 */
async function describeFindings(
  reportId: string,
  drafts: FindingDraft[],
  current: Visit,
  previous: Visit | undefined,
  usage: FindingsUsage,
) {
  try {
    return await writeFindings(drafts, [current, previous], usage);
  } catch (error) {
    const name = error instanceof Error ? error.name : "unknown";
    log.error(`process_report report=${reportId} step=findings error=${name}`);
    return fallbackFindings(drafts);
  }
}

/** Whole years between two ISO dates. */
export function ageOn(dateOfBirth: string, on: string) {
  const years = Number(on.slice(0, 4)) - Number(dateOfBirth.slice(0, 4));
  return on.slice(5) < dateOfBirth.slice(5) ? years - 1 : years;
}

/**
 * Date of birth as the collection date minus the printed age, approximate when the report prints no months or days.
 *
 * @remarks
 * Years and months come off first and the day clamps to the month end, then the days come off.
 * So 13 Jan 2024 minus 24 Y 8 M 21 D is 22 Apr 1999.
 */
function birthFromAge(collectedAt: string, age: NonNullable<ExtractedReport["patient"]>) {
  const { ageYears = 0, ageMonths, ageDays } = age;
  const [year = 0, month = 1, day = 1] = collectedAt.split("-").map(Number);
  const months = year * 12 + month - 1 - ageYears * 12 - (ageMonths ?? 0);
  const [birthYear, birthMonth] = [Math.floor(months / 12), months % 12];
  const monthEnd = new Date(Date.UTC(birthYear, birthMonth + 1, 0)).getUTCDate();
  const birth = new Date(Date.UTC(birthYear, birthMonth, Math.min(day, monthEnd) - (ageDays ?? 0)));
  return {
    dateOfBirth: birth.toISOString().slice(0, 10),
    approximate: ageMonths === undefined || ageDays === undefined,
  };
}

/**
 * Logs one line per pipeline step with ids, counts and timings only, never a value, a name or file content.
 */
function stepLogger(reportId: string) {
  let last = Date.now();
  return (name: string, detail = "") => {
    const now = Date.now();
    log.info(`process_report report=${reportId} step=${name} ms=${now - last}${detail}`);
    last = now;
  };
}

type Person = Pick<
  NonNullable<Awaited<ReturnType<typeof repo.findReportForProcessing>>>,
  "dateOfBirth" | "sex" | "ancestry"
>;

type StudyFacts = {
  vitals: EngineValue[];
  ageYears?: number;
  performedAt?: string;
  hasStudies: boolean;
};

/** Builds the engine profile, or undefined when neither the profile nor a printed page gives an age. */
function engineProfile(person: Person, on: string, ageYears: number | undefined) {
  const age = person.dateOfBirth ? ageOn(person.dateOfBirth, on) : ageYears;
  if (age === undefined) return undefined;
  return { ageYears: age, sex: person.sex ?? "other", ancestry: person.ancestry } as EngineProfile;
}

/**
 * Reads lab pages end to end with Claude and the engine, and returns every row to store, without touching the database.
 *
 * @remarks
 * The token counts of each Claude call land in `usage` as they happen, so a read that throws still reports its spend.
 * Vitals from an examination form join the engine run, so they get a status and a BMI, but they never count in the score.
 */
export async function readReport(
  reportId: string,
  pages: ReportPage[],
  person: Person,
  usage: ReportUsage,
  facts: StudyFacts = { vitals: [], hasStudies: false },
) {
  const step = stepLogger(reportId);
  const extraction: ExtractedReport =
    pages.length > 0 ? await extractReport(pages, usage.extract) : { markers: [] };
  const extracted = joinWrappedNames(
    extraction.markers.filter((marker) => !isPopulationRow(marker.rawName)),
    pages.flatMap((page) => ("text" in page ? [page.text] : [])),
  );
  step("extract", ` markers=${extracted.length}`);
  if (extracted.length === 0 && facts.vitals.length === 0 && !facts.hasStudies) {
    throw new AppError(422, "We found no lab values in this file. Upload a lab report.");
  }

  const labMappings = await mapMarkers(extracted, usage.map);
  const mappedCount = labMappings.filter((mapping) => mapping.markerKey).length;
  step("map", ` mapped=${mappedCount}/${labMappings.length}`);

  const collectedAt =
    extraction.collectedAt ?? facts.performedAt ?? new Date().toISOString().slice(0, 10);
  const birth =
    !person.dateOfBirth && extraction.collectedAt && extraction.patient
      ? birthFromAge(extraction.collectedAt, extraction.patient)
      : undefined;
  const profile = engineProfile(
    person,
    collectedAt,
    extraction.patient?.ageYears ?? facts.ageYears,
  );
  if (!profile) {
    throw new AppError(422, "Add a date of birth to this profile. Then try again.");
  }
  const rows: ExtractedMarker[] = [
    ...extracted,
    ...facts.vitals.map(({ rawName, value, unit }) => ({ rawName, value, unit, pageIndex: 0 })),
  ];
  const mappings = [
    ...labMappings,
    ...facts.vitals.map((vital) => ({ markerKey: vital.markerKey ?? null, suggested: false })),
  ];
  const values = rows.map((marker, i): EngineValue => ({
    rawName: marker.rawName,
    panel: marker.panel,
    markerKey: mappings[i]?.markerKey ?? undefined,
    value: marker.value,
    unit: marker.unit,
    labLow: marker.referenceLow,
    labHigh: marker.referenceHigh,
  }));
  const output = runEngine({ profile, values });
  const hasLab = extracted.length > 0;
  step("engine", ` patterns=${output.patterns.length}`);

  const narrative = hasLab ? await narrate(reportId, output, profile, usage.narrative) : null;
  step("narrative", ` status=${narrative ? "done" : "failed"}`);

  const results = new Map(output.markers.map((result) => [result.markerKey, result]));
  const markerRows = rows.map((marker, i) => {
    const markerKey = mappings[i]?.markerKey ?? null;
    const numeric = typeof marker.value === "number" ? marker.value : null;
    const result = markerKey ? results.get(markerKey) : undefined;
    if (markerKey && result) results.delete(markerKey);
    const converted =
      typeof result?.value === "number" ? { value: result.value, unit: result.unit } : undefined;
    return {
      id: randomUUID(),
      reportId,
      markerKey,
      rawName: marker.rawName,
      value: converted?.value ?? numeric,
      valueText: numeric === null ? String(marker.value) : null,
      unit: converted?.unit ?? marker.unit ?? null,
      labRangeLow: result ? (result.labRange?.low ?? null) : (marker.referenceLow ?? null),
      labRangeHigh: result ? (result.labRange?.high ?? null) : (marker.referenceHigh ?? null),
      status: result && result.status !== "unknown" ? result.status : null,
      calibratedLow: result?.calibrated?.optimalLow ?? null,
      calibratedHigh: result?.calibrated?.optimalHigh ?? null,
    };
  });
  const derivedRows = output.derived.map((result) => ({
    reportId,
    markerKey: result.markerKey,
    rawName: derivedNames.get(result.markerKey) ?? result.markerKey,
    value: typeof result.value === "number" ? result.value : null,
    valueText: typeof result.value === "number" ? null : result.value,
    unit: result.unit,
    status: result.status === "unknown" ? null : result.status,
    calibratedLow: result.calibrated?.optimalLow ?? null,
    calibratedHigh: result.calibrated?.optimalHigh ?? null,
    derived: true,
  }));
  const suggestions = markerRows.flatMap((row, i) =>
    mappings[i]?.suggested
      ? [
          {
            reportMarkerId: row.id,
            rawName: row.rawName,
            unit: rows[i]?.unit ?? null,
            suggestedMarkerKey: row.markerKey,
          },
        ]
      : [],
  );
  const followUpRows = hasLab
    ? output.followUps.map((followUp) => ({
        reportId,
        kind: followUp.kind,
        markerKey: followUp.markerKey,
        title: followUp.title,
        why: followUp.why,
        nextAction: followUp.next,
        rank: followUp.rank,
      }))
    : [];

  return {
    extraction,
    birth,
    mappedCount,
    hasLab,
    profile,
    output,
    narrative,
    markerRows,
    derivedRows,
    suggestions,
    followUpRows,
  };
}

/**
 * Picks the study each raw film sits with: an X-ray of the same report first, then another scan.
 *
 * @remarks
 * MediWise never reads a film, so the match uses the study kind only. A film with no free scan study stays alone.
 */
function attachFilms(studies: StudyDraft[], films: string[]) {
  const scans = [
    ...studies.filter((study) => study.kind === "xray"),
    ...studies.filter((study) => ["ct", "mri", "ultrasound", "other"].includes(study.kind)),
  ];
  return new Map(films.flatMap((film, i) => (scans[i] ? [[scans[i], film] as const] : [])));
}

/** Reads the study pages of every file, one Claude call per file, and a file with a scanned page on the scan model. */
async function readStudyFiles(files: { fileId: string; pages: StudyPage[] }[], usage: ReportUsage) {
  const studies: (StudyDraft & { reportFileId: string })[] = [];
  let ageYears: number | undefined;
  for (const file of files) {
    const scanned = file.pages.some(({ page }) => !("text" in page));
    const read = await readStudies(file.pages, scanned ? usage.studyScans : usage.studies);
    studies.push(...read.studies.map((study) => ({ ...study, reportFileId: file.fileId })));
    ageYears ??= read.ageYears;
  }
  return { studies, ageYears };
}

/**
 * Reads a queued report end to end and stores its markers, studies, follow-ups, score, patterns and narrative.
 *
 * @remarks
 * `usage` belongs to the job, so the worker can store the tokens of an attempt that fails.
 * A report with studies and no lab values is done with no score, because a scan or an ECG never gives one.
 * `reclassify` asks Claude for the page classes again, for a re-read after the class list changed.
 */
export async function processReport(reportId: string, usage: ReportUsage, reclassify = false) {
  const step = stepLogger(reportId);
  const report = await repo.findReportForProcessing(reportId);
  if (!report) throw new Error(`Report ${reportId} not found`);
  await repo.updateReportStatus(reportId, "processing");
  step("processing");

  const { lab, studyFiles, films } = await sortFiles(report, usage.classify, reclassify);
  step(
    "sort",
    ` files=${report.files.length} pages=${lab.length} study_files=${studyFiles.length} films=${films.length}`,
  );

  const { studies, ageYears } = await readStudyFiles(studyFiles, usage);
  const vitals = vitalValues(studies);
  const performedAt = studies.flatMap((study) => study.performedAt ?? []).sort()[0];
  step("studies", ` studies=${studies.length} vitals=${vitals.length}`);

  const read =
    lab.length > 0 || vitals.length > 0
      ? await readReport(reportId, lab, report, usage, {
          vitals,
          ageYears,
          performedAt,
          hasStudies: studies.length + films.length > 0,
        })
      : undefined;
  const collectedAt = read?.extraction.collectedAt ?? performedAt ?? null;
  const profile =
    read?.profile ??
    engineProfile(report, collectedAt ?? new Date().toISOString().slice(0, 10), ageYears);
  const filmOf = attachFilms(studies, films);
  const studyRows = studies.map((study) => {
    const statuses = profile
      ? assessMeasurements(
          study.measurements.map((measurement) => ({
            rawName: measurement.key,
            markerKey: measurement.key,
            value: measurement.value ?? measurement.valueText ?? "",
            unit: measurement.unit ?? undefined,
          })),
          profile,
        )
      : [];
    return {
      study: {
        id: randomUUID(),
        reportId,
        kind: study.kind,
        bodyRegion: study.bodyRegion,
        findingsText: study.findingsText,
        impressionText: study.impressionText,
        familyHistory: study.familyHistory,
        specimen: study.specimen,
        adequacy: study.adequacy,
        resultText: study.resultText,
        performedAt: study.performedAt,
        signedBy: study.signedBy,
        reportFileId: study.reportFileId,
        pageIndex: study.pageIndex,
        filmFileId: filmOf.get(study) ?? null,
      },
      measurements: study.measurements.flatMap((measurement, i) => {
        if (vitals.some((vital) => vital.markerKey === measurement.key)) return [];
        const result = statuses[i];
        const converted = typeof result?.value === "number" ? result.value : undefined;
        return [
          {
            key: measurement.key,
            value: converted ?? measurement.value,
            valueText: measurement.valueText,
            unit: converted === undefined ? measurement.unit : (result?.unit ?? null),
            printedRange: measurement.printedRange,
            status: result && result.status !== "unknown" ? result.status : null,
          },
        ];
      }),
    };
  });

  const current: Visit = {
    date: collectedAt ?? report.createdAt.toISOString().slice(0, 10),
    labName: read?.extraction.lab?.name ?? null,
    markers: [...(read?.markerRows ?? []), ...(read?.derivedRows ?? [])].flatMap(
      ({ markerKey, value, valueText, unit, status, calibratedLow, calibratedHigh }) =>
        markerKey
          ? [{ markerKey, value, valueText, unit, status, calibratedLow, calibratedHigh }]
          : [],
    ),
    studies: studyRows.map(({ study, measurements }) => ({
      id: study.id,
      kind: study.kind,
      bodyRegion: study.bodyRegion ?? null,
      impression: study.impressionText ?? null,
      result: study.resultText ?? null,
      measurements: measurements.map(({ key, value, unit, status }) => ({
        key,
        value: value ?? null,
        unit: unit ?? null,
        status,
      })),
    })),
  };
  const scored = read?.hasLab ? read : undefined;
  const previous = await findPreviousVisit(report.profileId, reportId, current.date);
  await proposeLinks(report.profileId, { ...report, id: reportId, date: current.date }, current);
  const later = await listLaterVisits(report.profileId, reportId, current.date);
  const {
    findings: drafts,
    doctorQuestions,
    headline,
  } = buildFindings(current, previous, scored?.output.patterns ?? [], later);
  const findings = await describeFindings(reportId, drafts, current, previous, usage.findings);
  step(
    "findings",
    ` drafts=${drafts.length} kept=${findings.length} previous=${previous ? 1 : 0} later=${later.length}`,
  );

  await repo.saveReportResult(
    reportId,
    {
      labName: read?.extraction.lab?.name ?? null,
      collectedAt,
      reportedAt: read?.extraction.reportedAt ?? null,
      score: scored ? Math.round(scored.output.score.overall) : null,
      tier: scored ? scored.output.score.tier : null,
      coverage: scored ? Math.round(scored.output.score.coverage.pct) : null,
      verdict: scored ? scored.output.verdict : null,
      patterns: scored ? scored.output.patterns : [],
      doctorQuestions,
      narrative: scored?.narrative ? withHeadline(scored.narrative, headline) : null,
      narrativeStatus: scored ? (scored.narrative ? "done" : "failed") : null,
    },
    read ? [...read.markerRows, ...read.derivedRows] : [],
    read?.suggestions ?? [],
    read?.followUpRows ?? [],
    studyRows,
    findings.map((finding) => ({ ...finding, reportId })),
  );
  if (read?.birth) {
    await repo.fillDateOfBirth(report.profileId, read.birth.dateOfBirth, read.birth.approximate);
  }
  step("save", ` studies=${studyRows.length}`);
}

/**
 * Marks a report failed with a message the user can act on, and gives back its credit.
 *
 * @remarks
 * Only an `AppError` carries a message for the user. Provider errors, billing ones included, get a generic message.
 */
export async function failReport(reportId: string, error: unknown) {
  const message =
    error instanceof AppError
      ? error.message
      : "We could not read this report. Try again in a few minutes.";
  await repo.updateReportStatus(reportId, "failed", message);
  await refundReport(reportId);
}

export async function pauseReport(reportId: string) {
  await repo.updateReportStatus(reportId, "paused");
}
