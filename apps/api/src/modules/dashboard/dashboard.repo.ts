import { and, asc, count, desc, eq, inArray, isNotNull, ne, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { findings, profiles, reportMarkers, reports } from "../../db/schema.js";
import { cipherFor } from "../../db/user-keys.js";
import { openReport, reportFileNames } from "../reports/index.js";

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
  const query = db
    .select({
      id: reports.id,
      status: reports.status,
      error: reports.error,
      labName: reports.labName,
      title: reports.title,
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
  const [rows, cipher] = await Promise.all([query, cipherFor(ownerUserId)]);
  return rows.map(openReport(cipher));
}

const mappedCount = sql<number>`(select count(*)::int from ${reportMarkers} where ${reportMarkers}.${sql.identifier("report_id")} = ${reports}.${sql.identifier("id")} and ${reportMarkers}.${sql.identifier("marker_key")} is not null and not ${reportMarkers}.${sql.identifier("derived")})`;

export async function listLatestDoneReports(ownerUserId: string, profileId: string, limit: number) {
  const query = db
    .select({
      id: reports.id,
      labName: reports.labName,
      title: reports.title,
      collectedAt: reports.collectedAt,
      date: reportDate,
      score: reports.score,
      tier: reports.tier,
      coverage: reports.coverage,
      mappedCount,
    })
    .from(reports)
    .innerJoin(profiles, eq(profiles.id, reports.profileId))
    .where(and(ofProfile(ownerUserId, profileId), eq(reports.status, "done")))
    .orderBy(...newestFirst)
    .limit(limit);
  const [rows, cipher] = await Promise.all([query, cipherFor(ownerUserId)]);
  return rows.map(openReport(cipher));
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

/**
 * Lists the newest assessed row of each marker across a profile's done reports that have a collection date.
 *
 * @remarks
 * Reports come at any cadence, so a narrow latest report must not hide the last value of a marker measured before it.
 * Within one date the newest upload wins, then the worst status.
 */
export async function listLatestAssessedByMarker(ownerUserId: string, profileId: string) {
  return db
    .selectDistinctOn([reportMarkers.markerKey], {
      markerKey: reportMarkers.markerKey,
      rawName: reportMarkers.rawName,
      status: reportMarkers.status,
      collectedAt: reports.collectedAt,
    })
    .from(reportMarkers)
    .innerJoin(reports, eq(reports.id, reportMarkers.reportId))
    .innerJoin(profiles, eq(profiles.id, reports.profileId))
    .where(
      and(
        ofProfile(ownerUserId, profileId),
        eq(reports.status, "done"),
        isNotNull(reports.collectedAt),
        isNotNull(reportMarkers.markerKey),
        isNotNull(reportMarkers.status),
      ),
    )
    .orderBy(
      reportMarkers.markerKey,
      desc(reports.collectedAt),
      desc(reports.createdAt),
      desc(reportMarkers.status),
    );
}

const doneOfProfile = (ownerUserId: string, profileId: string) =>
  and(ofProfile(ownerUserId, profileId), eq(reports.status, "done"));

/**
 * Lists every scored value of a profile's done reports, oldest report first.
 *
 * @remarks
 * Within one report the worst status comes last, because the attention list keeps the last row of each date.
 */
export async function listMarkerHistory(ownerUserId: string, profileId: string) {
  const rows = await db
    .select({
      reportId: reports.id,
      date: reportDate,
      markerKey: reportMarkers.markerKey,
      value: reportMarkers.value,
      valueText: reportMarkers.valueText,
      unit: reportMarkers.unit,
      status: reportMarkers.status,
      calibratedLow: reportMarkers.calibratedLow,
      calibratedHigh: reportMarkers.calibratedHigh,
    })
    .from(reportMarkers)
    .innerJoin(reports, eq(reports.id, reportMarkers.reportId))
    .innerJoin(profiles, eq(profiles.id, reports.profileId))
    .where(
      and(
        doneOfProfile(ownerUserId, profileId),
        isNotNull(reportMarkers.markerKey),
        isNotNull(reportMarkers.status),
        isNotNull(reportMarkers.value),
      ),
    )
    .orderBy(asc(reportDate), asc(reports.createdAt), asc(reportMarkers.status));
  return rows.flatMap(({ markerKey, ...row }) => (markerKey ? [{ markerKey, ...row }] : []));
}

/** Lists the study alert findings of a profile's done reports, oldest report first. */
export async function listAlertFindings(ownerUserId: string, profileId: string) {
  const query = db
    .select({
      reportId: reports.id,
      date: reportDate,
      kind: findings.kind,
      title: findings.title,
      citedKeys: findings.citedKeys,
      citedStudyIds: findings.citedStudyIds,
    })
    .from(findings)
    .innerJoin(reports, eq(reports.id, findings.reportId))
    .innerJoin(profiles, eq(profiles.id, reports.profileId))
    .where(and(doneOfProfile(ownerUserId, profileId), eq(findings.kind, "study_alert")))
    .orderBy(asc(reportDate), asc(reports.createdAt));
  const [rows, cipher] = await Promise.all([query, cipherFor(ownerUserId)]);
  return rows.map((row) => ({ ...row, title: cipher.decrypt(row.title) }));
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
  const query = db
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
  const [rows, cipher] = await Promise.all([query, cipherFor(ownerUserId)]);
  return rows.map((row) => ({ ...row, name: cipher.decrypt(row.name) }));
}

export async function countRiskMarkers(reportIds: string[]) {
  if (reportIds.length === 0) return [];
  return db
    .select({ reportId: reportMarkers.reportId, total: count() })
    .from(reportMarkers)
    .where(and(inArray(reportMarkers.reportId, reportIds), eq(reportMarkers.status, "risk")))
    .groupBy(reportMarkers.reportId);
}
