import { log } from "../middleware/logger.js";
import { isOverBudget, parkJob, resumeParkedJobs } from "../modules/spend/index.js";
import { pauseProcessReport } from "./process-report.job.js";

const pauses: Record<string, (payload: unknown) => Promise<void>> = {
  process_report: pauseProcessReport,
};

let mayHaveParked = true;

/**
 * Parks a claimed job as `paused_budget` when this month's Claude spend is over the cap, and returns whether it did.
 *
 * @remarks
 * The check runs before the handler, so a parked report is not debited and holds no credit.
 */
export async function parkIfOverBudget(job: { id: string; kind: string; payload: unknown }) {
  if (!(await isOverBudget())) return false;
  await parkJob(job.id);
  await pauses[job.kind]?.(job.payload);
  mayHaveParked = true;
  log.info(`worker job=${job.id} kind=${job.kind} status=paused_budget`);
  return true;
}

/**
 * Moves parked jobs back to the queue once spend is under the cap.
 *
 * @remarks
 * The flag starts true, so a restart with a higher cap resumes jobs parked by the old process on its first poll.
 */
export async function resumeIfUnderBudget() {
  if (!mayHaveParked || (await isOverBudget())) return;
  await resumeParkedJobs();
  mayHaveParked = false;
}
