import { policyVersion } from "@mediwise/shared";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { randomUUID } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import postgres from "postgres";
import { afterAll, beforeAll, expect, inject, test, vi } from "vitest";
import * as schema from "./schema.js";

declare module "vitest" {
  export interface ProvidedContext {
    supabase: { url: string; dbUrl: string; anonKey: string; serviceRoleKey: string };
  }
}

const migrationsFolder = new URL("migrations", import.meta.url).pathname;

/**
 * Every table the migrations create and do not drop.
 *
 * @remarks
 * Read from the SQL, not from `schema.ts`, so a new table fails the fixture check below until it gets a row here.
 */
function migrationTables() {
  const sqlText = readdirSync(migrationsFolder)
    .filter((file) => file.endsWith(".sql"))
    .map((file) => readFileSync(`${migrationsFolder}/${file}`, "utf8"))
    .join("\n");
  const names = (pattern: RegExp) => [...sqlText.matchAll(pattern)].map((match) => match[1]!);
  const dropped = new Set(names(/DROP TABLE (?:IF EXISTS )?"(\w+)"/g));
  return names(/CREATE TABLE "(\w+)"/g)
    .filter((name) => !dropped.has(name))
    .toSorted();
}

const tables = migrationTables();
const local = inject("supabase");
const client = postgres(local.dbUrl, { max: 1, onnotice: () => {} });
const db = drizzle(client, { schema });
const service = createClient(local.url, local.serviceRoleKey, { auth: { persistSession: false } });
const anon = createClient(local.url, local.anonKey, { auth: { persistSession: false } });

const idOf = ([row]: { id: string }[]) => row!.id;

/** Writes one row of every table for the user and returns its id by table name. */
async function seedRows(userId: string) {
  const profile = idOf(
    await db
      .insert(schema.profiles)
      .values({ ownerUserId: userId, name: "Test", relation: "self", ancestry: "unknown" })
      .returning(),
  );
  const episode = idOf(
    await db
      .insert(schema.episodes)
      .values({ profileId: profile, name: "Test", startedOn: "2025-01-01" })
      .returning(),
  );
  const [report, later] = await db
    .insert(schema.reports)
    .values([
      { profileId: profile, sourceKind: "pdf", episodeId: episode },
      { profileId: profile, sourceKind: "pdf" },
    ])
    .returning();
  const file = idOf(
    await db
      .insert(schema.reportFiles)
      .values({ reportId: report!.id, storagePath: "test.pdf", mime: "application/pdf", size: 1 })
      .returning(),
  );
  const marker = idOf(
    await db
      .insert(schema.reportMarkers)
      .values({ reportId: report!.id, rawName: "Test" })
      .returning(),
  );
  const study = idOf(
    await db
      .insert(schema.studies)
      .values({ reportId: report!.id, kind: "other", reportFileId: file, pageIndex: 0 })
      .returning(),
  );
  const order = idOf(
    await db
      .insert(schema.paymentOrders)
      .values({ id: randomUUID(), userId, packId: "test", credits: 1, amount: 1 })
      .returning(),
  );
  const share = idOf(
    await db
      .insert(schema.reportShares)
      .values({
        reportId: report!.id,
        ownerUserId: userId,
        tokenHash: randomUUID(),
        expiresAt: new Date(Date.now() + 86_400_000),
      })
      .returning(),
  );
  const question = idOf(
    await db
      .insert(schema.assistantQuestions)
      .values({ userId, profileId: profile, question: "Test", answer: { sentences: [] } })
      .returning(),
  );
  return {
    profiles: profile,
    episodes: episode,
    reports: report!.id,
    report_files: file,
    report_markers: marker,
    studies: study,
    payment_orders: order,
    report_shares: share,
    study_measurements: idOf(
      await db.insert(schema.studyMeasurements).values({ studyId: study, key: "test" }).returning(),
    ),
    findings: idOf(
      await db
        .insert(schema.findings)
        .values({
          reportId: report!.id,
          kind: "study",
          severity: "watch",
          title: "Test",
          body: "Test",
          citedKeys: [],
          citedStudyIds: [],
          rank: 1,
        })
        .returning(),
    ),
    assistant_questions: question,
    consent_records: idOf(
      await db
        .insert(schema.consentRecords)
        .values({ userId, kind: "terms", policyVersion })
        .returning(),
    ),
    assistant_reviews: idOf(
      await db
        .insert(schema.assistantReviews)
        .values({ questionId: question, verdict: "pass" })
        .returning(),
    ),
    report_links: idOf(
      await db
        .insert(schema.reportLinks)
        .values({
          earlierReportId: report!.id,
          laterReportId: later!.id,
          kind: "repeat",
          createdBy: "user",
          state: "confirmed",
        })
        .returning(),
    ),
    follow_ups: idOf(
      await db
        .insert(schema.followUps)
        .values({
          reportId: report!.id,
          kind: "retest",
          title: "Test",
          why: "Test",
          nextAction: "Test",
          rank: 1,
        })
        .returning(),
    ),
    jobs: idOf(
      await db
        .insert(schema.jobs)
        .values({ kind: "test", payload: { reportId: report!.id }, status: "done" })
        .returning(),
    ),
    credits_ledger: idOf(
      await db
        .insert(schema.creditsLedger)
        .values({ userId, delta: 1, reason: "grant" })
        .returning(),
    ),
    marker_alias_suggestions: idOf(
      await db
        .insert(schema.markerAliasSuggestions)
        .values({ reportMarkerId: marker, rawName: "Test" })
        .returning(),
    ),
    report_share_opens: idOf(
      await db.insert(schema.reportShareOpens).values({ shareId: share }).returning(),
    ),
    deletion_log: idOf(
      await db
        .insert(schema.deletionLog)
        .values({
          userIdHash: userId,
          scope: "account",
          counts: { profiles: 0, reports: 0, files: 0 },
        })
        .returning(),
    ),
  } satisfies Record<string, string>;
}

/** Signs up a new user on the local Supabase and returns a client that sends the anon key and the user's session. */
async function signUp() {
  const { data, error } = await anon.auth.signUp({
    email: `rls-${randomUUID()}@example.com`,
    password: randomUUID(),
  });
  if (error || !data.session) throw error ?? new Error("sign up returned no session");
  await anon.auth.signOut({ scope: "local" });
  return {
    userId: data.session.user.id,
    client: createClient(local.url, local.anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
    }),
  };
}

let userA: { userId: string; client: SupabaseClient };
let rowsA: Awaited<ReturnType<typeof seedRows>>;
let rowsB: Awaited<ReturnType<typeof seedRows>>;

/**
 * Migrates the `postgres` database, the only one PostgREST serves, and waits for PostgREST to see the tables.
 *
 * @remarks
 * The migrations are the same ones `pnpm e2e` applies, and a second run is a no-op.
 */
beforeAll(async () => {
  await migrate(db, { migrationsFolder });
  await client`notify pgrst, 'reload schema'`;
  await vi.waitFor(
    async () => {
      const { error } = await service.from(tables.at(-1)!).select("id").limit(0);
      if (error) throw new Error(error.message);
    },
    { timeout: 15_000, interval: 250 },
  );
  userA = await signUp();
  const userB = await signUp();
  rowsA = await seedRows(userA.userId);
  rowsB = await seedRows(userB.userId);
}, 30_000);

afterAll(async () => {
  if (!rowsA || !rowsB) return client.end();
  const both = (table: keyof typeof rowsA) => [rowsA[table], rowsB[table]];
  await db.delete(schema.profiles).where(inArray(schema.profiles.id, both("profiles")));
  await db
    .delete(schema.creditsLedger)
    .where(inArray(schema.creditsLedger.id, both("credits_ledger")));
  await db
    .delete(schema.paymentOrders)
    .where(inArray(schema.paymentOrders.id, both("payment_orders")));
  await db.delete(schema.jobs).where(inArray(schema.jobs.id, both("jobs")));
  await db.delete(schema.deletionLog).where(inArray(schema.deletionLog.id, both("deletion_log")));
  await client.end();
});

test("the fixtures write one row to every table the migrations create", () => {
  expect(Object.keys(rowsA).toSorted()).toEqual(tables);
});

test.each(tables)(
  "%s: the anon key, with or without a session, reads, updates and deletes no row, and the service role reads both users' rows",
  async (table) => {
    const own = rowsA[table as keyof typeof rowsA];
    const other = rowsB[table as keyof typeof rowsB];
    expect(own && other, `no fixture row for ${table}`).toBeTruthy();

    for (const caller of [userA.client, anon]) {
      const read = await caller.from(table).select("id");
      expect({ error: read.error, data: read.data }).toEqual({ error: null, data: [] });
      const update = await caller.from(table).update({ id: other }).eq("id", other).select("id");
      expect({ error: update.error, data: update.data }).toEqual({ error: null, data: [] });
      const remove = await caller.from(table).delete().eq("id", other).select("id");
      expect({ error: remove.error, data: remove.data }).toEqual({ error: null, data: [] });
    }

    const { data, error } = await service.from(table).select("id").in("id", [own, other]);
    expect(error).toBeNull();
    expect(data?.map((row) => row.id).toSorted()).toEqual([own, other].toSorted());
  },
);
