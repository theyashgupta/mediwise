import { log } from "../middleware/logger.js";
import { findUserIdByEmail } from "../modules/credits/index.js";
import { db } from "./client.js";
import { denseHistoryReports, insertDenseHistory } from "./dense-history.js";

const usage =
  "Usage: pnpm --filter @mediwise/api db:seed-history <email> [last report date YYYY-MM-DD]";
const [email, lastDate = new Date().toISOString().slice(0, 10)] = process.argv.slice(2);

if (!email || !/^\d{4}-\d{2}-\d{2}$/.test(lastDate)) {
  log.error(usage);
  process.exitCode = 1;
} else {
  try {
    const ownerUserId = await findUserIdByEmail(email);
    const { profileId, reportIds } = await insertDenseHistory(
      ownerUserId,
      denseHistoryReports(lastDate),
    );
    log.info(`seeded profile=${profileId} reports=${reportIds.length} user=${ownerUserId}`);
  } catch (error) {
    log.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
await db.$client.end();
