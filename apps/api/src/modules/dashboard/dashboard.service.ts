import {
  derived,
  deviation,
  markers,
  markerText,
  retestDueDate,
  sameScoreScale,
  type TextLocale,
} from "@mediwise/engine";
import { getOwnedProfile } from "../profiles/index.js";
import * as repo from "./dashboard.repo.js";

const recentLimit = 5;
const moveFirstLimit = 3;
const latestLimit = 60;
const cadenceDates = 5;
const dayMs = 86_400_000;
const catalogByKey = new Map([...markers, ...derived].map((entry) => [entry.key, entry]));

type AssessedMarker = Awaited<ReturnType<typeof repo.listAssessedMarkers>>[number];
type LatestByMarker = Awaited<ReturnType<typeof repo.listLatestAssessedByMarker>>[number];

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
 * Lists the suggested retest date of each marker from its newest value, soonest first.
 *
 * @remarks
 * Returns dates only, with the day each marker was measured. The web hides a marker measured in the last 30 days and
 * marks a date as past, because "today" is the reader's day.
 */
function listRetests(rows: LatestByMarker[]) {
  return rows
    .flatMap(({ markerKey, status, rawName, collectedAt }) => {
      const dueOn =
        markerKey && status && collectedAt
          ? retestDueDate(markerKey, status, collectedAt)
          : undefined;
      if (!markerKey || !collectedAt || !dueOn) return [];
      const name = catalogByKey.get(markerKey)?.name ?? rawName;
      return [{ markerKey, name, dueOn, measuredOn: collectedAt }];
    })
    .sort((a, b) => a.dueOn.localeCompare(b.dueOn));
}

/**
 * Builds the dashboard for one profile: latest done report, what to move first, and recent reports.
 *
 * @remarks
 * The score change compares with the newest report of an earlier date on the same score scale, so a glucose-only
 * report never reads as a drop from a full panel.
 */
export async function getDashboard(userId: string, profileId: string, locale: TextLocale = "en") {
  await getOwnedProfile(userId, profileId);
  const [recent, [latest, ...older], processingCount, newestByMarker] = await Promise.all([
    repo.listRecentReports(userId, profileId, recentLimit),
    repo.listLatestDoneReports(userId, profileId, latestLimit),
    repo.countReportsInProgress(userId, profileId),
    repo.listLatestAssessedByMarker(userId, profileId),
  ]);
  if (!latest) return { latest: null, moveFirst: [], retests: [], recent, processingCount };
  const previous = older.find(
    (report) =>
      report.date !== latest.date &&
      report.score !== null &&
      sameScoreScale(report.coverage ?? 100, latest.coverage ?? 100),
  );

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
      description: entry ? markerText(entry, locale).description : null,
      value: row.value,
      unit: row.unit,
      status: row.status,
    };
  });
  return {
    latest: { ...latest, counts, deltaSincePrevious },
    moveFirst,
    retests: listRetests(newestByMarker),
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
 * Gives the median number of days between the newest report dates of a profile, or null with fewer than three dates.
 *
 * @remarks
 * The web uses it to tell a weekly history from a yearly one, so the stale line fits how often this person tests.
 */
export function typicalGapDays(dates: string[]) {
  const newest = [...new Set(dates)].sort().slice(-cadenceDates);
  if (newest.length < 3) return null;
  const gaps = newest
    .slice(1)
    .map((date, i) => (Date.parse(date) - Date.parse(newest[i]!)) / dayMs)
    .sort((a, b) => a - b);
  return gaps[Math.floor(gaps.length / 2)]!;
}

/**
 * Builds one row per profile of the user with its latest done report and the markers at risk in it.
 *
 * @remarks
 * Returns dates only. The web decides when a report is old, because "today" is the reader's day.
 */
export async function getFamily(userId: string) {
  const latestByProfile = new Map<string, FamilyRow>();
  const datesByProfile = new Map<string, string[]>();
  for (const row of await repo.listFamilyDoneReports(userId)) {
    const seen = latestByProfile.get(row.profileId);
    if (!seen || isNewer(row, seen)) latestByProfile.set(row.profileId, row);
    if (row.date)
      datesByProfile.set(row.profileId, [...(datesByProfile.get(row.profileId) ?? []), row.date]);
  }
  const latest = [...latestByProfile.values()];
  const risk = await repo.countRiskMarkers(latest.flatMap((row) => row.reportId ?? []));
  const riskByReport = new Map(risk.map((row) => [row.reportId, row.total]));
  return latest.map((row) => ({
    id: row.profileId,
    name: row.name,
    relation: row.relation,
    typicalGapDays: typicalGapDays(datesByProfile.get(row.profileId) ?? []),
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
