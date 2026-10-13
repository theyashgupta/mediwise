import { log } from "../middleware/logger.js";
import { findUserIdByEmail } from "../modules/credits/index.js";
import { db } from "./client.js";
import { denseHistoryReports, insertDenseHistory } from "./dense-history.js";

const usage =
  "Usage: pnpm --filter @mediwise/api db:seed-history <email> [last report date YYYY-MM-DD]";

/**
 * Returns today's date on the local clock as YYYY-MM-DD.
 *
 * @remarks
 * The e2e specs count report dates back from the local day. Before 05:30 in India the UTC day is still yesterday.
 */
function localToday() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

const [email, lastDate = localToday()] = process.argv.slice(2);

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
