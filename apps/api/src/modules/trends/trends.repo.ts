import { and, asc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import {
  episodes,
  profiles,
  reportFiles,
  reportMarkers,
  reports,
  studies,
  studyMeasurements,
} from "../../db/schema.js";
import { cipherFor } from "../../db/user-keys.js";
import { markerLabName, reportFileNames } from "../reports/index.js";

const reportDate = sql`coalesce(${reports.collectedAt}, ${reports.createdAt}::date)`;

/** Every lab named in a report: the lab of each file, and the report's lab for a report read before files kept one. */
const reportLabNames = sql<
  string[]
>`array(select ${reports.labName} where ${reports.labName} is not null union select ${reportFiles.labName} from ${reportFiles} where ${reportFiles.reportId} = ${reports.id} and ${reportFiles.labName} is not null)`;

const doneReportsOf = (ownerUserId: string, profileId: string) =>
  and(
    eq(profiles.ownerUserId, ownerUserId),
    eq(reports.profileId, profileId),
    eq(reports.status, "done"),
  );

/**
 * Lists a profile's done reports, oldest first.
 *
 * @remarks
 * A report without a lab date sorts by its upload date, the same order as the marker page history.
 */
export async function listDoneReports(ownerUserId: string, profileId: string) {
  const query = db
    .select({
      id: reports.id,
      labName: reports.labName,
      title: reports.title,
      collectedAt: reports.collectedAt,
      createdAt: reports.createdAt,
      score: reports.score,
      tier: reports.tier,
      coverage: reports.coverage,
      episodeName: episodes.name,
      fileName: sql<string | null>`(${reportFileNames})[1]`,
      labNames: reportLabNames,
    })
    .from(reports)
    .innerJoin(profiles, eq(profiles.id, reports.profileId))
    .leftJoin(episodes, eq(episodes.id, reports.episodeId))
    .where(doneReportsOf(ownerUserId, profileId))
    .orderBy(reportDate, asc(reports.createdAt));
  const [rows, cipher] = await Promise.all([query, cipherFor(ownerUserId)]);
  return rows.map((row) => ({
    ...row,
    title: cipher.decrypt(row.title),
    episodeName: cipher.decrypt(row.episodeName),
    fileName: cipher.decrypt(row.fileName),
  }));
}

/**
 * Lists the stored marker rows of a profile's done reports, with study measurements in the same shape.
 *
 * @remarks
 * A study measurement has no calibrated band or numeric lab range stored, so its trend shows the status of each point without a band.
 */
export async function listMarkerRows(ownerUserId: string, profileId: string, markerKey?: string) {
  const [markers, measurements] = await Promise.all([
    db
      .select({
        reportId: reportMarkers.reportId,
        markerKey: reportMarkers.markerKey,
        value: reportMarkers.value,
        valueText: reportMarkers.valueText,
        unit: reportMarkers.unit,
        status: reportMarkers.status,
        labRangeLow: reportMarkers.labRangeLow,
        labRangeHigh: reportMarkers.labRangeHigh,
        calibratedLow: reportMarkers.calibratedLow,
        calibratedHigh: reportMarkers.calibratedHigh,
        labName: markerLabName,
      })
      .from(reportMarkers)
      .innerJoin(reports, eq(reports.id, reportMarkers.reportId))
      .leftJoin(reportFiles, eq(reportFiles.id, reportMarkers.reportFileId))
      .innerJoin(profiles, eq(profiles.id, reports.profileId))
      .where(
        and(
          doneReportsOf(ownerUserId, profileId),
          markerKey ? eq(reportMarkers.markerKey, markerKey) : isNotNull(reportMarkers.markerKey),
        ),
      ),
    db
      .select({
        reportId: studies.reportId,
        markerKey: studyMeasurements.key,
        value: studyMeasurements.value,
        valueText: studyMeasurements.valueText,
        unit: studyMeasurements.unit,
        status: studyMeasurements.status,
        labRangeLow: sql<number | null>`null`,
        labRangeHigh: sql<number | null>`null`,
        calibratedLow: sql<number | null>`null`,
        calibratedHigh: sql<number | null>`null`,
        labName: reportFiles.labName,
      })
      .from(studyMeasurements)
      .innerJoin(studies, eq(studies.id, studyMeasurements.studyId))
      .innerJoin(reportFiles, eq(reportFiles.id, studies.reportFileId))
      .innerJoin(reports, eq(reports.id, studies.reportId))
      .innerJoin(profiles, eq(profiles.id, reports.profileId))
      .where(
        and(
          doneReportsOf(ownerUserId, profileId),
          markerKey ? eq(studyMeasurements.key, markerKey) : undefined,
        ),
      ),
  ]);
  return [...markers, ...measurements];
}

export async function findReportProfileId(ownerUserId: string, id: string) {
  const [row] = await db
    .select({ profileId: reports.profileId })
    .from(reports)
    .innerJoin(profiles, eq(profiles.id, reports.profileId))
    .where(and(eq(reports.id, id), eq(profiles.ownerUserId, ownerUserId)));
  return row?.profileId;
}
