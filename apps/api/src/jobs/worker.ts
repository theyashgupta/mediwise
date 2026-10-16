import { and, eq, lt, lte, or, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { jobs } from "../db/schema.js";
import { log } from "../middleware/logger.js";
import { logAlerts } from "../modules/admin/index.js";
import { type ReportUsage, reportUsage, usageTotals } from "../modules/extraction/index.js";
import { sweepIfDue } from "../modules/retention/index.js";
import { parkIfOverBudget, resumeIfUnderBudget } from "./budget.js";
import { failProcessReport, handleProcessReport } from "./process-report.job.js";

type Job = typeof jobs.$inferSelect;
type Handler = {
  run: (payload: unknown, usage: ReportUsage) => Promise<void>;
  fail: (payload: unknown, error: unknown) => Promise<void>;
};

const handlers: Record<string, Handler> = {
  process_report: { run: handleProcessReport, fail: failProcessReport },
};

const pollMs = 5_000;
const maxAttempts = 3;
const retryDelay = sql`now() + interval '30 seconds'`;
const staleBefore = sql`now() - interval '10 minutes'`;

/**
 * Locks one due job, marks it running and counts the attempt.
 *
 * @remarks
 * A job still `running` after 10 minutes belongs to a process that died, so it is claimed again.
 * `SKIP LOCKED` lets several API processes poll the same table without taking the same job.
 */
async function claimJob() {
  return db.transaction(async (tx) => {
    const [due] = await tx
      .select({ id: jobs.id })
      .from(jobs)
      .where(
        or(
          and(eq(jobs.status, "queued"), lte(jobs.runAfter, sql`now()`)),
          and(eq(jobs.status, "running"), lt(jobs.updatedAt, staleBefore)),
        ),
      )
      .orderBy(jobs.runAfter)
      .limit(1)
      .for("update", { skipLocked: true });
    if (!due) return undefined;
    const [job] = await tx
      .update(jobs)
      .set({ status: "running", attempts: sql`${jobs.attempts} + 1`, updatedAt: sql`now()` })
      .where(eq(jobs.id, due.id))
      .returning();
    return job;
  });
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Runs one claimed job and records done, a delayed retry, or the final failure.
 *
 * @remarks
 * A job past its attempts, which only happens after a crash on the last one, fails without running again.
 * Each attempt adds its tokens to the job's stored usage, also when it throws, so the spend guard sees retries and failures.
 */
async function runJob(job: Job) {
  const handler = handlers[job.kind];
  const usage = job.usage ?? reportUsage();
  const tokens = () => ({ usage, ...usageTotals(usage) });
  const line = `worker job=${job.id} kind=${job.kind} attempt=${job.attempts}`;
  try {
    if (!handler) throw new Error(`No handler for job kind ${job.kind}`);
    if (job.attempts > maxAttempts) {
      throw new Error(job.error ?? "The worker stopped while running this job");
    }
    await handler.run(job.payload, usage);
    await db
      .update(jobs)
      .set({ status: "done", error: null, ...tokens(), updatedAt: sql`now()` })
      .where(eq(jobs.id, job.id));
    log.info(`${line} status=done`);
  } catch (error) {
    const message = errorMessage(error);
    const final = !handler || job.attempts >= maxAttempts;
    await db
      .update(jobs)
      .set({
        status: final ? "failed" : "queued",
        error: message,
        ...tokens(),
        updatedAt: sql`now()`,
        ...(!final && { runAfter: retryDelay }),
      })
      .where(eq(jobs.id, job.id));
    if (final) await handler?.fail(job.payload, error);
    log.error(`${line} status=${final ? "failed" : "retry"} error=${message}`);
  }
}

async function tick() {
  try {
    await resumeIfUnderBudget();
    await logAlerts();
    await sweepIfDue();
    const job = await claimJob();
    if (job && !(await parkIfOverBudget(job))) await runJob(job);
  } catch (error) {
    log.error(`worker tick failed: ${errorMessage(error)}`);
  }
}

/**
 * Polls the `jobs` table every 5 seconds and runs one job at a time, and runs the retention sweep once per hour.
 *
 * @remarks
 * `stop` lets the job in hand finish, so a deploy does not leave it for the 10 minute crash recovery.
 */
export function startWorker() {
  let running = true;
  let timer: NodeJS.Timeout | undefined;
  let current = Promise.resolve();
  const loop = () => {
    current = tick().finally(() => {
      if (running) timer = setTimeout(loop, pollMs);
    });
  };
  loop();
  log.info("worker started");
  return {
    stop: async () => {
      running = false;
      clearTimeout(timer);
      await current;
      log.info("worker stopped");
    },
  };
}
