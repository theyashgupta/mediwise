import type { ReportLinkKind } from "@mediwise/shared";
import { and, eq, inArray, ne, or, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { profiles, reportLinks, reports } from "../../db/schema.js";

const visitDate = sql<string>`coalesce(${reports.collectedAt}, ${reports.createdAt}::date)::text`;

const linkColumns = {
  id: reportLinks.id,
  earlierReportId: reportLinks.earlierReportId,
  laterReportId: reportLinks.laterReportId,
  kind: reportLinks.kind,
  createdBy: reportLinks.createdBy,
  state: reportLinks.state,
};

/** Loads an owned report with its visit date, so two reports can be put in date order. */
export async function findOwnedReport(ownerUserId: string, id: string) {
  const [row] = await db
    .select({
      id: reports.id,
      profileId: reports.profileId,
      status: reports.status,
      date: visitDate,
      createdAt: reports.createdAt,
    })
    .from(reports)
    .innerJoin(profiles, eq(profiles.id, reports.profileId))
    .where(and(eq(reports.id, id), eq(profiles.ownerUserId, ownerUserId)));
  return row;
}

/** Lists the profile's other done reports whose visit date is within `days` of a date, either side. */
export async function listNearReports(
  profileId: string,
  reportId: string,
  date: string,
  days: number,
) {
  return db
    .select({ id: reports.id, date: visitDate, createdAt: reports.createdAt })
    .from(reports)
    .where(
      and(
        eq(reports.profileId, profileId),
        eq(reports.status, "done"),
        ne(reports.id, reportId),
        sql`abs(${visitDate}::date - ${date}::date) <= ${days}`,
      ),
    );
}

/** Lists the profile's other done reports from the day of a date to `days` after it. */
export async function listReportsAfter(
  profileId: string,
  reportId: string,
  date: string,
  days: number,
) {
  return db
    .select({ id: reports.id })
    .from(reports)
    .where(
      and(
        eq(reports.profileId, profileId),
        eq(reports.status, "done"),
        ne(reports.id, reportId),
        sql`${visitDate}::date - ${date}::date between 0 and ${days}`,
      ),
    );
}

export async function insertDetectedLinks(
  rows: { earlierReportId: string; laterReportId: string; kind: ReportLinkKind }[],
) {
  if (rows.length === 0) return;
  await db
    .insert(reportLinks)
    .values(
      rows.map((row) => ({ ...row, createdBy: "detector" as const, state: "proposed" as const })),
    )
    .onConflictDoNothing();
}

/** Writes a link the user made, and turns a proposed or dismissed row of the same pair into a confirmed one. */
export async function upsertUserLink(row: {
  earlierReportId: string;
  laterReportId: string;
  kind: ReportLinkKind;
}) {
  const [link] = await db
    .insert(reportLinks)
    .values({ ...row, createdBy: "user", state: "confirmed" })
    .onConflictDoUpdate({
      target: [reportLinks.earlierReportId, reportLinks.laterReportId],
      set: { kind: row.kind, createdBy: "user", state: "confirmed" },
    })
    .returning(linkColumns);
  if (!link) throw new Error("upsert into report_links returned no row");
  return link;
}

export async function updateLinkState(
  reportId: string,
  id: string,
  state: "confirmed" | "dismissed",
) {
  const [link] = await db
    .update(reportLinks)
    .set({ state })
    .where(
      and(
        eq(reportLinks.id, id),
        or(eq(reportLinks.earlierReportId, reportId), eq(reportLinks.laterReportId, reportId)),
      ),
    )
    .returning(linkColumns);
  return link;
}

/** Lists the links of a report that are not dismissed, with the date and lab of the other report. */
export async function listLinks(reportId: string) {
  const links = await db
    .select(linkColumns)
    .from(reportLinks)
    .where(
      and(
        ne(reportLinks.state, "dismissed"),
        or(eq(reportLinks.earlierReportId, reportId), eq(reportLinks.laterReportId, reportId)),
      ),
    );
  const others = links.map((link) =>
    link.earlierReportId === reportId ? link.laterReportId : link.earlierReportId,
  );
  const rows =
    others.length === 0
      ? []
      : await db
          .select({ id: reports.id, labName: reports.labName, date: visitDate })
          .from(reports)
          .where(inArray(reports.id, others));
  return links.flatMap((link, index) => {
    const other = rows.find(({ id }) => id === others[index]);
    return other ? [{ ...link, other }] : [];
  });
}

/** Lists every link of a profile that is not dismissed, as report id pairs. */
export async function listProfileLinks(profileId: string) {
  return db
    .select({
      earlierReportId: reportLinks.earlierReportId,
      laterReportId: reportLinks.laterReportId,
    })
    .from(reportLinks)
    .innerJoin(reports, eq(reports.id, reportLinks.earlierReportId))
    .where(and(eq(reports.profileId, profileId), ne(reportLinks.state, "dismissed")));
}
