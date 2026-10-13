import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import { env } from "../config/env.js";
import { log } from "../middleware/logger.js";
import { db } from "./client.js";
import { profiles, reports } from "./schema.js";

const isSelfOf = (owner: string) => and(eq(profiles.ownerUserId, owner), eq(profiles.isSelf, true));

/**
 * Moves every profile of `DEV_USER_ID` to the given Supabase user.
 *
 * @remarks
 * The first sign-in creates an empty self profile, and one owner may have only one. That empty profile is deleted so the dev self profile, which holds the reports, takes its place.
 */
async function claimDevData(userId: string) {
  return db.transaction(async (tx) => {
    const [devSelf] = await tx
      .select({ id: profiles.id })
      .from(profiles)
      .where(isSelfOf(env.DEV_USER_ID));
    const [userSelf] = await tx.select({ id: profiles.id }).from(profiles).where(isSelfOf(userId));
    if (devSelf && userSelf) {
      const [reportCount] = await tx
        .select({ value: count() })
        .from(reports)
        .where(eq(reports.profileId, userSelf.id));
      if (reportCount?.value) {
        throw new Error(`The self profile of ${userId} has reports. Move them by hand.`);
      }
      await tx.delete(profiles).where(eq(profiles.id, userSelf.id));
    }
    return tx
      .update(profiles)
      .set({ ownerUserId: userId })
      .where(eq(profiles.ownerUserId, env.DEV_USER_ID))
      .returning({ id: profiles.id });
  });
}

const userId = z
  .uuid()
  .parse(process.argv[2], { error: () => "Usage: pnpm db:claim-dev-data <supabase-user-id>" });
const moved = await claimDevData(userId);
log.info(`moved ${moved.length} profiles from ${env.DEV_USER_ID} to ${userId}`);
await db.$client.end();
