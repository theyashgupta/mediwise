import { derived, deviation, markers, retestDueDate } from "@mediwise/engine";
import { getOwnedProfile } from "../profiles/index.js";
import * as repo from "./dashboard.repo.js";

const recentLimit = 5;
const moveFirstLimit = 3;
const latestLimit = 10;
const catalogByKey = new Map([...markers, ...derived].map((entry) => [entry.key, entry]));

type AssessedMarker = Awaited<ReturnType<typeof repo.listAssessedMarkers>>[number];

function distance({ value, calibratedLow, calibratedHigh }: AssessedMarker) {
  return value === null
    ? 0
    : Math.abs(deviation(value, { optimalLow: calibratedLow, optimalHigh: calibratedHigh }));
}

/**
 * Picks the markers to move first from a report's stored rows.
 *
 * @remarks
 * Same order as the engine's move-first list: risk before watch, then furthest from optimal first.
 */
function rankMoveFirst(rows: AssessedMarker[], limit: number) {
  const flagged = (status: "risk" | "watch") =>
    rows.filter((row) => row.status === status).sort((a, b) => distance(b) - distance(a));
  return [...flagged("risk"), ...flagged("watch")].slice(0, limit);
}

/**
 * Lists the suggested retest date of each marker on a report, soonest first.
 *
 * @remarks
 * Returns dates only. The web marks a date as past, because "today" is the reader's day.
 */
function listRetests(rows: AssessedMarker[], collectedAt: string | null) {
  if (!collectedAt) return [];
  const byKey = new Map<string, { markerKey: string; name: string; dueOn: string }>();
  for (const { markerKey, status, rawName } of rows) {
    const dueOn = markerKey && status ? retestDueDate(markerKey, status, collectedAt) : undefined;
    if (!markerKey || !dueOn) continue;
    const seen = byKey.get(markerKey);
    if (!seen || dueOn < seen.dueOn) {
      byKey.set(markerKey, {
        markerKey,
        name: catalogByKey.get(markerKey)?.name ?? rawName,
        dueOn,
      });
    }
  }
  return [...byKey.values()].sort((a, b) => a.dueOn.localeCompare(b.dueOn));
}

/**
 * Builds the dashboard for one profile: latest done report, what to move first, and recent reports.
 *
 * @remarks
 * The score change compares with the previous visit, so a second report from the same collection date is skipped.
 */
export async function getDashboard(userId: string, profileId: string) {
  await getOwnedProfile(userId, profileId);
  const [recent, [latest, ...older], processingCount] = await Promise.all([
    repo.listRecentReports(userId, profileId, recentLimit),
    repo.listLatestDoneReports(userId, profileId, latestLimit),
    repo.countReportsInProgress(userId, profileId),
  ]);
  const previous = older.find((report) => report.date !== latest?.date);
  if (!latest) return { latest: null, moveFirst: [], retests: [], recent, processingCount };

  const rows = await repo.listAssessedMarkers(latest.id);
  const counts = { optimal: 0, watch: 0, risk: 0 };
  rows.forEach((row) => row.status && counts[row.status]++);
  const deltaSincePrevious =
    previous && previous.score !== null && latest.score !== null
      ? { score: latest.score - previous.score, since: previous.date }
      : null;
  const moveFirst = rankMoveFirst(rows, moveFirstLimit).map((row) => {
    const entry = row.markerKey ? catalogByKey.get(row.markerKey) : undefined;
    return {
      reportId: latest.id,
      markerKey: row.markerKey,
      name: entry?.name ?? row.rawName,
      description: entry?.description ?? null,
      value: row.value,
      unit: row.unit,
      status: row.status,
    };
  });
  return {
    latest: { ...latest, counts, deltaSincePrevious },
    moveFirst,
    retests: listRetests(rows, latest.collectedAt),
    recent,
    processingCount,
  };
}

type FamilyRow = Awaited<ReturnType<typeof repo.listFamilyDoneReports>>[number];

function isNewer(row: FamilyRow, than: FamilyRow) {
  if (!row.date || !row.uploadedAt) return false;
  if (!than.date || !than.uploadedAt) return true;
  return row.date === than.date ? row.uploadedAt > than.uploadedAt : row.date > than.date;
}

/**
 * Builds one row per profile of the user with its latest done report and the markers at risk in it.
 *
 * @remarks
 * Returns dates only. The web decides when a report is old, because "today" is the reader's day.
 */
export async function getFamily(userId: string) {
  const latestByProfile = new Map<string, FamilyRow>();
  for (const row of await repo.listFamilyDoneReports(userId)) {
    const seen = latestByProfile.get(row.profileId);
    if (!seen || isNewer(row, seen)) latestByProfile.set(row.profileId, row);
  }
  const latest = [...latestByProfile.values()];
  const risk = await repo.countRiskMarkers(latest.flatMap((row) => row.reportId ?? []));
  const riskByReport = new Map(risk.map((row) => [row.reportId, row.total]));
  return latest.map((row) => ({
    id: row.profileId,
    name: row.name,
    relation: row.relation,
    latest:
      row.reportId && row.date
        ? {
            id: row.reportId,
            date: row.date,
            score: row.score,
            tier: row.tier,
            riskCount: riskByReport.get(row.reportId) ?? 0,
          }
        : null,
  }));
}
