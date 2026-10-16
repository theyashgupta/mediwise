import { errorMessage, log } from "../middleware/logger.js";
import { backfillReportTitles } from "../modules/reports/index.js";
import { db } from "./client.js";

try {
  log.info(`set the rule title of ${await backfillReportTitles()} reports`);
} catch (error) {
  log.error(errorMessage(error));
  process.exitCode = 1;
}
await db.$client.end();
