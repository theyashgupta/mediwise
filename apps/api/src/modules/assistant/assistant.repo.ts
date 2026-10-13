import { and, asc, desc, eq, gt, inArray, isNull, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import {
  assistantQuestions,
  clearedQuestion,
  episodes,
  findings,
  followUps,
  profiles,
  reportFiles,
  reportLinks,
  reportMarkers,
  reports,
  studies,
  studyMeasurements,
} from "../../db/schema.js";
import { findQuestionCounts, lockUserCredits, type QuestionCounts } from "../credits/index.js";
import type { Snapshot } from "./assistant.context.js";

const visitDate = sql<string>`coalesce(${reports.collectedAt}, ${reports.createdAt}::date)::text`;

/**
 * Loads one profile's done reports as an assistant snapshot, with allowed columns only.
 *
 * @remarks
 * The select lists are the privacy boundary: no note, episode name, family history, signing doctor, profile name, date
 * of birth or file name is read, so none can reach a prompt. Age comes out of SQL, so the date of birth never leaves
 * the database.
 */
export async function findSnapshot(profileId: string): Promise<Snapshot | undefined> {
  const [person] = await db
    .select({
      ageYears: sql<number | null>`extract(year from age(${profiles.dateOfBirth}::timestamp))::int`,
      sex: profiles.sex,
      ancestry: profiles.ancestry,
    })
    .from(profiles)
    .where(eq(profiles.id, profileId));
  if (!person) return undefined;

  const reportRows = await db
    .select({
      id: reports.id,
      date: visitDate,
      createdAt: reports.createdAt,
      labName: reports.labName,
      score: reports.score,
      tier: reports.tier,
      coverage: reports.coverage,
      verdict: reports.verdict,
      patterns: reports.patterns,
      episodeId: reports.episodeId,
    })
    .from(reports)
    .where(and(eq(reports.profileId, profileId), eq(reports.status, "done")));
  const reportIds = reportRows.map(({ id }) => id);
  if (reportIds.length === 0) {
    return {
      person,
      reports: [],
      markers: [],
      studies: [],
      findings: [],
      followUps: [],
      links: [],
      episodes: [],
    };
  }

  const [markerRows, studyRows, findingRows, followUpRows, linkRows, episodeRows] =
    await Promise.all([
      db
        .select({
          reportId: reportMarkers.reportId,
          markerKey: reportMarkers.markerKey,
          rawName: reportMarkers.rawName,
          value: reportMarkers.value,
          valueText: reportMarkers.valueText,
          unit: reportMarkers.unit,
          labRangeLow: reportMarkers.labRangeLow,
          labRangeHigh: reportMarkers.labRangeHigh,
          status: reportMarkers.status,
          calibratedLow: reportMarkers.calibratedLow,
          calibratedHigh: reportMarkers.calibratedHigh,
        })
        .from(reportMarkers)
        .where(inArray(reportMarkers.reportId, reportIds))
        .orderBy(asc(reportMarkers.id)),
      db
        .select({
          id: studies.id,
          reportId: studies.reportId,
          pageIndex: studies.pageIndex,
          kind: studies.kind,
          bodyRegion: studies.bodyRegion,
          performedAt: studies.performedAt,
          labName: reportFiles.labName,
          impression: studies.impressionText,
          findingsText: studies.findingsText,
          result: studies.resultText,
        })
        .from(studies)
        .innerJoin(reportFiles, eq(reportFiles.id, studies.reportFileId))
        .where(inArray(studies.reportId, reportIds))
        .orderBy(asc(studies.reportId), asc(studies.pageIndex)),
      db
        .select({
          id: findings.id,
          reportId: findings.reportId,
          kind: findings.kind,
          severity: findings.severity,
          title: findings.title,
          body: findings.body,
          citedKeys: findings.citedKeys,
          citedStudyIds: findings.citedStudyIds,
          rank: findings.rank,
        })
        .from(findings)
        .where(inArray(findings.reportId, reportIds)),
      db
        .select({
          id: followUps.id,
          reportId: followUps.reportId,
          kind: followUps.kind,
          markerKey: followUps.markerKey,
          title: followUps.title,
          why: followUps.why,
          nextAction: followUps.nextAction,
          rank: followUps.rank,
        })
        .from(followUps)
        .where(inArray(followUps.reportId, reportIds)),
      db
        .select({
          id: reportLinks.id,
          earlierReportId: reportLinks.earlierReportId,
          laterReportId: reportLinks.laterReportId,
          kind: reportLinks.kind,
          state: reportLinks.state,
        })
        .from(reportLinks)
        .where(inArray(reportLinks.earlierReportId, reportIds)),
      db
        .select({
          id: episodes.id,
          startedOn: episodes.startedOn,
          endedOn: episodes.endedOn,
          summary: sql<string[] | null>`${episodes.summary}->'sentences'`,
        })
        .from(episodes)
        .where(eq(episodes.profileId, profileId)),
    ]);
  const studyIds = studyRows.map(({ id }) => id);
  const measurementRows =
    studyIds.length === 0
      ? []
      : await db
          .select({
            studyId: studyMeasurements.studyId,
            key: studyMeasurements.key,
            value: studyMeasurements.value,
            valueText: studyMeasurements.valueText,
            unit: studyMeasurements.unit,
            printedRange: studyMeasurements.printedRange,
            status: studyMeasurements.status,
          })
          .from(studyMeasurements)
          .where(inArray(studyMeasurements.studyId, studyIds))
          .orderBy(asc(studyMeasurements.id));

  return {
    person,
    reports: reportRows,
    markers: markerRows,
    studies: studyRows.map((study) => ({
      ...study,
      measurements: measurementRows
        .filter(({ studyId }) => studyId === study.id)
        .map(({ key, value, valueText, unit, printedRange, status }) => ({
          key,
          value,
          valueText,
          unit,
          printedRange,
          status,
        })),
    })),
    findings: findingRows,
    followUps: followUpRows,
    links: linkRows,
    episodes: episodeRows,
  };
}

const questionColumns = {
  id: assistantQuestions.id,
  question: assistantQuestions.question,
  focusReportId: assistantQuestions.focusReportId,
  answer: assistantQuestions.answer,
  refusalKind: assistantQuestions.refusalKind,
  flaggedAt: assistantQuestions.flaggedAt,
  createdAt: assistantQuestions.createdAt,
};

/** Tells whether a done report belongs to the profile. */
export async function isProfileReport(profileId: string, reportId: string) {
  const [row] = await db
    .select({ id: reports.id })
    .from(reports)
    .where(
      and(eq(reports.id, reportId), eq(reports.profileId, profileId), eq(reports.status, "done")),
    );
  return row !== undefined;
}

/**
 * Stores one question, charged when `canCharge` allows it under the account's credit lock.
 *
 * @remarks
 * The recount happens under the lock, so two parallel answers cannot both take the last question.
 */
export async function insertQuestion(
  row: Omit<typeof assistantQuestions.$inferInsert, "charged">,
  canCharge?: (counts: QuestionCounts) => boolean,
) {
  if (!canCharge) {
    const [inserted] = await db.insert(assistantQuestions).values(row).returning(questionColumns);
    return inserted!;
  }
  return db.transaction(async (tx) => {
    await lockUserCredits(tx, row.userId);
    const charged = canCharge(await findQuestionCounts(row.userId, tx));
    const [inserted] = await tx
      .insert(assistantQuestions)
      .values({ ...row, charged })
      .returning(questionColumns);
    return inserted!;
  });
}

/**
 * Stores the usage of a question whose profile is gone, without text and not charged.
 *
 * @remarks
 * The Claude call already happened, so its tokens must still reach the spend cap.
 */
export async function insertClearedQuestion(row: Parameters<typeof insertQuestion>[0]) {
  await db.insert(assistantQuestions).values({ ...row, ...clearedQuestion, profileId: null });
}

export async function countQuestionsToday(ownerUserId: string) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(assistantQuestions)
    .where(
      and(
        eq(assistantQuestions.userId, ownerUserId),
        gt(assistantQuestions.createdAt, sql`now() - interval '1 day'`),
      ),
    );
  return row?.count ?? 0;
}

export async function listQuestions(ownerUserId: string, profileId: string, limit: number) {
  return db
    .select(questionColumns)
    .from(assistantQuestions)
    .where(
      and(
        eq(assistantQuestions.userId, ownerUserId),
        eq(assistantQuestions.profileId, profileId),
        isNull(assistantQuestions.clearedAt),
      ),
    )
    .orderBy(desc(assistantQuestions.createdAt), desc(assistantQuestions.id))
    .limit(limit);
}

/** Wipes the text of a profile's questions and keeps the rows, so the quota and the spend still count them. */
export async function clearQuestions(ownerUserId: string, profileId: string) {
  await db
    .update(assistantQuestions)
    .set(clearedQuestion)
    .where(
      and(
        eq(assistantQuestions.userId, ownerUserId),
        eq(assistantQuestions.profileId, profileId),
        isNull(assistantQuestions.clearedAt),
      ),
    );
}

/** Marks one question of the owner as flagged, once, and returns it. */
export async function flagQuestion(ownerUserId: string, id: string) {
  const [row] = await db
    .update(assistantQuestions)
    .set({ flaggedAt: sql`coalesce(${assistantQuestions.flaggedAt}, now())` })
    .where(
      and(
        eq(assistantQuestions.id, id),
        eq(assistantQuestions.userId, ownerUserId),
        isNull(assistantQuestions.clearedAt),
      ),
    )
    .returning(questionColumns);
  return row;
}
