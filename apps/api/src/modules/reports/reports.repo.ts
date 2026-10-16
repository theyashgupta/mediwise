import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  lt,
  ne,
  notInArray,
  type SQL,
  sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../../db/client.js";
import {
  findings,
  followUps,
  type ReportTranslations,
  jobs,
  markerAliasSuggestions,
  profiles,
  reportFiles,
  reportMarkers,
  reports,
  studies,
  studyMeasurements,
} from "../../db/schema.js";
import { type Cipher, cipherFor, cipherForProfile, cipherForReport } from "../../lib/user-keys.js";
import { findCreditUsage, lockUserCredits } from "../credits/index.js";
import type { StepUsage } from "../extraction/index.js";
import type { Narrative } from "@mediwise/shared";

const ownedBy = (ownerUserId: string) =>
  inArray(
    reports.profileId,
    db.select({ id: profiles.id }).from(profiles).where(eq(profiles.ownerUserId, ownerUserId)),
  );

/**
 * Matches the jobs of the given reports that have not finished.
 *
 * @remarks
 * Done and failed jobs stay, because their token counts are this month's Claude spend.
 */
const unfinishedJobsOf = (reportIds: string[]) =>
  and(
    inArray(sql`${jobs.payload}->>'reportId'`, reportIds),
    inArray(jobs.status, ["queued", "running", "paused_budget"]),
  );

export const reportColumns = {
  id: reports.id,
  profileId: reports.profileId,
  status: reports.status,
  error: reports.error,
  labName: reports.labName,
  title: reports.title,
  titleEdited: reports.titleEdited,
  collectedAt: reports.collectedAt,
  reportedAt: reports.reportedAt,
  dateAmbiguous: reports.dateAmbiguous,
  score: reports.score,
  tier: reports.tier,
  coverage: reports.coverage,
  verdict: reports.verdict,
  note: reports.note,
  markerCount: sql<number>`(select count(*)::int from ${reportMarkers} where ${reportMarkers}.${sql.identifier("report_id")} = ${reports}.${sql.identifier("id")} and not ${reportMarkers}.${sql.identifier("derived")})`,
  createdAt: reports.createdAt,
};

/** Decrypts the text columns of `reportColumns`, and file names when the row has them. */
export const openReport =
  (cipher: Cipher) =>
  <
    T extends {
      title: string | null;
      note?: string | null;
      error?: string | null;
      fileNames?: string[];
    },
  >(
    row: T,
  ) => ({
    ...row,
    title: cipher.decrypt(row.title),
    ...(row.note !== undefined && { note: cipher.decrypt(row.note) }),
    ...(row.error !== undefined && { error: cipher.decrypt(row.error) }),
    ...(row.fileNames && { fileNames: row.fileNames.map(cipher.decrypt) }),
  });

/**
 * The lab of a marker row: the lab of its file, or the report's lab for a row stored before markers kept their file.
 *
 * @remarks
 * Needs `report_markers` joined to `reports` and left joined to `report_files` on `report_file_id`.
 */
export const markerLabName = sql<
  string | null
>`case when ${reportMarkers.reportFileId} is null then ${reports.labName} else ${reportFiles.labName} end`;

/** Names of the files a report keeps, in upload order, for the visit cards. */
export const reportFileNames = sql<
  string[]
>`coalesce((select array_agg(${reportFiles}.${sql.identifier("name")} order by ${reportFiles}.${sql.identifier("page_index")}) from ${reportFiles} where ${reportFiles}.${sql.identifier("report_id")} = ${reports}.${sql.identifier("id")} and ${reportFiles}.${sql.identifier("name")} is not null and ${reportFiles}.${sql.identifier("skip_reason")} is null), '{}')`;

export async function findReportById(ownerUserId: string, id: string) {
  const [row] = await db
    .select(reportColumns)
    .from(reports)
    .where(and(eq(reports.id, id), ownedBy(ownerUserId)));
  return row && openReport(await cipherFor(ownerUserId))(row);
}

export async function updateReportNote(ownerUserId: string, id: string, note: string | null) {
  const cipher = await cipherFor(ownerUserId);
  const [row] = await db
    .update(reports)
    .set({ note: cipher.encrypt(note) })
    .where(and(eq(reports.id, id), ownedBy(ownerUserId)))
    .returning({ note: reports.note });
  return row && { note: cipher.decrypt(row.note) };
}

/** Sets a report's title and whether the user wrote it. */
export async function updateReportTitle(
  ownerUserId: string,
  id: string,
  title: string,
  titleEdited: boolean,
) {
  const cipher = await cipherFor(ownerUserId);
  const [row] = await db
    .update(reports)
    .set({ title: cipher.encrypt(title), titleEdited })
    .where(and(eq(reports.id, id), ownedBy(ownerUserId)))
    .returning({ title: reports.title, titleEdited: reports.titleEdited });
  return row && { ...row, title: cipher.decrypt(row.title) };
}

/**
 * Loads what the title rule reads: the lab date, the upload date, the marker keys and the studies of a report.
 *
 * @remarks
 * Not scoped by owner: the backfill command calls it for every report. The service checks the owner first.
 */
export async function findTitleFacts(id: string) {
  const [report] = await db
    .select({ collectedAt: reports.collectedAt, createdAt: reports.createdAt })
    .from(reports)
    .where(eq(reports.id, id));
  if (!report) return undefined;
  const [markerRows, studyRows] = await Promise.all([
    db
      .select({ markerKey: reportMarkers.markerKey })
      .from(reportMarkers)
      .where(and(eq(reportMarkers.reportId, id), eq(reportMarkers.derived, false))),
    db
      .select({ kind: studies.kind, performedAt: studies.performedAt })
      .from(studies)
      .where(eq(studies.reportId, id)),
  ]);
  return { ...report, markerKeys: markerRows.map((row) => row.markerKey), studies: studyRows };
}

/** Lists the ids of every done report whose title the user did not write, for the backfill command. */
export async function listRuleTitledReportIds() {
  const rows = await db
    .select({ id: reports.id })
    .from(reports)
    .where(and(eq(reports.status, "done"), eq(reports.titleEdited, false)));
  return rows.map((row) => row.id);
}

/** Stores the rule title of a report, unless the user wrote one in between. */
export async function saveRuleTitle(id: string, title: string) {
  const cipher = await cipherForReport(id);
  if (!cipher) return;
  await db
    .update(reports)
    .set({ title: cipher.encrypt(title) })
    .where(and(eq(reports.id, id), eq(reports.titleEdited, false)));
}

export async function listReportFiles(reportId: string) {
  const query = db
    .select({
      id: reportFiles.id,
      storagePath: reportFiles.storagePath,
      size: reportFiles.size,
      name: reportFiles.name,
      pageClasses: reportFiles.pageClasses,
      skipReason: reportFiles.skipReason,
    })
    .from(reportFiles)
    .where(eq(reportFiles.reportId, reportId))
    .orderBy(reportFiles.pageIndex);
  const [rows, cipher] = await Promise.all([query, cipherForReport(reportId)]);
  return cipher ? rows.map((row) => ({ ...row, name: cipher.decrypt(row.name) })) : [];
}

export async function listReportMarkers(reportId: string) {
  return db
    .select({
      markerKey: reportMarkers.markerKey,
      rawName: reportMarkers.rawName,
      value: reportMarkers.value,
      valueText: reportMarkers.valueText,
      unit: reportMarkers.unit,
      printedValue: reportMarkers.printedValue,
      printedUnit: reportMarkers.printedUnit,
      labRangeLow: reportMarkers.labRangeLow,
      labRangeHigh: reportMarkers.labRangeHigh,
      status: reportMarkers.status,
      calibratedLow: reportMarkers.calibratedLow,
      calibratedHigh: reportMarkers.calibratedHigh,
      derived: reportMarkers.derived,
      labName: markerLabName,
    })
    .from(reportMarkers)
    .innerJoin(reports, eq(reports.id, reportMarkers.reportId))
    .leftJoin(reportFiles, eq(reportFiles.id, reportMarkers.reportFileId))
    .where(eq(reportMarkers.reportId, reportId));
}

/** Lists a report's studies in page order, each with its file name, its film name and its measurements. */
export async function listStudies(reportId: string) {
  const film = alias(reportFiles, "film");
  const rows = await db
    .select({
      id: studies.id,
      kind: studies.kind,
      bodyRegion: studies.bodyRegion,
      findingsText: studies.findingsText,
      impressionText: studies.impressionText,
      familyHistory: studies.familyHistory,
      specimen: studies.specimen,
      adequacy: studies.adequacy,
      result: studies.resultText,
      performedAt: studies.performedAt,
      signedBy: studies.signedBy,
      pageIndex: studies.pageIndex,
      fileName: reportFiles.name,
      labName: reportFiles.labName,
      filmFileId: studies.filmFileId,
      filmName: film.name,
    })
    .from(studies)
    .innerJoin(reportFiles, eq(reportFiles.id, studies.reportFileId))
    .leftJoin(film, eq(film.id, studies.filmFileId))
    .where(eq(studies.reportId, reportId))
    .orderBy(reportFiles.pageIndex, studies.pageIndex);
  if (rows.length === 0) return [];
  const cipher = (await cipherForReport(reportId))!;
  const measurements = await db
    .select({
      studyId: studyMeasurements.studyId,
      key: studyMeasurements.key,
      value: studyMeasurements.value,
      valueText: studyMeasurements.valueText,
      unit: studyMeasurements.unit,
      printedRange: studyMeasurements.printedRange,
      status: studyMeasurements.status,
    })
    .from(studyMeasurements)
    .where(
      inArray(
        studyMeasurements.studyId,
        rows.map((row) => row.id),
      ),
    );
  return rows.map((row) => ({
    ...row,
    fileName: cipher.decrypt(row.fileName),
    filmName: cipher.decrypt(row.filmName),
    measurements: measurements.filter((measurement) => measurement.studyId === row.id),
  }));
}

export async function findReportInsights(reportId: string) {
  const [[row], cipher] = await Promise.all([
    db
      .select({
        patterns: reports.patterns,
        doctorQuestions: reports.doctorQuestions,
        narrative: reports.narrative,
        translations: reports.translations,
      })
      .from(reports)
      .where(eq(reports.id, reportId)),
    cipherForReport(reportId),
  ]);
  return (
    row &&
    cipher && {
      patterns: row.patterns,
      doctorQuestions: cipher.decryptJson<string[]>(row.doctorQuestions),
      narrative: cipher.decryptJson<Narrative>(row.narrative),
      translations: cipher.decryptJson<ReportTranslations>(row.translations),
    }
  );
}

export async function findReportProfile(ownerUserId: string, reportId: string) {
  const [row] = await db
    .select({ id: profiles.id, sex: profiles.sex, ancestry: profiles.ancestry })
    .from(reports)
    .innerJoin(profiles, eq(profiles.id, reports.profileId))
    .where(and(eq(reports.id, reportId), eq(profiles.ownerUserId, ownerUserId)));
  return row;
}

/**
 * Lists one marker's stored values across a profile's done reports, oldest first.
 *
 * @remarks
 * A report without a lab date sorts by its upload date, the same date the page shows for it.
 */
export async function listMarkerHistory(ownerUserId: string, profileId: string, markerKey: string) {
  return db
    .select({
      reportId: reports.id,
      collectedAt: reports.collectedAt,
      createdAt: reports.createdAt,
      value: reportMarkers.value,
      unit: reportMarkers.unit,
      status: reportMarkers.status,
    })
    .from(reportMarkers)
    .innerJoin(reports, eq(reports.id, reportMarkers.reportId))
    .where(
      and(
        ownedBy(ownerUserId),
        eq(reports.profileId, profileId),
        eq(reports.status, "done"),
        eq(reportMarkers.markerKey, markerKey),
        isNotNull(reportMarkers.value),
      ),
    )
    .orderBy(
      sql`coalesce(${reports.collectedAt}, ${reports.createdAt}::date)`,
      asc(reports.createdAt),
    );
}

export async function listFollowUps(reportId: string) {
  return db
    .select({
      kind: followUps.kind,
      markerKey: followUps.markerKey,
      title: followUps.title,
      why: followUps.why,
      nextAction: followUps.nextAction,
      rank: followUps.rank,
    })
    .from(followUps)
    .where(eq(followUps.reportId, reportId))
    .orderBy(followUps.rank);
}

/**
 * Loads a report with its profile and files for the worker.
 *
 * @remarks
 * Not scoped by owner: only the worker calls it, with an id taken from a job row.
 */
export async function findReportForProcessing(id: string) {
  const [report] = await db
    .select({
      id: reports.id,
      profileId: reports.profileId,
      ownerUserId: profiles.ownerUserId,
      createdAt: reports.createdAt,
      dateOfBirth: profiles.dateOfBirth,
      sex: profiles.sex,
      ancestry: profiles.ancestry,
    })
    .from(reports)
    .innerJoin(profiles, eq(profiles.id, reports.profileId))
    .where(eq(reports.id, id));
  if (!report) return undefined;
  const cipher = await cipherFor(report.ownerUserId);
  const files = await db
    .select({
      id: reportFiles.id,
      storagePath: reportFiles.storagePath,
      mime: reportFiles.mime,
      sha256: reportFiles.sha256,
      pageClasses: reportFiles.pageClasses,
      skipReason: reportFiles.skipReason,
    })
    .from(reportFiles)
    .where(eq(reportFiles.reportId, id))
    .orderBy(reportFiles.pageIndex);
  return { ...report, dateOfBirth: cipher.decrypt(report.dateOfBirth), files };
}

/**
 * Lists the hashes of the files a profile keeps in its other reports.
 *
 * @remarks
 * A failed report does not count, so the user can upload the same file again as a new report.
 */
export async function listProfileFileHashes(profileId: string, exceptReportId: string) {
  const rows = await db
    .select({ sha256: reportFiles.sha256 })
    .from(reportFiles)
    .innerJoin(reports, eq(reports.id, reportFiles.reportId))
    .where(
      and(
        eq(reports.profileId, profileId),
        ne(reports.id, exceptReportId),
        notInArray(reports.status, ["draft", "failed"]),
        isNotNull(reportFiles.sha256),
      ),
    );
  return rows.flatMap((row) => (row.sha256 ? [row.sha256] : []));
}

export async function updateReportFile(
  id: string,
  file: Pick<typeof reportFiles.$inferInsert, "sha256" | "pageClasses" | "skipReason">,
) {
  await db.update(reportFiles).set(file).where(eq(reportFiles.id, id));
}

/**
 * Sets a profile's date of birth from a report, only while the profile has none.
 *
 * @remarks
 * The null check sits in the update, so a date the user types while the report is read always wins.
 */
export async function fillDateOfBirth(
  profileId: string,
  dateOfBirth: string,
  approximate: boolean,
) {
  const cipher = await cipherForProfile(profileId);
  if (!cipher) return;
  await db
    .update(profiles)
    .set({ dateOfBirth: cipher.encrypt(dateOfBirth), dateOfBirthApproximate: approximate })
    .where(and(eq(profiles.id, profileId), isNull(profiles.dateOfBirth)));
}

export async function updateReportStatus(
  id: string,
  status: "processing" | "paused" | "failed",
  error: string | null = null,
) {
  const cipher = await cipherForReport(id);
  if (!cipher) return;
  await db
    .update(reports)
    .set({ status, error: cipher.encrypt(error) })
    .where(eq(reports.id, id));
}

type ReportResult = Omit<
  typeof reports.$inferInsert,
  "id" | "profileId" | "sourceKind" | "status" | "doctorQuestions" | "narrative" | "translations"
> & { doctorQuestions?: string[] | null; narrative?: Narrative | null };

/**
 * Replaces a report's markers, alias suggestions, follow-ups, studies and file labs, and marks it done, in one transaction.
 *
 * @remarks
 * Old rows are deleted first, so a retried job never duplicates them. A title the user wrote stays.
 */
export async function saveReportResult(
  id: string,
  report: ReportResult,
  markers: (typeof reportMarkers.$inferInsert)[],
  suggestions: (typeof markerAliasSuggestions.$inferInsert)[],
  steps: (typeof followUps.$inferInsert)[],
  studyRows: {
    study: typeof studies.$inferInsert;
    measurements: Omit<typeof studyMeasurements.$inferInsert, "studyId">[];
  }[] = [],
  findingRows: (typeof findings.$inferInsert)[] = [],
  fileLabs: { id: string; labName: string | null }[] = [],
) {
  const cipher = await cipherForReport(id);
  if (!cipher) return;
  const { title: plainTitle, doctorQuestions, narrative, ...rest } = report;
  const title = cipher.encrypt(plainTitle);
  const sealedFindings = findingRows.map((row) => ({
    ...row,
    title: cipher.encrypt(row.title),
    body: cipher.encrypt(row.body),
  }));
  await db.transaction(async (tx) => {
    for (const file of fileLabs) {
      await tx
        .update(reportFiles)
        .set({ labName: file.labName })
        .where(eq(reportFiles.id, file.id));
    }
    await tx.delete(reportMarkers).where(eq(reportMarkers.reportId, id));
    await tx.delete(followUps).where(eq(followUps.reportId, id));
    await tx.delete(studies).where(eq(studies.reportId, id));
    await tx.delete(findings).where(eq(findings.reportId, id));
    if (markers.length > 0) await tx.insert(reportMarkers).values(markers);
    if (suggestions.length > 0) await tx.insert(markerAliasSuggestions).values(suggestions);
    if (steps.length > 0) await tx.insert(followUps).values(steps);
    if (studyRows.length > 0) await tx.insert(studies).values(studyRows.map((row) => row.study));
    const measurements = studyRows.flatMap(({ study, measurements: rows }) =>
      rows.map((row) => ({ ...row, studyId: study.id ?? "" })),
    );
    if (measurements.length > 0) await tx.insert(studyMeasurements).values(measurements);
    if (sealedFindings.length > 0) await tx.insert(findings).values(sealedFindings);
    await tx
      .update(reports)
      .set({
        ...rest,
        note: cipher.encrypt(rest.note),
        error: null,
        doctorQuestions: cipher.encryptJson(doctorQuestions),
        narrative: cipher.encryptJson(narrative),
        ...(title !== undefined && {
          title: sql`case when ${reports.titleEdited} then ${reports.title} else ${title} end`,
        }),
        status: "done",
        translations: null,
      })
      .where(eq(reports.id, id));
  });
}

/**
 * Moves a failed report back to `queued` with a fresh `process_report` job.
 *
 * @remarks
 * The status check sits in the update, so two parallel retries add one job.
 */
export async function requeueFailedReport(ownerUserId: string, id: string) {
  await db.transaction(async (tx) => {
    const updated = await tx
      .update(reports)
      .set({ status: "queued", error: null })
      .where(and(eq(reports.id, id), eq(reports.status, "failed"), ownedBy(ownerUserId)))
      .returning({ id: reports.id });
    if (updated.length === 0) return;
    await tx.delete(jobs).where(unfinishedJobsOf([id]));
    await tx.insert(jobs).values({
      kind: "process_report",
      userId: ownerUserId,
      payload: { reportId: id, userId: ownerUserId },
    });
  });
}

/**
 * Lists one profile's reports, newest first, with drafts left out.
 *
 * @remarks
 * The cursor is `created_at` as microsecond ISO text, because a JS `Date` drops the microseconds and would skip rows.
 */
export async function listReportsByProfile(
  ownerUserId: string,
  profileId: string,
  limit: number,
  cursor?: string,
) {
  const query = db
    .select({
      ...reportColumns,
      fileNames: reportFileNames,
      cursor: sql<string>`to_char(${reports.createdAt} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`,
    })
    .from(reports)
    .where(
      and(
        ownedBy(ownerUserId),
        eq(reports.profileId, profileId),
        ne(reports.status, "draft"),
        cursor ? sql`${reports.createdAt} < ${cursor}::timestamptz` : undefined,
      ),
    )
    .orderBy(desc(reports.createdAt))
    .limit(limit);
  const [rows, cipher] = await Promise.all([query, cipherFor(ownerUserId)]);
  return rows.map(openReport(cipher));
}

/**
 * Inserts a draft report with its files after `check` accepts the owner's credit usage.
 *
 * @remarks
 * The owner's credits stay locked until the insert commits, so parallel uploads see each other's drafts.
 */
export async function insertDraftReport(
  ownerUserId: string,
  report: { id: string; profileId: string; sourceKind: "pdf" | "photos" },
  files: { storagePath: string; mime: string; size: number; pageIndex: number; name: string }[],
  check: (usage: Awaited<ReturnType<typeof findCreditUsage>>) => void,
) {
  const cipher = await cipherFor(ownerUserId);
  await db.transaction(async (tx) => {
    await lockUserCredits(tx, ownerUserId);
    check(await findCreditUsage(ownerUserId, tx));
    await tx.insert(reports).values({ ...report, status: "draft" });
    await tx
      .insert(reportFiles)
      .values(
        files.map((file) => ({ ...file, name: cipher.encrypt(file.name), reportId: report.id })),
      );
  });
}

/**
 * Moves a draft to `queued` and adds its `process_report` job.
 *
 * @remarks
 * The status check sits in the update, so two parallel calls add one job.
 */
export async function queueDraftReport(ownerUserId: string, id: string) {
  await db.transaction(async (tx) => {
    const updated = await tx
      .update(reports)
      .set({ status: "queued" })
      .where(and(eq(reports.id, id), eq(reports.status, "draft"), ownedBy(ownerUserId)))
      .returning({ id: reports.id });
    if (updated.length === 0) return;
    await tx.insert(jobs).values({
      kind: "process_report",
      userId: ownerUserId,
      payload: { reportId: id, userId: ownerUserId },
    });
  });
}

/**
 * Deletes the owner's reports that match `where`, with their jobs, and returns the storage paths to remove.
 *
 * @remarks
 * Paths are kept only for rows the delete actually removed, so a report that changed status in between keeps its files.
 */
async function deleteOwnedReports(ownerUserId: string, where: SQL | undefined) {
  return db.transaction(async (tx) => {
    const match = and(where, ownedBy(ownerUserId));
    const files = await tx
      .select({ reportId: reportFiles.reportId, storagePath: reportFiles.storagePath })
      .from(reportFiles)
      .innerJoin(reports, eq(reports.id, reportFiles.reportId))
      .where(match);
    const deleted = await tx.delete(reports).where(match).returning({ id: reports.id });
    const ids = deleted.map((row) => row.id);
    if (ids.length > 0) await tx.delete(jobs).where(unfinishedJobsOf(ids));
    return {
      deletedCount: ids.length,
      paths: files.filter((file) => ids.includes(file.reportId)).map((file) => file.storagePath),
    };
  });
}

export async function deleteReport(ownerUserId: string, id: string) {
  return deleteOwnedReports(ownerUserId, and(eq(reports.id, id), ne(reports.status, "processing")));
}

export async function deleteDraftsCreatedBefore(ownerUserId: string, before: Date) {
  return deleteOwnedReports(
    ownerUserId,
    and(eq(reports.status, "draft"), lt(reports.createdAt, before)),
  );
}

/**
 * Stores a report's translations and adds the translate step's tokens to its latest read job.
 *
 * @remarks
 * The read job carries every Claude cost of a report, so the report cost and the monthly cap see this step too.
 */
export async function saveTranslation(
  reportId: string,
  translations: ReportTranslations,
  usage: StepUsage,
) {
  const cipher = await cipherForReport(reportId);
  if (!cipher) return;
  await db.transaction(async (tx) => {
    await tx
      .update(reports)
      .set({ translations: cipher.encryptJson(translations) })
      .where(eq(reports.id, reportId));
    const [job] = await tx
      .select({ id: jobs.id, usage: jobs.usage })
      .from(jobs)
      .where(sql`${jobs.payload}->>'reportId' = ${reportId}`)
      .orderBy(desc(jobs.updatedAt))
      .limit(1);
    if (job?.usage) {
      await tx
        .update(jobs)
        .set({ usage: { ...job.usage, translate: usage } })
        .where(eq(jobs.id, job.id));
    }
  });
}

/** Loads the token counts of a report's latest read job, or undefined when it has none. */
export async function findReadJobTokens(reportId: string) {
  const [job] = await db
    .select({ usage: jobs.usage, inputTokens: jobs.inputTokens, outputTokens: jobs.outputTokens })
    .from(jobs)
    .where(sql`${jobs.payload}->>'reportId' = ${reportId}`)
    .orderBy(desc(jobs.updatedAt))
    .limit(1);
  return job;
}
