import { and, asc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import {
  episodes,
  profiles,
  reportMarkers,
  reports,
  studies,
  studyMeasurements,
} from "../../db/schema.js";

const reportDate = sql`coalesce(${reports.collectedAt}, ${reports.createdAt}::date)`;

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
  return db
    .select({
      id: reports.id,
      labName: reports.labName,
      collectedAt: reports.collectedAt,
      createdAt: reports.createdAt,
      score: reports.score,
      tier: reports.tier,
      coverage: reports.coverage,
      episodeName: episodes.name,
    })
    .from(reports)
    .innerJoin(profiles, eq(profiles.id, reports.profileId))
    .leftJoin(episodes, eq(episodes.id, reports.episodeId))
    .where(doneReportsOf(ownerUserId, profileId))
    .orderBy(reportDate, asc(reports.createdAt));
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
      })
      .from(reportMarkers)
      .innerJoin(reports, eq(reports.id, reportMarkers.reportId))
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
      })
      .from(studyMeasurements)
      .innerJoin(studies, eq(studies.id, studyMeasurements.studyId))
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
