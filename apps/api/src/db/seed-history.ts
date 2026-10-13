import { log } from "../middleware/logger.js";
import { findUserIdByEmail } from "../modules/credits/index.js";
import { db } from "./client.js";
import { denseHistoryProfile, denseHistoryReports } from "./dense-history.js";
import { profiles, reportMarkers, reports } from "./schema.js";

const usage =
  "Usage: pnpm --filter @mediwise/api db:seed-history <email> [last report date YYYY-MM-DD]";
const [email, lastDate = new Date().toISOString().slice(0, 10)] = process.argv.slice(2);

if (!email || !/^\d{4}-\d{2}-\d{2}$/.test(lastDate)) {
  log.error(usage);
  process.exitCode = 1;
} else {
  try {
    const ownerUserId = await findUserIdByEmail(email);
    const seeded = denseHistoryReports(lastDate);
    await db.transaction(async (tx) => {
      const [profile] = await tx
        .insert(profiles)
        .values({
          ownerUserId,
          name: denseHistoryProfile.name,
          relation: "other",
          dateOfBirth: denseHistoryProfile.dateOfBirth,
          sex: "male",
          ancestry: "south_asian",
          permissionConfirmedAt: new Date(),
        })
        .returning({ id: profiles.id });
      for (const { markers, ...report } of seeded) {
        const [row] = await tx
          .insert(reports)
          .values({ ...report, profileId: profile!.id, status: "done", sourceKind: "pdf" })
          .returning({ id: reports.id });
        await tx
          .insert(reportMarkers)
          .values(markers.map((marker) => ({ ...marker, reportId: row!.id })));
      }
      log.info(`seeded profile=${profile!.id} reports=${seeded.length} user=${ownerUserId}`);
    });
  } catch (error) {
    log.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
await db.$client.end();
