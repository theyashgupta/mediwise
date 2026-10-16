import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { type CachedSentences, episodes, profiles, reports } from "../../db/schema.js";
import { type Cipher, cipherFor, cipherForEpisode, cipherForProfile } from "../../lib/user-keys.js";

const openEpisode =
  (cipher: Cipher) =>
  <T extends { name: string; note: string | null }>(row: T) => ({
    ...row,
    name: cipher.decrypt(row.name),
    note: cipher.decrypt(row.note),
  });

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
  const query = db
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
  const [rows, cipher] = await Promise.all([query, cipherForProfile(profileId)]);
  return cipher ? rows.map(openEpisode(cipher)) : [];
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
  const cipher = await cipherForProfile(row.profileId);
  if (!cipher) throw new Error("insert into episodes found no profile");
  const values = { ...row, name: cipher.encrypt(row.name), note: cipher.encrypt(row.note) };
  return db.transaction(async (tx) => {
    const [episode] = await tx.insert(episodes).values(values).returning({ id: episodes.id });
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
  if (!row) return undefined;
  const cipher = await cipherFor(ownerUserId);
  return {
    ...openEpisode(cipher)(row),
    summary: cipher.decryptJson<CachedSentences>(row.summary),
  };
}

export async function updateEpisode(
  id: string,
  patch: { name?: string; note?: string | null; endedOn?: string | null },
) {
  const cipher = await cipherForEpisode(id);
  if (!cipher) return;
  await db
    .update(episodes)
    .set({ ...patch, name: cipher.encrypt(patch.name), note: cipher.encrypt(patch.note) })
    .where(eq(episodes.id, id));
}

export async function deleteEpisode(id: string) {
  await db.delete(episodes).where(eq(episodes.id, id));
}

/** Lists the ids of an episode's done reports in visit order, reports of one date in upload order. */
export async function listEpisodeReports(episodeId: string) {
  const [rows, cipher] = await Promise.all([
    db
      .select({ id: reports.id, title: reports.title })
      .from(reports)
      .where(and(eq(reports.episodeId, episodeId), eq(reports.status, "done")))
      .orderBy(visitDate, reports.createdAt),
    cipherForEpisode(episodeId),
  ]);
  return cipher ? rows.map((row) => ({ ...row, title: cipher.decrypt(row.title) })) : [];
}

/**
 * Points a report at an episode, or at none, and keeps the start of each episode it touches on its oldest report.
 *
 * @remarks
 * The episode a report leaves starts again on its oldest remaining report, never after its end date, so a stray
 * old report attached by mistake does not stretch the episode for good.
 */
export async function setReportEpisode(
  reportId: string,
  episode: { id: string; date: string } | null,
) {
  await db.transaction(async (tx) => {
    const [before] = await tx
      .select({ episodeId: reports.episodeId })
      .from(reports)
      .where(eq(reports.id, reportId));
    await tx
      .update(reports)
      .set({ episodeId: episode?.id ?? null })
      .where(eq(reports.id, reportId));
    const left = before?.episodeId;
    if (left && left !== episode?.id) {
      const oldest = sql`coalesce((select min(${visitDate}::date) from ${reports} where ${reports.episodeId} = ${left}), ${episodes.startedOn})`;
      await tx
        .update(episodes)
        .set({ startedOn: sql`least(${oldest}, coalesce(${episodes.endedOn}, ${oldest}))` })
        .where(eq(episodes.id, left));
    }
    if (episode) {
      await tx
        .update(episodes)
        .set({ startedOn: sql`least(${episodes.startedOn}, ${episode.date}::date)` })
        .where(eq(episodes.id, episode.id));
    }
  });
}

export async function saveSummary(id: string, summary: CachedSentences) {
  const cipher = await cipherForEpisode(id);
  if (!cipher) return;
  await db
    .update(episodes)
    .set({ summary: cipher.encryptJson(summary) })
    .where(eq(episodes.id, id));
}
