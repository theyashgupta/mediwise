import { and, asc, count, desc, eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { profiles, reports } from "../../db/schema.js";

const profileColumns = {
  id: profiles.id,
  name: profiles.name,
  relation: profiles.relation,
  dateOfBirth: profiles.dateOfBirth,
  dateOfBirthApproximate: profiles.dateOfBirthApproximate,
  sex: profiles.sex,
  ancestry: profiles.ancestry,
  isSelf: profiles.isSelf,
  permissionConfirmedAt: profiles.permissionConfirmedAt,
  guardianConfirmedAt: profiles.guardianConfirmedAt,
};

type ProfileRow = typeof profiles.$inferInsert;
export type ProfileValues = Omit<ProfileRow, "id" | "ownerUserId" | "isSelf" | "createdAt">;

export async function listProfilesByOwner(ownerUserId: string) {
  return db
    .select({ ...profileColumns, reportCount: count(reports.id) })
    .from(profiles)
    .leftJoin(reports, eq(reports.profileId, profiles.id))
    .where(eq(profiles.ownerUserId, ownerUserId))
    .groupBy(profiles.id)
    .orderBy(desc(profiles.isSelf), asc(profiles.createdAt));
}

export async function findProfileById(ownerUserId: string, id: string) {
  const [row] = await db
    .select(profileColumns)
    .from(profiles)
    .where(and(eq(profiles.id, id), eq(profiles.ownerUserId, ownerUserId)));
  return row;
}

export async function countProfilesByOwner(ownerUserId: string) {
  const [row] = await db
    .select({ total: count() })
    .from(profiles)
    .where(eq(profiles.ownerUserId, ownerUserId));
  return row?.total ?? 0;
}

export async function insertProfile(ownerUserId: string, input: ProfileValues) {
  const [row] = await db
    .insert(profiles)
    .values({ ...input, ownerUserId })
    .returning(profileColumns);
  return row;
}

/**
 * Inserts the self profile unless the owner already has one.
 *
 * @remarks
 * The partial unique index on `is_self` makes concurrent first calls safe; the loser inserts nothing.
 */
export async function insertSelfProfileIfMissing(ownerUserId: string, name: string) {
  await db
    .insert(profiles)
    .values({ ownerUserId, name, relation: "self", ancestry: "unknown", isSelf: true })
    .onConflictDoNothing();
}

export async function updateProfile(
  ownerUserId: string,
  id: string,
  input: Partial<ProfileValues>,
) {
  const [row] = await db
    .update(profiles)
    .set(input)
    .where(and(eq(profiles.id, id), eq(profiles.ownerUserId, ownerUserId)))
    .returning(profileColumns);
  return row;
}

export async function deleteProfile(ownerUserId: string, id: string) {
  await db.delete(profiles).where(and(eq(profiles.id, id), eq(profiles.ownerUserId, ownerUserId)));
}
