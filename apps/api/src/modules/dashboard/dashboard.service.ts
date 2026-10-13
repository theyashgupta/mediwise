import { derived, deviation, markers } from "@mediwise/engine";
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
  if (!latest) return { latest: null, moveFirst: [], recent, processingCount };

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
    recent,
    processingCount,
  };
}
