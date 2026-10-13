import { randomUUID } from "node:crypto";
import type Anthropic from "@anthropic-ai/sdk";
import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, expect, test, vi } from "vitest";
import { db } from "../../db/client.js";
import * as schema from "../../db/schema.js";

const edge = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("../../lib/anthropic.js", () => ({ anthropic: { messages: { create: edge.create } } }));
vi.mock("../spend/index.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../spend/index.js")>()),
  isOverBudget: async () => false,
}));

const { askQuestion, clearQuestions, flagQuestion, listQuestions } =
  await import("./assistant.service.js");

const marker = "ZORBEL";
const userId = randomUUID();
const otherUserId = randomUUID();
let profileId: string;
let otherProfileId: string;
let reportId: string;
let otherReportId: string;

function answer(input: unknown): Anthropic.Message {
  return {
    id: "msg",
    type: "message",
    role: "assistant",
    model: "claude-haiku-5-5",
    content: [{ type: "tool_use", id: "toolu", name: "answer_question", input }],
    stop_reason: "tool_use",
    stop_sequence: null,
    usage: { input_tokens: 1, output_tokens: 1 },
  } as Anthropic.Message;
}

const good = {
  kind: "answer",
  sentences: [{ text: "Your HbA1c was 5.9 % on 4 Aug 2026.", cites: ["R1:hba1c"] }],
};

async function insertProfile(owner: string, name: string) {
  const [profile] = await db
    .insert(schema.profiles)
    .values({
      ownerUserId: owner,
      name,
      relation: "self",
      ancestry: "south_asian",
      sex: "male",
      dateOfBirth: "1901-02-03",
    })
    .returning();
  return profile!.id;
}

async function insertReport(profile: string, value: number, extra: { episodeId?: string }) {
  const [report] = await db
    .insert(schema.reports)
    .values({
      profileId: profile,
      sourceKind: "pdf",
      status: "done",
      collectedAt: "2026-08-04",
      labName: "Sunrise Diagnostics",
      score: 80,
      tier: "gold",
      coverage: 100,
      verdict: "One marker needs attention.",
      note: `${marker}-report-note`,
      ...extra,
    })
    .returning();
  const [file] = await db
    .insert(schema.reportFiles)
    .values({
      reportId: report!.id,
      storagePath: "x.pdf",
      mime: "application/pdf",
      size: 1,
      name: `${marker}-file-name.pdf`,
      labName: "Sunrise Diagnostics",
    })
    .returning();
  await db.insert(schema.reportMarkers).values({
    reportId: report!.id,
    markerKey: "hba1c",
    rawName: "HbA1c",
    value,
    unit: "%",
    status: "watch",
    calibratedLow: 4,
    calibratedHigh: 5.6,
    note: `${marker}-marker-note`,
  });
  await db.insert(schema.studies).values({
    reportId: report!.id,
    kind: "ultrasound",
    bodyRegion: "Abdomen",
    impressionText: "Liver is normal in size.",
    familyHistory: `${marker}-family-history`,
    signedBy: `${marker}-signed-by`,
    reportFileId: file!.id,
    pageIndex: 0,
  });
  return report!.id;
}

beforeAll(async () => {
  profileId = await insertProfile(userId, `${marker}-profile-name`);
  const [episode] = await db
    .insert(schema.episodes)
    .values({
      profileId,
      name: `${marker}-episode-name`,
      note: `${marker}-episode-note`,
      startedOn: "2026-08-01",
    })
    .returning();
  reportId = await insertReport(profileId, 5.9, { episodeId: episode!.id });
  const sibling = await insertProfile(userId, "Sibling");
  const [siblingEpisode] = await db
    .insert(schema.episodes)
    .values({ profileId: sibling, name: `${marker}-sibling-episode`, startedOn: "2026-08-01" })
    .returning();
  await insertReport(sibling, 777.77, { episodeId: siblingEpisode!.id });
  otherProfileId = await insertProfile(otherUserId, "Other");
  otherReportId = await insertReport(otherProfileId, 5.1, {});
});

beforeEach(async () => {
  edge.create.mockReset();
  await clearQuestions(userId, profileId);
});

test("no left-out field and no other profile reaches the Anthropic request, also with chat history", async () => {
  edge.create.mockResolvedValue(answer(good));
  await askQuestion(userId, profileId, { question: "What was my HbA1c?", reportId });
  await askQuestion(userId, profileId, { question: "And before that?", reportId });

  const sent = JSON.stringify(edge.create.mock.calls);
  expect(sent).toContain("R1:hba1c 5.9 %");
  expect(sent).toContain("Question: What was my HbA1c?");
  expect(sent).toContain("Liver is normal in size.");
  expect(sent).not.toContain(marker);
  expect(sent).not.toContain("1901");
  expect(sent).not.toContain("777.77");
});

test("the stored answer holds report ids, the focus report, the model and charged false", async () => {
  edge.create.mockResolvedValue(answer(good));
  const item = await askQuestion(userId, profileId, { question: "What was my HbA1c?", reportId });

  const [row] = await db
    .select()
    .from(schema.assistantQuestions)
    .where(eq(schema.assistantQuestions.id, item.id));
  expect(row).toMatchObject({
    userId,
    profileId,
    focusReportId: reportId,
    refusalKind: null,
    model: "claude-haiku-5-5",
    charged: false,
    flaggedAt: null,
    answer: {
      sentences: [
        {
          text: "Your HbA1c was 5.9 % on 4 Aug 2026.",
          cites: [{ kind: "value", reportId, target: "hba1c" }],
        },
      ],
    },
  });
});

test("a focus report of another profile answers 404 and stores nothing", async () => {
  await expect(
    askQuestion(userId, profileId, { question: "What was my HbA1c?", reportId: otherReportId }),
  ).rejects.toMatchObject({ status: 404 });
  expect(edge.create).not.toHaveBeenCalled();
  expect(await listQuestions(userId, profileId)).toHaveLength(0);
});

test("the chat lists only this profile, clear chat leaves other profiles, and only the owner can flag", async () => {
  edge.create.mockResolvedValue(answer(good));
  await askQuestion(userId, profileId, { question: "First?" });
  await askQuestion(userId, profileId, { question: "Second?" });
  await askQuestion(otherUserId, otherProfileId, { question: "Other?" });

  const chat = await listQuestions(userId, profileId);
  expect(chat.map(({ question }) => question)).toEqual(["Second?", "First?"]);
  await expect(listQuestions(otherUserId, profileId)).rejects.toMatchObject({ status: 404 });
  await expect(flagQuestion(otherUserId, chat[0]!.id)).rejects.toMatchObject({ status: 404 });
  expect((await flagQuestion(userId, chat[0]!.id)).flagged).toBe(true);

  await clearQuestions(userId, profileId);
  expect(await listQuestions(userId, profileId)).toHaveLength(0);
  expect(await listQuestions(otherUserId, otherProfileId)).toHaveLength(1);
});

test("a deleted focus report keeps the question, and a deleted profile takes its questions", async () => {
  edge.create.mockResolvedValue(answer(good));
  const profile = await insertProfile(userId, "Temporary");
  const report = await insertReport(profile, 5.9, {});
  const item = await askQuestion(userId, profile, {
    question: "What was my HbA1c?",
    reportId: report,
  });

  await db.delete(schema.reports).where(eq(schema.reports.id, report));
  const [kept] = await db
    .select({ focusReportId: schema.assistantQuestions.focusReportId })
    .from(schema.assistantQuestions)
    .where(eq(schema.assistantQuestions.id, item.id));
  expect(kept).toEqual({ focusReportId: null });

  await db.delete(schema.profiles).where(eq(schema.profiles.id, profile));
  const gone = await db
    .select()
    .from(schema.assistantQuestions)
    .where(eq(schema.assistantQuestions.id, item.id));
  expect(gone).toHaveLength(0);
});
