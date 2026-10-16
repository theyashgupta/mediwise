import { log } from "../../middleware/logger.js";
import * as repo from "./retention.repo.js";

const sweepEveryMs = 60 * 60 * 1000;
const dayMs = 24 * 60 * 60 * 1000;

let nextSweepAt = 0;

/**
 * Deletes or blanks the rows past their retention period, at most once per hour.
 *
 * @remarks
 * The next sweep time is set before the sweep, so a failed sweep waits one hour instead of running again on every poll.
 */
export async function sweepIfDue() {
  const now = Date.now();
  if (now < nextSweepAt) return;
  nextSweepAt = now + sweepEveryMs;
  const daysAgo = (days: number) => new Date(now - days * dayMs);
  const twoYearsAgo = new Date(now);
  twoYearsAgo.setUTCFullYear(twoYearsAgo.getUTCFullYear() - 2);
  const jobs = await repo.deleteFinishedJobs(daysAgo(30));
  const errors = await repo.blankJobErrors(daysAgo(7));
  const questions = await repo.deleteClearedQuestions(daysAgo(90));
  const deletions = await repo.deleteDeletionLogRows(twoYearsAgo);
  log.info(
    `retention sweep jobs=${jobs} job_errors=${errors} questions=${questions} deletion_log=${deletions}`,
  );
}
