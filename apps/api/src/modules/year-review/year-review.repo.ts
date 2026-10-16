import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { type CachedSentences, profiles } from "../../db/schema.js";
import { cipherForProfile } from "../../db/user-keys.js";

export async function findIntro(profileId: string) {
  const [[row], cipher] = await Promise.all([
    db.select({ intro: profiles.yearReviewIntro }).from(profiles).where(eq(profiles.id, profileId)),
    cipherForProfile(profileId),
  ]);
  return (row && cipher?.decryptJson<CachedSentences>(row.intro)) ?? null;
}

export async function saveIntro(profileId: string, intro: CachedSentences) {
  const cipher = await cipherForProfile(profileId);
  if (!cipher) return;
  await db
    .update(profiles)
    .set({ yearReviewIntro: cipher.encryptJson(intro) })
    .where(eq(profiles.id, profileId));
}
