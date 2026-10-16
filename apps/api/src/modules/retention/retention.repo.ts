import { and, eq, exists, inArray, isNotNull, lt, not, or, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { assistantQuestions, deletionLog, jobs, profiles } from "../../db/schema.js";

/**
 * Deletes done and failed jobs last updated before `before`, and returns how many.
 *
 * @remarks
 * A job of the current month stays, because its tokens count toward this month's Claude spend cap.
 */
export async function deleteFinishedJobs(before: Date) {
  const rows = await db
    .delete(jobs)
    .where(
      and(
        inArray(jobs.status, ["done", "failed"]),
        lt(jobs.updatedAt, before),
        lt(jobs.updatedAt, sql`date_trunc('month', now())`),
      ),
    )
    .returning({ id: jobs.id });
  return rows.length;
}

/**
 * Removes the error text of jobs last updated before `before`, and returns how many.
 *
 * @remarks
 * `updated_at` stays as it is, because the spend cap counts a job in the month of that time.
 */
export async function blankJobErrors(before: Date) {
  const rows = await db
    .update(jobs)
    .set({ error: null })
    .where(and(isNotNull(jobs.error), lt(jobs.updatedAt, before)))
    .returning({ id: jobs.id });
  return rows.length;
}

/**
 * Deletes questions cleared before `before` that no live account counts, and returns how many.
 *
 * @remarks
 * A charged question of an account that still has a profile stays, because questions left subtracts every charged row.
 */
export async function deleteClearedQuestions(before: Date) {
  const rows = await db
    .delete(assistantQuestions)
    .where(
      and(
        lt(assistantQuestions.clearedAt, before),
        or(
          eq(assistantQuestions.charged, false),
          not(
            exists(
              db
                .select({ id: profiles.id })
                .from(profiles)
                .where(eq(profiles.ownerUserId, assistantQuestions.userId)),
            ),
          ),
        ),
      ),
    )
    .returning({ id: assistantQuestions.id });
  return rows.length;
}

export async function deleteDeletionLogRows(before: Date) {
  const rows = await db
    .delete(deletionLog)
    .where(lt(deletionLog.deletedAt, before))
    .returning({ id: deletionLog.id });
  return rows.length;
}
