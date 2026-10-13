import {
  alertHeadline,
  alertHeadlineStart,
  daysBetween,
  type FindingDraft,
  type LaterVisit,
  openQuestions,
  repeatMarkerDays,
  repeatGap,
  repeatStudyDays,
  type Settlement,
  settleFinding,
  typicalGapDays,
  type Visit,
} from "@mediwise/engine";
import type { Narrative, ReportLinkKind } from "@mediwise/shared";
import { AppError } from "../../common/errors.js";
import { findVisit } from "../findings/index.js";
import { withHeadline } from "../narrative/index.js";
import * as repo from "./links.repo.js";

type Dated = { id: string; date: string; createdAt: Date };
type StoredFinding = Pick<
  FindingDraft,
  "kind" | "severity" | "title" | "citedKeys" | "citedStudyIds"
> & { body: string };

/** Puts two reports in visit order. Reports of one date go in upload order. */
function inOrder(a: Dated, b: Dated): [Dated, Dated] {
  const days = daysBetween(a.date, b.date);
  return days > 0 || (days === 0 && a.createdAt <= b.createdAt) ? [a, b] : [b, a];
}

/**
 * Links every done report of the profile with a study of the same modality and region within 90 days.
 *
 * @remarks
 * Runs on every read, so an older report uploaded after a newer one still finds it. A pair that already has a row keeps it,
 * so an undone link never comes back.
 */
export async function proposeLinks(
  profileId: string,
  report: Dated,
  current: Pick<Visit, "date" | "studies">,
) {
  if (current.studies.length === 0) return;
  const near = await repo.listNearReports(profileId, report.id, current.date, repeatStudyDays);
  const rows = [];
  for (const other of near) {
    const visit = (await findVisit(other.id))?.visit;
    const days = visit && repeatGap(current, visit);
    if (days === undefined) continue;
    const [earlier, later] =
      days === 0 ? inOrder(report, other) : days > 0 ? [report, other] : [other, report];
    const kind: ReportLinkKind = days === 0 ? "second_opinion" : "repeat";
    rows.push({ earlierReportId: earlier.id, laterReportId: later.id, kind });
  }
  await repo.insertDetectedLinks(rows);
}

/**
 * Loads the reports that can settle a finding of this report, and the profile's typical gap between reports.
 *
 * @remarks
 * Every linked later report and every report of the next 30 days. Only a linked report can settle a study alert. The
 * 30 days serve marker repeats, which need no link, and the gap tells `repeatsMarker` how often this person tests.
 */
export async function loadLaterVisits(
  profileId: string,
  reportId: string,
  date: string,
): Promise<{ later: LaterVisit[]; typicalGap: number | null }> {
  const [links, soon, dates] = await Promise.all([
    repo.listLinks(reportId),
    repo.listReportsAfter(profileId, reportId, date, repeatMarkerDays),
    repo.listVisitDates(profileId),
  ]);
  const linked = new Set(
    links.filter((link) => link.earlierReportId === reportId).map((link) => link.laterReportId),
  );
  const ids = [...new Set([...linked, ...soon.map(({ id }) => id)])];
  const visits = await Promise.all(
    ids.map(async (id) => {
      const found = await findVisit(id);
      return found ? [{ ...found.visit, reportId: id, linked: linked.has(id) }] : [];
    }),
  );
  return {
    later: visits.flat().toSorted((a, b) => a.date.localeCompare(b.date)),
    typicalGap: typicalGapDays([...dates, date]),
  };
}

function step(reportId: string, date: string, labName: string | null, text: string) {
  return { reportId, date, labName, text };
}

/**
 * Splits the stored findings of a report into open ones and settled ones, by the reports linked to it now.
 *
 * @remarks
 * Runs on every page load, so a confirm or a dismiss changes the page with no new read. The questions and the engine
 * headline sentence lose a settled finding the same way.
 */
export function settleStored(
  reportId: string,
  {
    current,
    later,
    typicalGap,
  }: { current: Visit; later: LaterVisit[]; typicalGap: number | null },
  stored: { findings: StoredFinding[]; doctorQuestions: string[]; narrative: Narrative | null },
) {
  const states = stored.findings.map((finding) => ({
    finding,
    settlement: settleFinding(finding, current, later, typicalGap),
  }));
  const sequence = (settlement: Settlement) => ({
    state: settlement.state,
    earlier: step(reportId, settlement.earlierDate, current.labName, settlement.earlier),
    later: step(settlement.reportId, settlement.date, settlement.labName, settlement.later),
  });
  const settled = states.flatMap(({ finding, settlement }) =>
    settlement?.state === "settled" ? [{ settlement, finding }] : [],
  );
  const narrative = stored.narrative && {
    sections: stored.narrative.sections.map((section) => ({
      ...section,
      sentences: section.sentences.filter(({ text }) => !text.startsWith(alertHeadlineStart)),
    })),
  };
  const headline = alertHeadline(
    current,
    states.map(({ finding, settlement }) => ({ ...finding, settlement })),
  );
  return {
    findings: states.flatMap(({ finding, settlement }) =>
      settlement?.state === "settled"
        ? []
        : [
            {
              ...finding,
              severity: settlement?.severity ?? finding.severity,
              sequence: settlement ? sequence(settlement) : null,
            },
          ],
    ),
    settled: settled.map(({ finding, settlement }) => ({
      kind: finding.kind,
      title: finding.title,
      ...sequence(settlement),
    })),
    doctorQuestions: openQuestions(
      stored.doctorQuestions,
      settled.map(({ settlement }) => settlement),
    ),
    narrative: narrative && withHeadline(narrative, headline),
  };
}

/** Loads a done report's visit with every later visit that can settle its findings. */
export async function loadSequence(reportId: string) {
  const found = await findVisit(reportId);
  if (!found) return undefined;
  const { later, typicalGap } = await loadLaterVisits(found.profileId, reportId, found.visit.date);
  return { current: found.visit, later, typicalGap };
}

/** Lists the links of a report for its page, each named from this report's side. */
export async function listReportLinks(reportId: string) {
  const links = await repo.listLinks(reportId);
  return links.map(({ id, kind, state, createdBy, earlierReportId, other }) => ({
    id,
    kind,
    state,
    createdBy,
    role: earlierReportId === reportId ? ("earlier" as const) : ("later" as const),
    other,
  }));
}

/**
 * Links two done reports of one profile, in visit order, as the user asked.
 *
 * @remarks
 * Another user's report answers 404, the same as a report that does not exist.
 */
export async function linkReports(
  userId: string,
  reportId: string,
  otherId: string,
  kind: ReportLinkKind,
) {
  if (reportId === otherId) throw new AppError(422, "Select a different report");
  const [report, other] = await Promise.all([
    repo.findOwnedReport(userId, reportId),
    repo.findOwnedReport(userId, otherId),
  ]);
  if (!report || !other) throw new AppError(404, "We could not find this report");
  if (report.profileId !== other.profileId) {
    throw new AppError(422, "Select a report of the same person");
  }
  if (report.status !== "done" || other.status !== "done") {
    throw new AppError(422, "Wait until we read both reports");
  }
  const [earlier, later] = inOrder(report, other);
  await repo.upsertUserLink({ earlierReportId: earlier.id, laterReportId: later.id, kind });
  return listReportLinks(reportId);
}

/** Confirms or dismisses one link of an owned report. */
export async function setLinkState(
  userId: string,
  reportId: string,
  linkId: string,
  state: "confirmed" | "dismissed",
) {
  const report = await repo.findOwnedReport(userId, reportId);
  if (!report) throw new AppError(404, "We could not find this report");
  const link = await repo.updateLinkState(reportId, linkId, state);
  if (!link) throw new AppError(404, "We could not find this link");
  return listReportLinks(reportId);
}

/** Lists the report id pairs of a profile's links that are not dismissed, for the trend chart. */
export async function listLinkedPairs(profileId: string) {
  return (await repo.listProfileLinks(profileId)).map(
    ({ earlierReportId, laterReportId }) => `${earlierReportId}:${laterReportId}`,
  );
}
