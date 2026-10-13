import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { episodes, profiles, reports } from "../../db/schema.js";

type Summary = NonNullable<typeof episodes.$inferSelect.summary>;

const visitDate = sql<string>`coalesce(${reports.collectedAt}, ${reports.createdAt}::date)::text`;

const episodeColumns = {
  id: episodes.id,
  profileId: episodes.profileId,
  name: episodes.name,
  startedOn: episodes.startedOn,
  endedOn: episodes.endedOn,
  note: episodes.note,
};

/** Lists the episodes of a profile, newest first, each with the ids of its reports. */
export async function listEpisodes(profileId: string) {
  return db
    .select({
      id: episodes.id,
      name: episodes.name,
      startedOn: episodes.startedOn,
      endedOn: episodes.endedOn,
      note: episodes.note,
      reportIds: sql<
        string[]
      >`coalesce(array_agg(${reports.id}) filter (where ${reports.id} is not null), '{}')`,
    })
    .from(episodes)
    .leftJoin(reports, eq(reports.episodeId, episodes.id))
    .where(eq(episodes.profileId, profileId))
    .groupBy(episodes.id)
    .orderBy(desc(episodes.startedOn), desc(episodes.createdAt));
}

/** Lists the done reports of a profile that belong to no episode, with their visit dates. */
export async function listFreeReports(profileId: string) {
  return db
    .select({ id: reports.id, date: visitDate })
    .from(reports)
    .where(
      and(eq(reports.profileId, profileId), eq(reports.status, "done"), isNull(reports.episodeId)),
    );
}

export async function findDismissedOn(profileId: string) {
  const [row] = await db
    .select({ dismissedOn: profiles.episodeProposalDismissedOn })
    .from(profiles)
    .where(eq(profiles.id, profileId));
  return row?.dismissedOn ?? null;
}

export async function saveDismissedOn(profileId: string, date: string) {
  await db
    .update(profiles)
    .set({ episodeProposalDismissedOn: date })
    .where(eq(profiles.id, profileId));
}

/** Loads the owned reports among `ids`, with their profile, status and visit date. */
export async function listOwnedReports(ownerUserId: string, ids: string[]) {
  return db
    .select({
      id: reports.id,
      profileId: reports.profileId,
      status: reports.status,
      date: visitDate,
    })
    .from(reports)
    .innerJoin(profiles, eq(profiles.id, reports.profileId))
    .where(and(inArray(reports.id, ids), eq(profiles.ownerUserId, ownerUserId)));
}

/** Writes an episode and points its reports at it in one transaction. */
export async function insertEpisode(
  row: { profileId: string; name: string; note: string | null; startedOn: string },
  reportIds: string[],
) {
  return db.transaction(async (tx) => {
    const [episode] = await tx.insert(episodes).values(row).returning({ id: episodes.id });
    if (!episode) throw new Error("insert into episodes returned no row");
    await tx.update(reports).set({ episodeId: episode.id }).where(inArray(reports.id, reportIds));
    return episode;
  });
}

export async function findOwnedEpisode(ownerUserId: string, id: string) {
  const [row] = await db
    .select({ ...episodeColumns, summary: episodes.summary })
    .from(episodes)
    .innerJoin(profiles, eq(profiles.id, episodes.profileId))
    .where(and(eq(episodes.id, id), eq(profiles.ownerUserId, ownerUserId)));
  return row;
}

export async function updateEpisode(
  id: string,
  patch: { name?: string; note?: string | null; endedOn?: string | null },
) {
  await db.update(episodes).set(patch).where(eq(episodes.id, id));
}

export async function deleteEpisode(id: string) {
  await db.delete(episodes).where(eq(episodes.id, id));
}

/** Lists the ids of an episode's done reports in visit order, reports of one date in upload order. */
export async function listEpisodeReports(episodeId: string) {
  return db
    .select({ id: reports.id })
    .from(reports)
    .where(and(eq(reports.episodeId, episodeId), eq(reports.status, "done")))
    .orderBy(visitDate, reports.createdAt);
}

/**
 * Points a report at an episode, or at none, and moves the episode start back when the report is older.
 *
 * @remarks
 * Moving the start keeps every report of an episode on or after its start date.
 */
export async function setReportEpisode(
  reportId: string,
  episode: { id: string; date: string } | null,
) {
  await db.transaction(async (tx) => {
    await tx
      .update(reports)
      .set({ episodeId: episode?.id ?? null })
      .where(eq(reports.id, reportId));
    if (episode) {
      await tx
        .update(episodes)
        .set({ startedOn: sql`least(${episodes.startedOn}, ${episode.date}::date)` })
        .where(eq(episodes.id, episode.id));
    }
  });
}

export async function saveSummary(id: string, summary: Summary) {
  await db.update(episodes).set({ summary }).where(eq(episodes.id, id));
}
