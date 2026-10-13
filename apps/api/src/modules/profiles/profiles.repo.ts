import { and, asc, count, desc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import {
  profiles,
  reportFiles,
  reportMarkers,
  reports,
  studies,
  studyMeasurements,
} from "../../db/schema.js";

const profileColumns = {
  id: profiles.id,
  name: profiles.name,
  relation: profiles.relation,
  dateOfBirth: profiles.dateOfBirth,
  dateOfBirthApproximate: profiles.dateOfBirthApproximate,
  sex: profiles.sex,
  ancestry: profiles.ancestry,
  isSelf: profiles.isSelf,
  permissionConfirmedAt: profiles.permissionConfirmedAt,
  guardianConfirmedAt: profiles.guardianConfirmedAt,
};

/**
 * Counts the rows of a profile's CSV export: one per note, marker, study and study measurement of its done reports.
 *
 * @remarks
 * Plain table names keep the inner `reports` apart from the outer join, and must stay in step with `listExportRows`.
 */
const valueCount = sql<number>`(
  (select count(*) from reports r
    where r.profile_id = ${profiles.id} and r.status = 'done' and r.note is not null)
  + (select count(*) from report_markers m join reports r on r.id = m.report_id
    where r.profile_id = ${profiles.id} and r.status = 'done')
  + (select count(*) from studies s join reports r on r.id = s.report_id
    where r.profile_id = ${profiles.id} and r.status = 'done')
  + (select count(*) from study_measurements sm join studies s on s.id = sm.study_id
    join reports r on r.id = s.report_id where r.profile_id = ${profiles.id} and r.status = 'done')
)`.mapWith(Number);

type ProfileRow = typeof profiles.$inferInsert;
export type ProfileValues = Omit<ProfileRow, "id" | "ownerUserId" | "isSelf" | "createdAt">;

export async function listProfilesByOwner(ownerUserId: string) {
  return db
    .select({ ...profileColumns, reportCount: count(reports.id), valueCount })
    .from(profiles)
    .leftJoin(reports, eq(reports.profileId, profiles.id))
    .where(eq(profiles.ownerUserId, ownerUserId))
    .groupBy(profiles.id)
    .orderBy(desc(profiles.isSelf), asc(profiles.createdAt));
}

export async function findProfileById(ownerUserId: string, id: string) {
  const [row] = await db
    .select(profileColumns)
    .from(profiles)
    .where(and(eq(profiles.id, id), eq(profiles.ownerUserId, ownerUserId)));
  return row;
}

export async function countProfilesByOwner(ownerUserId: string) {
  const [row] = await db
    .select({ total: count() })
    .from(profiles)
    .where(eq(profiles.ownerUserId, ownerUserId));
  return row?.total ?? 0;
}

export async function insertProfile(ownerUserId: string, input: ProfileValues) {
  const [row] = await db
    .insert(profiles)
    .values({ ...input, ownerUserId })
    .returning(profileColumns);
  return row;
}

/**
 * Inserts the self profile unless the owner already has one.
 *
 * @remarks
 * The partial unique index on `is_self` makes concurrent first calls safe; the loser inserts nothing.
 */
export async function insertSelfProfileIfMissing(ownerUserId: string, name: string) {
  await db
    .insert(profiles)
    .values({ ownerUserId, name, relation: "self", ancestry: "unknown", isSelf: true })
    .onConflictDoNothing();
}

export async function updateProfile(
  ownerUserId: string,
  id: string,
  input: Partial<ProfileValues>,
) {
  const [row] = await db
    .update(profiles)
    .set(input)
    .where(and(eq(profiles.id, id), eq(profiles.ownerUserId, ownerUserId)))
    .returning(profileColumns);
  return row;
}

export async function deleteProfile(ownerUserId: string, id: string) {
  await db.delete(profiles).where(and(eq(profiles.id, id), eq(profiles.ownerUserId, ownerUserId)));
}

const reportDate = sql<string>`coalesce(${reports.collectedAt}, ${reports.createdAt}::date)::text`;
const exportReportColumns = {
  reportId: reports.id,
  reportDate,
  collectedAt: reports.collectedAt,
  title: reports.title,
};
const doneReportsOf = (ownerUserId: string, profileId: string) =>
  and(
    eq(profiles.ownerUserId, ownerUserId),
    eq(reports.profileId, profileId),
    eq(reports.status, "done"),
  );

/** Loads every note, marker, study and study measurement of a profile's done reports, for the CSV export. */
export async function listExportRows(ownerUserId: string, profileId: string) {
  const [noteRows, markerRows, studyRows, measurementRows] = await Promise.all([
    db
      .select({ ...exportReportColumns, labName: reports.labName, note: reports.note })
      .from(reports)
      .innerJoin(profiles, eq(profiles.id, reports.profileId))
      .where(and(doneReportsOf(ownerUserId, profileId), isNotNull(reports.note)))
      .orderBy(reportDate, asc(reports.createdAt)),
    db
      .select({
        ...exportReportColumns,
        markerKey: reportMarkers.markerKey,
        rawName: reportMarkers.rawName,
        value: reportMarkers.value,
        valueText: reportMarkers.valueText,
        unit: reportMarkers.unit,
        status: reportMarkers.status,
        labRangeLow: reportMarkers.labRangeLow,
        labRangeHigh: reportMarkers.labRangeHigh,
        calibratedLow: reportMarkers.calibratedLow,
        calibratedHigh: reportMarkers.calibratedHigh,
        labName: sql<
          string | null
        >`case when ${reportMarkers.reportFileId} is null then ${reports.labName} else ${reportFiles.labName} end`,
      })
      .from(reportMarkers)
      .innerJoin(reports, eq(reports.id, reportMarkers.reportId))
      .leftJoin(reportFiles, eq(reportFiles.id, reportMarkers.reportFileId))
      .innerJoin(profiles, eq(profiles.id, reports.profileId))
      .where(doneReportsOf(ownerUserId, profileId))
      .orderBy(reportDate, asc(reports.createdAt), asc(reportMarkers.rawName)),
    db
      .select({
        ...exportReportColumns,
        kind: studies.kind,
        bodyRegion: studies.bodyRegion,
        impressionText: studies.impressionText,
        resultText: studies.resultText,
        findingsText: studies.findingsText,
        labName: reportFiles.labName,
      })
      .from(studies)
      .innerJoin(reports, eq(reports.id, studies.reportId))
      .innerJoin(reportFiles, eq(reportFiles.id, studies.reportFileId))
      .innerJoin(profiles, eq(profiles.id, reports.profileId))
      .where(doneReportsOf(ownerUserId, profileId))
      .orderBy(reportDate, asc(reports.createdAt), asc(studies.pageIndex)),
    db
      .select({
        ...exportReportColumns,
        key: studyMeasurements.key,
        value: studyMeasurements.value,
        valueText: studyMeasurements.valueText,
        unit: studyMeasurements.unit,
        status: studyMeasurements.status,
        printedRange: studyMeasurements.printedRange,
        labName: reportFiles.labName,
      })
      .from(studyMeasurements)
      .innerJoin(studies, eq(studies.id, studyMeasurements.studyId))
      .innerJoin(reportFiles, eq(reportFiles.id, studies.reportFileId))
      .innerJoin(reports, eq(reports.id, studies.reportId))
      .innerJoin(profiles, eq(profiles.id, reports.profileId))
      .where(doneReportsOf(ownerUserId, profileId))
      .orderBy(reportDate, asc(reports.createdAt), asc(studies.pageIndex)),
  ]);
  return { noteRows, markerRows, studyRows, measurementRows };
}
