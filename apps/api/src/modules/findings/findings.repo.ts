import type { Visit } from "@mediwise/engine";
import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import {
  findings,
  reportFiles,
  reportMarkers,
  reports,
  studies,
  studyMeasurements,
} from "../../db/schema.js";

const earlierVisitLimit = 12;
const visitDate = sql<string>`coalesce(${reports.collectedAt}, ${reports.createdAt}::date)::text`;

/** Loads a stored report as a visit, with its profile and the patterns the engine matched. */
export async function findVisit(reportId: string) {
  const [report] = await db
    .select({
      profileId: reports.profileId,
      date: visitDate,
      labName: reports.labName,
      patterns: reports.patterns,
    })
    .from(reports)
    .where(eq(reports.id, reportId));
  if (!report) return undefined;
  const [markerRows, studyRows] = await Promise.all([
    db
      .select({
        markerKey: reportMarkers.markerKey,
        value: reportMarkers.value,
        valueText: reportMarkers.valueText,
        unit: reportMarkers.unit,
        status: reportMarkers.status,
        calibratedLow: reportMarkers.calibratedLow,
        calibratedHigh: reportMarkers.calibratedHigh,
      })
      .from(reportMarkers)
      .where(eq(reportMarkers.reportId, reportId)),
    db
      .select({
        id: studies.id,
        kind: studies.kind,
        bodyRegion: studies.bodyRegion,
        performedAt: studies.performedAt,
        labName: reportFiles.labName,
        impression: studies.impressionText,
        result: studies.resultText,
      })
      .from(studies)
      .innerJoin(reportFiles, eq(reportFiles.id, studies.reportFileId))
      .where(eq(studies.reportId, reportId))
      .orderBy(asc(studies.pageIndex)),
  ]);
  const measurements =
    studyRows.length === 0
      ? []
      : await db
          .select({
            studyId: studyMeasurements.studyId,
            key: studyMeasurements.key,
            value: studyMeasurements.value,
            unit: studyMeasurements.unit,
            status: studyMeasurements.status,
          })
          .from(studyMeasurements)
          .where(
            inArray(
              studyMeasurements.studyId,
              studyRows.map(({ id }) => id),
            ),
          );
  const visit: Visit = {
    date: report.date,
    labName: report.labName,
    markers: markerRows.flatMap(({ markerKey, ...row }) =>
      markerKey ? [{ markerKey, ...row }] : [],
    ),
    studies: studyRows.map((study) => ({
      ...study,
      measurements: measurements
        .filter(({ studyId }) => studyId === study.id)
        .map(({ key, value, unit, status }) => ({ key, value, unit, status })),
    })),
  };
  return { profileId: report.profileId, patterns: report.patterns ?? [], visit };
}

/**
 * Loads the profile's done visits before a date, newest first, for the change findings.
 *
 * @remarks
 * Reports of one date are one visit, so a report of the same date is never an earlier visit. The newest upload of a date
 * comes first. The limit keeps a weekly history to a bounded number of reads.
 */
export async function findEarlierVisits(profileId: string, reportId: string, date: string) {
  const rows = await db
    .select({ id: reports.id })
    .from(reports)
    .where(
      and(
        eq(reports.profileId, profileId),
        eq(reports.status, "done"),
        ne(reports.id, reportId),
        sql`${visitDate} < ${date}`,
      ),
    )
    .orderBy(desc(visitDate), desc(reports.createdAt))
    .limit(earlierVisitLimit);
  const visits = await Promise.all(rows.map(({ id }) => findVisit(id)));
  return visits.flatMap((found) => (found ? [found.visit] : []));
}

export async function listFindings(reportId: string) {
  return db
    .select({
      kind: findings.kind,
      severity: findings.severity,
      title: findings.title,
      body: findings.body,
      citedKeys: findings.citedKeys,
      citedStudyIds: findings.citedStudyIds,
    })
    .from(findings)
    .where(eq(findings.reportId, reportId))
    .orderBy(asc(findings.rank));
}
