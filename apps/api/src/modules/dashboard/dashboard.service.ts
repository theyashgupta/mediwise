import {
  type AttentionVisit,
  buildAttention,
  derived,
  deviation,
  markers,
  markerText,
  retestDueDate,
  sameScoreScale,
  settleFinding,
  type TextLocale,
  typicalGapDays,
} from "@mediwise/engine";
import { listFindings } from "../findings/index.js";
import { loadSequence, settleStored } from "../links/index.js";
import { getOwnedProfile } from "../profiles/index.js";
import * as repo from "./dashboard.repo.js";

const recentLimit = 5;
const moveFirstLimit = 3;
const latestLimit = 60;
const leadMinMarkers = 10;
const newSinceLimit = 3;
const catalogByKey = new Map([...markers, ...derived].map((entry) => [entry.key, entry]));

type AssessedMarker = Awaited<ReturnType<typeof repo.listAssessedMarkers>>[number];
type LatestByMarker = Awaited<ReturnType<typeof repo.listLatestAssessedByMarker>>[number];

type Ranked = Pick<AssessedMarker, "status" | "value" | "calibratedLow" | "calibratedHigh">;

function distance({ value, calibratedLow, calibratedHigh }: Ranked) {
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
export function rankStoredMoveFirst<T extends Ranked>(rows: T[], limit: number) {
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

/** Lists the assessed markers of each report with their catalog names. */
async function listReportMarkers(newer: { id: string; date: string; labName: string | null }[]) {
  return Promise.all(
    newer.map(async ({ id, date, labName }) => ({
      id,
      date,
      labName,
      markers: (await repo.listAssessedMarkers(id)).map((row) => ({
        markerKey: row.markerKey,
        name: catalogByKey.get(row.markerKey ?? "")?.name ?? row.rawName,
        value: row.value,
        unit: row.unit,
        status: row.status,
      })),
    })),
  );
}

/** Groups stored marker rows into visits, keeping the oldest-first order of the rows. */
function toVisits(rows: Awaited<ReturnType<typeof repo.listMarkerHistory>>) {
  const visits = new Map<string, AttentionVisit>();
  for (const { reportId, date, ...row } of rows) {
    const visit = visits.get(reportId) ?? { reportId, date, markers: [] };
    visit.markers.push(row);
    visits.set(reportId, visit);
  }
  return [...visits.values()];
}

/**
 * Lists the study alert findings of a profile with what later reports say about each.
 *
 * @remarks
 * Only reports with an alert load their sequence, so a profile with no study pays one query.
 */
async function listAlerts(userId: string, profileId: string) {
  const stored = await repo.listAlertFindings(userId, profileId);
  const reportIds = [...new Set(stored.map(({ reportId }) => reportId))];
  const sequences = new Map(
    await Promise.all(reportIds.map(async (id) => [id, await loadSequence(id)] as const)),
  );
  return stored.map(({ reportId, date, title, ...finding }) => {
    const sequence = sequences.get(reportId);
    const settlement =
      sequence && settleFinding(finding, sequence.current, sequence.later, sequence.typicalGap);
    return { reportId, date, title, ...(settlement && { settlement }) };
  });
}

/** Lists what needs attention across every done report of a profile, each row with a name to show. */
async function listAttention(userId: string, profileId: string) {
  const [rows, alerts] = await Promise.all([
    repo.listMarkerHistory(userId, profileId),
    listAlerts(userId, profileId),
  ]);
  return buildAttention(toVisits(rows), alerts).map((item) =>
    item.kind === "alert"
      ? { ...item, markerKey: null, name: item.title }
      : { ...item, name: catalogByKey.get(item.markerKey)?.name ?? item.markerKey },
  );
}

/**
 * Builds the dashboard for one profile: the report that leads Home, the narrow reports since it, what to move first,
 * and recent reports.
 *
 * @remarks
 * The newest scored full panel (`leadMinMarkers` mapped markers or more) leads, and its score change compares with the
 * previous scored full panel only, never with a narrow report. The narrow reports after the lead come back in
 * `newSince` with their own markers. With no full panel, the newest report leads and compares with a narrow one.
 * `attention` reads every report, not the lead one only.
 */
export async function getDashboard(userId: string, profileId: string, locale: TextLocale = "en") {
  await getOwnedProfile(userId, profileId);
  const [recent, done, processingCount, newestByMarker, attention] = await Promise.all([
    repo.listRecentReports(userId, profileId, recentLimit),
    repo.listLatestDoneReports(userId, profileId, latestLimit),
    repo.countReportsInProgress(userId, profileId),
    repo.listLatestAssessedByMarker(userId, profileId),
    listAttention(userId, profileId),
  ]);
  const isFullPanel = (report: { mappedCount: number }) => report.mappedCount >= leadMinMarkers;
  const leadIndex = Math.max(
    done.findIndex((report) => report.score !== null && isFullPanel(report)),
    0,
  );
  const latest = done[leadIndex];
  if (!latest)
    return {
      latest: null,
      newSince: [],
      moveFirst: [],
      attention,
      retests: [],
      newestFinding: null,
      recent,
      processingCount,
    };
  const previous = done
    .slice(leadIndex + 1)
    .find(
      (report) =>
        report.date !== latest.date &&
        report.score !== null &&
        isFullPanel(report) === isFullPanel(latest) &&
        sameScoreScale(report.coverage ?? 100, latest.coverage ?? 100),
    );

  const [rows, newSince, newestFinding] = await Promise.all([
    repo.listAssessedMarkers(latest.id),
    listReportMarkers(done.slice(0, Math.min(leadIndex, newSinceLimit))),
    findNewestFinding([...new Set([done[0]!.id, latest.id])]),
  ]);
  const counts = { optimal: 0, watch: 0, risk: 0 };
  rows.forEach((row) => row.status && counts[row.status]++);
  const deltaSincePrevious =
    previous && previous.score !== null && latest.score !== null
      ? { score: latest.score - previous.score, since: previous.date }
      : null;
  const moveFirst = rankStoredMoveFirst(rows, moveFirstLimit).map((row) => {
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
    newSince,
    moveFirst,
    attention,
    retests: listRetests(newestByMarker),
    newestFinding,
    recent,
    processingCount,
  };
}

/**
 * Finds the top open finding of the newest report that has one, from the reports given newest first.
 *
 * @remarks
 * Settled findings drop out the same way as on the report page, so Home never suggests a question about a settled alert.
 */
async function findNewestFinding(reportIds: string[]) {
  for (const reportId of reportIds) {
    const [stored, sequence] = await Promise.all([listFindings(reportId), loadSequence(reportId)]);
    const open = sequence
      ? settleStored(reportId, sequence, { findings: stored, doctorQuestions: [], narrative: null })
          .findings
      : stored;
    if (open[0]) return { reportId, title: open[0].title };
  }
  return null;
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
