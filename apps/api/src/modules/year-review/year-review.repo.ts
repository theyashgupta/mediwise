import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { profiles } from "../../db/schema.js";

type Intro = NonNullable<typeof profiles.$inferSelect.yearReviewIntro>;

export async function findIntro(profileId: string) {
  const [row] = await db
    .select({ intro: profiles.yearReviewIntro })
    .from(profiles)
    .where(eq(profiles.id, profileId));
  return row?.intro ?? null;
}

export async function saveIntro(profileId: string, intro: Intro) {
  await db.update(profiles).set({ yearReviewIntro: intro }).where(eq(profiles.id, profileId));
}
