import { and, desc, eq, inArray, isNotNull, ne, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { profiles, reportMarkers, reports } from "../../db/schema.js";
import { reportFileNames } from "../reports/index.js";

const reportDate = sql<string>`coalesce(${reports.collectedAt}, (${reports.createdAt} at time zone 'UTC')::date)::text`;
const newestFirst = [desc(reportDate), desc(reports.createdAt)];

const ofProfile = (ownerUserId: string, profileId: string) =>
  and(eq(reports.profileId, profileId), eq(profiles.ownerUserId, ownerUserId));

/**
 * Lists a profile's reports by collection date, newest first, with drafts left out.
 *
 * @remarks
 * A report not read yet has no collection date, so it sorts by its upload day and lands on top.
 */
export async function listRecentReports(ownerUserId: string, profileId: string, limit: number) {
  return db
    .select({
      id: reports.id,
      status: reports.status,
      error: reports.error,
      labName: reports.labName,
      collectedAt: reports.collectedAt,
      date: reportDate,
      score: reports.score,
      tier: reports.tier,
      fileNames: reportFileNames,
    })
    .from(reports)
    .innerJoin(profiles, eq(profiles.id, reports.profileId))
    .where(and(ofProfile(ownerUserId, profileId), ne(reports.status, "draft")))
    .orderBy(...newestFirst)
    .limit(limit);
}

export async function listLatestDoneReports(ownerUserId: string, profileId: string, limit: number) {
  return db
    .select({
      id: reports.id,
      labName: reports.labName,
      date: reportDate,
      score: reports.score,
      tier: reports.tier,
      coverage: reports.coverage,
    })
    .from(reports)
    .innerJoin(profiles, eq(profiles.id, reports.profileId))
    .where(and(ofProfile(ownerUserId, profileId), eq(reports.status, "done")))
    .orderBy(...newestFirst)
    .limit(limit);
}

export async function countReportsInProgress(ownerUserId: string, profileId: string) {
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(reports)
    .innerJoin(profiles, eq(profiles.id, reports.profileId))
    .where(
      and(
        ofProfile(ownerUserId, profileId),
        inArray(reports.status, ["queued", "processing", "paused"]),
      ),
    );
  return row?.total ?? 0;
}

export async function listAssessedMarkers(reportId: string) {
  return db
    .select({
      markerKey: reportMarkers.markerKey,
      rawName: reportMarkers.rawName,
      value: reportMarkers.value,
      unit: reportMarkers.unit,
      status: reportMarkers.status,
      calibratedLow: reportMarkers.calibratedLow,
      calibratedHigh: reportMarkers.calibratedHigh,
    })
    .from(reportMarkers)
    .where(and(eq(reportMarkers.reportId, reportId), isNotNull(reportMarkers.status)));
}
