import { and, asc, count, desc, eq, inArray, isNotNull, ne, sql } from "drizzle-orm";
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

/**
 * Lists every profile of the owner with each of its done reports, one row per pair.
 *
 * @remarks
 * One join reads both tables once for the whole family. A profile with no done report comes back once, with a null report.
 */
export async function listFamilyDoneReports(ownerUserId: string) {
  return db
    .select({
      profileId: profiles.id,
      name: profiles.name,
      relation: profiles.relation,
      reportId: reports.id,
      date: sql<
        string | null
      >`coalesce(${reports.collectedAt}, ${reports.reportedAt}, (${reports.createdAt} at time zone 'UTC')::date)::text`,
      uploadedAt: reports.createdAt,
      score: reports.score,
      tier: reports.tier,
    })
    .from(profiles)
    .leftJoin(reports, and(eq(reports.profileId, profiles.id), eq(reports.status, "done")))
    .where(eq(profiles.ownerUserId, ownerUserId))
    .orderBy(desc(profiles.isSelf), asc(profiles.createdAt));
}

export async function countRiskMarkers(reportIds: string[]) {
  if (reportIds.length === 0) return [];
  return db
    .select({ reportId: reportMarkers.reportId, total: count() })
    .from(reportMarkers)
    .where(and(inArray(reportMarkers.reportId, reportIds), eq(reportMarkers.status, "risk")))
    .groupBy(reportMarkers.reportId);
}
