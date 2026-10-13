import { eq } from "drizzle-orm";
import { log } from "../middleware/logger.js";
import { reportUsage } from "../modules/extraction/index.js";
import { processReport } from "../modules/reports/index.js";
import { db } from "./client.js";
import { reports } from "./schema.js";

/**
 * Reads every done report again, one at a time, and classifies every page again unless `--keep-classes` is passed.
 *
 * @remarks
 * A report that fails goes back to `done` with its old rows, because the new rows are saved in one transaction at the end.
 */
async function rereadReports(reclassify: boolean) {
  const done = await db.select({ id: reports.id }).from(reports).where(eq(reports.status, "done"));
  let failed = 0;
  for (const { id } of done) {
    try {
      await processReport(id, reportUsage(), reclassify);
    } catch (error) {
      failed++;
      log.error(`reread report=${id} error=${error instanceof Error ? error.message : error}`);
      await db.update(reports).set({ status: "done" }).where(eq(reports.id, id));
    }
  }
  log.info(`reread ${done.length - failed} of ${done.length} reports, ${failed} failed`);
}

await rereadReports(!process.argv.includes("--keep-classes"));
await db.$client.end();
