import { and, asc, count, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import {
  assistantQuestions,
  clearedQuestion,
  consentRecords,
  deletionLog,
  jobs,
  profiles,
  reportFiles,
  reportMarkers,
  reports,
} from "../../db/schema.js";

const ownedProfileIds = (ownerUserId: string) =>
  db.select({ id: profiles.id }).from(profiles).where(eq(profiles.ownerUserId, ownerUserId));

const ownedReportIds = (ownerUserId: string) =>
  db
    .select({ id: reports.id })
    .from(reports)
    .where(inArray(reports.profileId, ownedProfileIds(ownerUserId)));

const isSelfOf = (ownerUserId: string) =>
  and(eq(profiles.ownerUserId, ownerUserId), eq(profiles.isSelf, true));

export async function findSelfName(ownerUserId: string) {
  const [row] = await db
    .select({ name: profiles.name })
    .from(profiles)
    .where(isSelfOf(ownerUserId));
  return row?.name;
}

export async function updateSelfName(ownerUserId: string, name: string) {
  const [row] = await db
    .update(profiles)
    .set({ name })
    .where(isSelfOf(ownerUserId))
    .returning({ name: profiles.name });
  return row?.name;
}

export async function listStoragePathsByOwner(ownerUserId: string) {
  const rows = await db
    .select({ storagePath: reportFiles.storagePath })
    .from(reportFiles)
    .where(inArray(reportFiles.reportId, ownedReportIds(ownerUserId)));
  return rows.map((row) => row.storagePath);
}

export async function listFilesByOwner(ownerUserId: string) {
  return db
    .select({
      reportId: reportFiles.reportId,
      path: reportFiles.storagePath,
      name: reportFiles.name,
    })
    .from(reportFiles)
    .where(inArray(reportFiles.reportId, ownedReportIds(ownerUserId)))
    .orderBy(asc(reportFiles.reportId), asc(reportFiles.pageIndex));
}

/**
 * Deletes the owner's jobs and profiles, and writes one deletion log row with the counts.
 *
 * @remarks
 * Reports, files, markers and follow-ups go with their profile through `on delete cascade`; jobs have no foreign key.
 * Jobs also match by report id, because an API older than migration 0031 queues a job with no user id.
 * Assistant questions stay with their text wiped, because their token counts are this month's Claude spend.
 */
export async function deleteAllByOwner(
  ownerUserId: string,
  log: { userIdHash: string; files: number },
) {
  await db.transaction(async (tx) => {
    const [profileCount] = await tx
      .select({ total: count() })
      .from(profiles)
      .where(eq(profiles.ownerUserId, ownerUserId));
    const owned = await tx
      .select({ id: reports.id })
      .from(reports)
      .where(inArray(reports.profileId, ownedProfileIds(ownerUserId)));
    const ids = owned.map((row) => row.id);
    const [questionCount] = await tx
      .select({ total: count() })
      .from(assistantQuestions)
      .where(eq(assistantQuestions.userId, ownerUserId));
    const [consentCount] = await tx
      .select({ total: count() })
      .from(consentRecords)
      .where(eq(consentRecords.userId, ownerUserId));
    await tx
      .delete(jobs)
      .where(
        or(
          eq(jobs.userId, ownerUserId),
          ids.length > 0 ? inArray(sql`${jobs.payload}->>'reportId'`, ids) : undefined,
        ),
      );
    await tx.delete(profiles).where(eq(profiles.ownerUserId, ownerUserId));
    await tx.delete(consentRecords).where(eq(consentRecords.userId, ownerUserId));
    await tx
      .update(assistantQuestions)
      .set(clearedQuestion)
      .where(and(eq(assistantQuestions.userId, ownerUserId), isNull(assistantQuestions.clearedAt)));
    await tx.insert(deletionLog).values({
      userIdHash: log.userIdHash,
      scope: "account",
      counts: {
        profiles: profileCount?.total ?? 0,
        reports: ids.length,
        files: log.files,
        questions: questionCount?.total ?? 0,
        consents: consentCount?.total ?? 0,
      },
    });
  });
}

export async function exportByOwner(ownerUserId: string) {
  const [profileRows, reportRows, markerRows, questionRows, consentRows] = await Promise.all([
    db.select().from(profiles).where(eq(profiles.ownerUserId, ownerUserId)),
    db
      .select()
      .from(reports)
      .where(inArray(reports.profileId, ownedProfileIds(ownerUserId))),
    db
      .select()
      .from(reportMarkers)
      .where(inArray(reportMarkers.reportId, ownedReportIds(ownerUserId))),
    db
      .select({
        id: assistantQuestions.id,
        profileId: assistantQuestions.profileId,
        focusReportId: assistantQuestions.focusReportId,
        question: assistantQuestions.question,
        answer: assistantQuestions.answer,
        refusalKind: assistantQuestions.refusalKind,
        flaggedAt: assistantQuestions.flaggedAt,
        createdAt: assistantQuestions.createdAt,
      })
      .from(assistantQuestions)
      .where(and(eq(assistantQuestions.userId, ownerUserId), isNull(assistantQuestions.clearedAt))),
    db
      .select({
        kind: consentRecords.kind,
        policyVersion: consentRecords.policyVersion,
        acceptedAt: consentRecords.acceptedAt,
        withdrawnAt: consentRecords.withdrawnAt,
        userAgentHash: consentRecords.userAgentHash,
      })
      .from(consentRecords)
      .where(eq(consentRecords.userId, ownerUserId))
      .orderBy(asc(consentRecords.acceptedAt)),
  ]);
  return {
    profiles: profileRows,
    reports: reportRows,
    markers: markerRows,
    questions: questionRows,
    consents: consentRows,
  };
}
