import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { expect, test } from "vitest";
import { db } from "../../db/client.js";
import { findings, profiles, reportFiles, reports } from "../../db/schema.js";
import { cipherFor } from "../../lib/user-keys.js";
import { listFindings } from "../findings/index.js";
import {
  findReportById,
  findReportInsights,
  insertDraftReport,
  listReportFiles,
  listReportsByProfile,
  saveReportResult,
  saveTranslation,
  updateReportNote,
  updateReportStatus,
  updateReportTitle,
} from "./reports.repo.js";

const v1 = /^v1:/;

async function draft() {
  const userId = randomUUID();
  const [profile] = await db
    .insert(profiles)
    .values({
      ownerUserId: userId,
      name: (await cipherFor(userId)).encrypt("Asha"),
      relation: "self",
      ancestry: "unknown",
    })
    .returning({ id: profiles.id });
  const id = randomUUID();
  await insertDraftReport(
    userId,
    { id, profileId: profile!.id, sourceKind: "pdf" },
    [
      {
        storagePath: `${userId}/${id}/0.pdf`,
        mime: "application/pdf",
        size: 1,
        pageIndex: 0,
        name: "asha-cbc.pdf",
      },
    ],
    () => {},
  );
  return { userId, profileId: profile!.id, id };
}

const rawReport = async (id: string) =>
  (await db.select().from(reports).where(eq(reports.id, id)))[0]!;

test("a draft stores its file names as v1: strings and lists them as uploaded", async () => {
  const { id } = await draft();

  const [raw] = await db
    .select({ name: reportFiles.name })
    .from(reportFiles)
    .where(eq(reportFiles.reportId, id));
  expect(raw!.name).toMatch(v1);
  expect((await listReportFiles(id)).map(({ name }) => name)).toEqual(["asha-cbc.pdf"]);
});

test("a note and a title the user writes are stored encrypted and read back typed", async () => {
  const { userId, profileId, id } = await draft();

  expect(await updateReportNote(userId, id, "Fasted 12 hours")).toEqual({
    note: "Fasted 12 hours",
  });
  expect(await updateReportTitle(userId, id, "March blood test", true)).toEqual({
    title: "March blood test",
    titleEdited: true,
  });

  const raw = await rawReport(id);
  expect(raw.note).toMatch(v1);
  expect(raw.title).toMatch(v1);
  expect(await findReportById(userId, id)).toMatchObject({
    title: "March blood test",
    note: "Fasted 12 hours",
  });
  await db.update(reports).set({ status: "queued" }).where(eq(reports.id, id));
  const [listed] = await listReportsByProfile(userId, profileId, 10);
  expect(listed).toMatchObject({ title: "March blood test", fileNames: ["asha-cbc.pdf"] });
});

test("a worker result stores title, narrative, doctor questions and findings encrypted and keeps a user title", async () => {
  const { userId, id } = await draft();
  await updateReportTitle(userId, id, "My own title", true);

  await saveReportResult(
    id,
    {
      title: "Blood panel, 1 March 2025",
      doctorQuestions: ["Should I retest my HbA1c?"],
      narrative: { summary: "Most values sit in range." } as never,
      narrativeStatus: "done",
    },
    [],
    [],
    [],
    [],
    [
      {
        reportId: id,
        kind: "risk",
        severity: "watch",
        title: "HbA1c is near the line",
        body: "Your HbA1c is 5.9 %.",
        citedKeys: ["hba1c"],
        citedStudyIds: [],
        rank: 1,
      },
    ],
  );

  const raw = await rawReport(id);
  for (const column of [raw.title, raw.narrative, raw.doctorQuestions]) expect(column).toMatch(v1);
  const [finding] = await db.select().from(findings).where(eq(findings.reportId, id));
  expect(finding!.title).toMatch(v1);
  expect(finding!.body).toMatch(v1);

  expect((await findReportById(userId, id))?.title).toBe("My own title");
  expect(await findReportInsights(id)).toMatchObject({
    doctorQuestions: ["Should I retest my HbA1c?"],
    narrative: { summary: "Most values sit in range." },
    translations: null,
  });
  expect(await listFindings(id)).toMatchObject([
    { title: "HbA1c is near the line", body: "Your HbA1c is 5.9 %." },
  ]);
});

test("a failed status error and a translation are stored encrypted", async () => {
  const { userId, id } = await draft();

  await updateReportStatus(id, "failed", "We could not read this report.");
  await saveTranslation(id, { hi: { status: "done", text: { a: "नमस्ते" } } }, {} as never);

  const raw = await rawReport(id);
  expect(raw.error).toMatch(v1);
  expect(raw.translations).toMatch(v1);
  expect((await findReportById(userId, id))?.error).toBe("We could not read this report.");
  expect((await findReportInsights(id))?.translations).toEqual({
    hi: { status: "done", text: { a: "नमस्ते" } },
  });
});
