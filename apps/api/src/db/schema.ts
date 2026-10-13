import type { PatternMatch } from "@mediwise/engine";
import {
  ancestries,
  type Narrative,
  pageClasses,
  relations,
  reportStatuses,
  reportLinkKinds,
  reportLinkStates,
  findingKinds,
  findingSeverities,
  sexes,
  studyKinds,
} from "@mediwise/shared";
import { sql } from "drizzle-orm";
import type { ReportUsage } from "../modules/extraction/index.js";
import {
  boolean,
  check,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const reportStatus = pgEnum("report_status", reportStatuses);
export const sourceKind = pgEnum("source_kind", ["pdf", "photos"]);
export const tier = pgEnum("tier", ["apex", "platinum", "gold", "silver", "bronze"]);
export const markerStatus = pgEnum("marker_status", ["optimal", "watch", "risk"]);
export const followUpKind = pgEnum("follow_up_kind", ["retest", "supplement", "measure"]);
export const jobStatus = pgEnum("job_status", [
  "queued",
  "running",
  "paused_budget",
  "done",
  "failed",
]);
export const creditReason = pgEnum("credit_reason", ["grant", "upload", "refund", "purchase"]);
export const paymentOrderStatus = pgEnum("payment_order_status", ["created", "paid", "refunded"]);

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const profiles = pgTable(
  "profiles",
  {
    id: uuid().primaryKey().defaultRandom(),
    ownerUserId: text("owner_user_id").notNull(),
    name: text().notNull(),
    relation: text({ enum: relations }).notNull(),
    dateOfBirth: date("date_of_birth"),
    dateOfBirthApproximate: boolean("date_of_birth_approximate").notNull().default(false),
    sex: text({ enum: sexes }),
    ancestry: text({ enum: ancestries }).notNull(),
    isSelf: boolean("is_self").notNull().default(false),
    permissionConfirmedAt: timestamp("permission_confirmed_at", { withTimezone: true }),
    guardianConfirmedAt: timestamp("guardian_confirmed_at", { withTimezone: true }),
    yearReviewIntro: jsonb("year_review_intro").$type<{
      hash: string;
      sentences: string[] | null;
    }>(),
    episodeProposalDismissedOn: date("episode_proposal_dismissed_on"),
    createdAt: createdAt(),
  },
  (t) => [
    index("profiles_owner_user_id_idx").on(t.ownerUserId),
    uniqueIndex("profiles_one_self_per_owner_idx")
      .on(t.ownerUserId)
      .where(sql`${t.isSelf}`),
  ],
);

/**
 * One upload of a profile: lab panels and studies, which can come from several labs.
 *
 * @remarks
 * `lab_name` is the lab of the lab panel pages. A study and a marker take the lab of their own file, so `title` never
 * names a lab. `title_edited` keeps a re-read from replacing a title the user wrote.
 */
export const reports = pgTable(
  "reports",
  {
    id: uuid().primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    status: reportStatus().notNull().default("queued"),
    labName: text("lab_name"),
    title: text(),
    titleEdited: boolean("title_edited").notNull().default(false),
    collectedAt: date("collected_at"),
    reportedAt: date("reported_at"),
    sourceKind: sourceKind("source_kind").notNull(),
    score: integer(),
    tier: tier(),
    coverage: integer(),
    verdict: text(),
    patterns: jsonb().$type<PatternMatch[]>(),
    doctorQuestions: jsonb("doctor_questions").$type<string[]>(),
    narrative: jsonb().$type<Narrative>(),
    narrativeStatus: text("narrative_status", { enum: ["done", "failed"] }),
    translations: jsonb().$type<{
      hi?: { status: "done" | "failed"; text: Record<string, string> };
    }>(),
    note: text(),
    episodeId: uuid("episode_id").references(() => episodes.id, { onDelete: "set null" }),
    error: text(),
    createdAt: createdAt(),
  },
  (t) => [
    index("reports_profile_id_idx").on(t.profileId),
    index("reports_episode_id_idx").on(t.episodeId),
    check("reports_title_length", sql`char_length(${t.title}) <= 60`),
  ],
);

/**
 * A diagnostic workup of one profile: reports that belong together, from the day it started to the day it ended or open.
 *
 * @remarks
 * A report points at its episode, so it belongs to one episode at most. `summary` caches the Claude paragraph by the hash
 * of its input, the same way `profiles.year_review_intro` does.
 */
export const episodes = pgTable(
  "episodes",
  {
    id: uuid().primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    name: text().notNull(),
    startedOn: date("started_on").notNull(),
    endedOn: date("ended_on"),
    note: text(),
    summary: jsonb().$type<{ hash: string; sentences: string[] | null }>(),
    createdAt: createdAt(),
  },
  (t) => [
    index("episodes_profile_id_idx").on(t.profileId),
    check("episodes_note_length", sql`char_length(${t.note}) <= 200`),
    check("episodes_dates", sql`${t.endedOn} is null or ${t.endedOn} >= ${t.startedOn}`),
  ],
);

/**
 * One uploaded file of a report.
 *
 * @remarks
 * `page_classes` holds one class per page as uploaded. Identity pages are cut from the stored file, so stored page n is the
 * n-th entry that is not `identity_document`. A file with a `skip_reason` has no object in storage. `lab_name` is the lab
 * printed on the letterhead of this file.
 */
export const reportFiles = pgTable(
  "report_files",
  {
    id: uuid().primaryKey().defaultRandom(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    storagePath: text("storage_path").notNull(),
    mime: text().notNull(),
    size: integer().notNull(),
    pageIndex: integer("page_index").notNull().default(0),
    name: text(),
    sha256: text(),
    pageClasses: text("page_classes", { enum: pageClasses }).array(),
    skipReason: text("skip_reason", { enum: ["duplicate", "identity"] }),
    labName: text("lab_name"),
  },
  (t) => [index("report_files_sha256_idx").on(t.sha256)],
);

export const reportMarkers = pgTable(
  "report_markers",
  {
    id: uuid().primaryKey().defaultRandom(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    markerKey: text("marker_key"),
    rawName: text("raw_name").notNull(),
    value: doublePrecision(),
    valueText: text("value_text"),
    unit: text(),
    labRangeLow: doublePrecision("lab_range_low"),
    labRangeHigh: doublePrecision("lab_range_high"),
    status: markerStatus(),
    calibratedLow: doublePrecision("calibrated_low"),
    calibratedHigh: doublePrecision("calibrated_high"),
    note: text(),
    derived: boolean().notNull().default(false),
    reportFileId: uuid("report_file_id").references(() => reportFiles.id, {
      onDelete: "set null",
    }),
  },
  (t) => [index("report_markers_report_id_idx").on(t.reportId)],
);

/**
 * One study in a report: an imaging report, an ECG printout, an examination form or a pathology report, as printed.
 *
 * @remarks
 * `page_index` is the page in the file as uploaded, the same index as `report_files.page_classes`. `film_file_id` is a raw
 * image of the same report that sits with this study. MediWise never reads the film itself.
 */
export const studies = pgTable(
  "studies",
  {
    id: uuid().primaryKey().defaultRandom(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    kind: text({ enum: studyKinds }).notNull(),
    bodyRegion: text("body_region"),
    findingsText: text("findings_text"),
    impressionText: text("impression_text"),
    familyHistory: text("family_history"),
    specimen: text(),
    adequacy: text(),
    resultText: text("result_text"),
    performedAt: date("performed_at"),
    signedBy: text("signed_by"),
    reportFileId: uuid("report_file_id")
      .notNull()
      .references(() => reportFiles.id, { onDelete: "cascade" }),
    pageIndex: integer("page_index").notNull(),
    filmFileId: uuid("film_file_id").references(() => reportFiles.id, { onDelete: "set null" }),
  },
  (t) => [index("studies_report_id_idx").on(t.reportId)],
);

export const studyMeasurements = pgTable(
  "study_measurements",
  {
    id: uuid().primaryKey().defaultRandom(),
    studyId: uuid("study_id")
      .notNull()
      .references(() => studies.id, { onDelete: "cascade" }),
    key: text().notNull(),
    value: doublePrecision(),
    valueText: text("value_text"),
    unit: text(),
    printedRange: text("printed_range"),
    status: markerStatus(),
  },
  (t) => [index("study_measurements_study_id_idx").on(t.studyId)],
);

/** One finding of a report: a change since the previous visit, a link between a study and markers, or a single result. */
export const findings = pgTable(
  "findings",
  {
    id: uuid().primaryKey().defaultRandom(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    kind: text({ enum: findingKinds }).notNull(),
    severity: text({ enum: findingSeverities }).notNull(),
    title: text().notNull(),
    body: text().notNull(),
    citedKeys: text("cited_keys").array().notNull(),
    citedStudyIds: uuid("cited_study_ids").array().notNull(),
    rank: integer().notNull(),
  },
  (t) => [index("findings_report_id_idx").on(t.reportId)],
);

/**
 * One report that repeats an earlier report of the same profile, or gives a second opinion on it.
 *
 * @remarks
 * The detector writes a `proposed` row and the user confirms or dismisses it. Only a dismissed row stops a later report from
 * settling an alert of the earlier one.
 */
export const reportLinks = pgTable(
  "report_links",
  {
    id: uuid().primaryKey().defaultRandom(),
    earlierReportId: uuid("earlier_report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    laterReportId: uuid("later_report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    kind: text({ enum: reportLinkKinds }).notNull(),
    createdBy: text("created_by", { enum: ["user", "detector"] }).notNull(),
    state: text({ enum: reportLinkStates }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("report_links_pair_idx").on(t.earlierReportId, t.laterReportId),
    check("report_links_two_reports", sql`${t.earlierReportId} <> ${t.laterReportId}`),
    index("report_links_later_report_id_idx").on(t.laterReportId),
  ],
);

export const followUps = pgTable("follow_ups", {
  id: uuid().primaryKey().defaultRandom(),
  reportId: uuid("report_id")
    .notNull()
    .references(() => reports.id, { onDelete: "cascade" }),
  kind: followUpKind().notNull(),
  markerKey: text("marker_key"),
  title: text().notNull(),
  why: text().notNull(),
  nextAction: text("next_action").notNull(),
  rank: integer().notNull(),
});

export const jobs = pgTable(
  "jobs",
  {
    id: uuid().primaryKey().defaultRandom(),
    kind: text().notNull(),
    payload: jsonb().notNull(),
    status: jobStatus().notNull().default("queued"),
    attempts: integer().notNull().default(0),
    error: text(),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    usage: jsonb().$type<ReportUsage>(),
    runAfter: timestamp("run_after", { withTimezone: true }).notNull().defaultNow(),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("jobs_status_idx").on(t.status)],
);

export const paymentOrders = pgTable(
  "payment_orders",
  {
    id: uuid().primaryKey(),
    userId: text("user_id").notNull(),
    packId: text("pack_id").notNull(),
    credits: integer().notNull(),
    amount: integer().notNull(),
    providerPaymentId: text("provider_payment_id").unique(),
    status: paymentOrderStatus().notNull().default("created"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("payment_orders_user_id_idx").on(t.userId)],
);

/**
 * Every change to a user's report credits. The balance is the sum of `delta`.
 *
 * @remarks
 * `payment_ref` holds the provider's payment id on a purchase row and its refund id on a refund row, unique, so a refund
 * debits once. A payment order has at most one purchase row, so one order credits once even when two webhooks name it.
 */
export const creditsLedger = pgTable(
  "credits_ledger",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    delta: integer().notNull(),
    reason: creditReason().notNull(),
    reportId: uuid("report_id"),
    paymentOrderId: uuid("payment_order_id").references(() => paymentOrders.id),
    paymentRef: text("payment_ref").unique(),
    note: text(),
    createdAt: createdAt(),
  },
  (t) => [
    index("credits_ledger_user_id_idx").on(t.userId),
    index("credits_ledger_report_id_idx").on(t.reportId),
    uniqueIndex("credits_ledger_one_purchase_per_order_idx")
      .on(t.paymentOrderId)
      .where(sql`${t.reason} = 'purchase'`),
  ],
);

export const markerAliasSuggestions = pgTable("marker_alias_suggestions", {
  id: uuid().primaryKey().defaultRandom(),
  reportMarkerId: uuid("report_marker_id")
    .notNull()
    .references(() => reportMarkers.id, { onDelete: "cascade" }),
  rawName: text("raw_name").notNull(),
  unit: text(),
  suggestedMarkerKey: text("suggested_marker_key"),
  createdAt: createdAt(),
});

/**
 * A read-only link to one report's doctor export.
 *
 * @remarks
 * Only the SHA-256 of the token is stored, so a copy of this table cannot open a link.
 */
export const reportShares = pgTable(
  "report_shares",
  {
    id: uuid().primaryKey().defaultRandom(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    ownerUserId: text("owner_user_id").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("report_shares_report_id_idx").on(t.reportId)],
);

export const reportShareOpens = pgTable(
  "report_share_opens",
  {
    id: uuid().primaryKey().defaultRandom(),
    shareId: uuid("share_id")
      .notNull()
      .references(() => reportShares.id, { onDelete: "cascade" }),
    openedAt: timestamp("opened_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("report_share_opens_share_id_idx").on(t.shareId)],
);

export type DeletionCounts = { profiles: number; reports: number; files: number };

/**
 * One row per account deletion, kept after the user's data is gone.
 *
 * @remarks
 * Holds only the SHA-256 of the user id, so the row names no person. Nothing deletes these rows, which keeps each for at least one year.
 */
export const deletionLog = pgTable("deletion_log", {
  id: uuid().primaryKey().defaultRandom(),
  userIdHash: text("user_id_hash").notNull(),
  scope: text({ enum: ["account"] }).notNull(),
  counts: jsonb().$type<DeletionCounts>().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }).notNull().defaultNow(),
});
