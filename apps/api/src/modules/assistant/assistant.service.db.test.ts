import { randomUUID } from "node:crypto";
import type Anthropic from "@anthropic-ai/sdk";
import type { AssistantCite } from "@mediwise/shared";
import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, expect, test, vi } from "vitest";
import { db } from "../../db/client.js";
import * as schema from "../../db/schema.js";
import { cipherFor } from "../../db/user-keys.js";

const edge = vi.hoisted(() => ({ create: vi.fn(), overBudget: false }));
vi.mock("../../lib/anthropic.js", () => ({ anthropic: { messages: { create: edge.create } } }));
vi.mock("../spend/index.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../spend/index.js")>()),
  isOverBudget: async () => edge.overBudget,
}));

const { askQuestion, clearQuestions, flagQuestion, listQuestions, loadReviewDay, storeReview } =
  await import("./assistant.service.js");
const { getQuestionsLeft } = await import("../credits/index.js");
const { giveConsents } = await import("../consents/index.js");
const { env } = await import("../../config/env.js");

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

/** Gives an account question packs in the ledger, with a grant that keeps the balance at `freeCredits`. */
async function givePacks(owner: string, packs: number, freeCredits = 0) {
  await db.insert(schema.creditsLedger).values([
    { userId: owner, delta: packs + freeCredits, reason: "grant" as const },
    ...Array.from({ length: packs }, () => ({
      userId: owner,
      delta: -1,
      reason: "questions" as const,
      note: "20 questions",
    })),
  ]);
}

/** Makes an account with one profile and one done report, and the given packs and free credits. */
async function newAsker(packs: number, freeCredits = 0) {
  const owner = randomUUID();
  const profile = await insertProfile(owner, "Asker");
  const report = await insertReport(profile, 5.9, {});
  await givePacks(owner, packs, freeCredits);
  return { owner, profile, report };
}

/** Spends questions with stored charged rows, so a test can start with few left. */
async function spendQuestions(owner: string, profile: string, count: number, charged = true) {
  await db.insert(schema.assistantQuestions).values(
    Array.from({ length: count }, () => ({
      userId: owner,
      profileId: profile,
      question: "Earlier?",
      answer: JSON.stringify({ sentences: [] }),
      charged,
    })),
  );
}

let minute = 0;

beforeAll(async () => {
  profileId = await insertProfile(userId, `${marker}-profile-name`);
  await givePacks(userId, 10);
  await givePacks(otherUserId, 10);
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
  edge.overBudget = false;
  minute += 1;
  vi.spyOn(Date, "now").mockReturnValue(Date.UTC(2026, 9, 14) + minute * 61_000);
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

test("the stored answer holds report ids, the focus report, the model and charged true", async () => {
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
    charged: true,
    flaggedAt: null,
    question: expect.stringMatching(/^v1:/),
    answer: expect.stringMatching(/^v1:/),
  });
  const cipher = await cipherFor(userId);
  expect(cipher.decrypt(row!.question)).toBe("What was my HbA1c?");
  expect(cipher.decryptJson(row!.answer)).toEqual({
    sentences: [
      {
        text: "Your HbA1c was 5.9 % on 4 Aug 2026.",
        cites: [{ kind: "value", reportId, target: "hba1c" }],
      },
    ],
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

test("a deleted focus report keeps the question", async () => {
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
});

test("a cited answer costs one question", async () => {
  const { owner, profile } = await newAsker(1);
  edge.create.mockResolvedValue(answer(good));
  await askQuestion(owner, profile, { question: "What was my HbA1c?" });
  expect(await getQuestionsLeft(owner)).toBe(19);
});

test("a worry answer with a cited fact costs one question", async () => {
  const { owner, profile } = await newAsker(1);
  edge.create.mockResolvedValue(answer({ ...good, kind: "refuse", refuseKind: "worry" }));
  const item = await askQuestion(owner, profile, { question: "Is my HbA1c bad?" });
  expect(item.refusalKind).toBe("worry");
  expect(await getQuestionsLeft(owner)).toBe(19);
});

test("a fallback answer leaves questions left unchanged", async () => {
  const { owner, profile } = await newAsker(1);
  const wrong = {
    kind: "answer",
    sentences: [{ text: "Your HbA1c was 9.9 %.", cites: ["R1:hba1c"] }],
  };
  edge.create.mockResolvedValue(answer(wrong));
  const item = await askQuestion(owner, profile, { question: "What was my HbA1c?" });
  expect(item.refusalKind).toBe("fallback");
  expect(await getQuestionsLeft(owner)).toBe(20);
});

test("an API error leaves questions left unchanged", async () => {
  const { owner, profile } = await newAsker(1);
  edge.create.mockRejectedValueOnce(new Error("connection reset"));
  expect((await askQuestion(owner, profile, { question: "What was my HbA1c?" })).refusalKind).toBe(
    "fallback",
  );
  expect(await getQuestionsLeft(owner)).toBe(20);
});

test("a refusal without facts leaves questions left unchanged", async () => {
  const { owner, profile } = await newAsker(1);
  edge.create.mockResolvedValue(
    answer({ kind: "refuse", refuseKind: "diagnosis", sentences: [good.sentences[0]] }),
  );
  expect((await askQuestion(owner, profile, { question: "Do I have diabetes?" })).refusalKind).toBe(
    "diagnosis",
  );
  expect(await getQuestionsLeft(owner)).toBe(20);
});

test("with no question left and a free credit the question is refused with 402 and the use-1-credit copy before any Claude call", async () => {
  const { owner, profile } = await newAsker(1, 1);
  await spendQuestions(owner, profile, 20);
  await expect(
    askQuestion(owner, profile, { question: "What was my HbA1c?" }),
  ).rejects.toMatchObject({
    status: 402,
    message: "You have no questions left. Use 1 credit to get 20 more questions.",
  });
  expect(edge.create).not.toHaveBeenCalled();
});

test("an emergency question gets its copy with no question left, at the daily cap and over the monthly cap", async () => {
  const { owner, profile } = await newAsker(0);
  await spendQuestions(owner, profile, 30, false);
  edge.overBudget = true;
  const item = await askQuestion(owner, profile, { question: "I have chest pain right now" });
  expect(item.refusalKind).toBe("emergency");
  expect(item.copy).toContain("112");
  expect(edge.create).not.toHaveBeenCalled();
});

test("the 31st question in 24 hours answers 429 with the daily copy before any Claude call", async () => {
  const { owner, profile } = await newAsker(5);
  await spendQuestions(owner, profile, 30, false);
  await expect(
    askQuestion(owner, profile, { question: "What was my HbA1c?" }),
  ).rejects.toMatchObject({
    status: 429,
    message: "You can ask 30 questions in one day. Try again tomorrow.",
  });
  expect(edge.create).not.toHaveBeenCalled();
});

test("the 7th question in one minute answers 429 with the minute copy", async () => {
  const { owner, profile } = await newAsker(1);
  edge.create.mockResolvedValue(answer(good));
  for (let i = 0; i < 6; i++) await askQuestion(owner, profile, { question: `Question ${i}?` });
  edge.create.mockClear();
  await expect(askQuestion(owner, profile, { question: "One more?" })).rejects.toMatchObject({
    status: 429,
    message: "You can ask 6 questions in one minute. Try again later.",
  });
  expect(edge.create).not.toHaveBeenCalled();
});

test("over the monthly cap a question answers 503 with the unavailable copy", async () => {
  const { owner, profile } = await newAsker(1);
  edge.overBudget = true;
  await expect(
    askQuestion(owner, profile, { question: "What was my HbA1c?" }),
  ).rejects.toMatchObject({
    status: 503,
    message: "The assistant is not available now. Try again later.",
  });
  expect(edge.create).not.toHaveBeenCalled();
});

test("two parallel cited answers with 1 question left charge exactly one", async () => {
  const { owner, profile } = await newAsker(1);
  await spendQuestions(owner, profile, 19);
  edge.create.mockResolvedValue(answer(good));
  await Promise.all([
    askQuestion(owner, profile, { question: "First?" }),
    askQuestion(owner, profile, { question: "Second?" }),
  ]);
  expect(await getQuestionsLeft(owner)).toBe(0);
  const cipher = await cipherFor(owner);
  const rows = await db
    .select({
      charged: schema.assistantQuestions.charged,
      question: schema.assistantQuestions.question,
    })
    .from(schema.assistantQuestions)
    .where(eq(schema.assistantQuestions.userId, owner));
  const asked = rows.filter(({ question }) =>
    ["First?", "Second?"].includes(cipher.decrypt(question) ?? ""),
  );
  expect(asked.map(({ charged }) => charged).toSorted()).toEqual([false, true]);
});

test("clear chat keeps questions left and the daily count, and a cleared question is never flagged or sent again", async () => {
  const { owner, profile } = await newAsker(1);
  await spendQuestions(owner, profile, 29, false);
  edge.create.mockResolvedValue(answer(good));
  const item = await askQuestion(owner, profile, { question: "What was my ZORBELQ value?" });
  const left = await getQuestionsLeft(owner);

  await clearQuestions(owner, profile);
  expect(await listQuestions(owner, profile)).toHaveLength(0);
  expect(await getQuestionsLeft(owner)).toBe(left);
  await expect(flagQuestion(owner, item.id)).rejects.toMatchObject({ status: 404 });
  await expect(askQuestion(owner, profile, { question: "Again?" })).rejects.toMatchObject({
    status: 429,
  });
});

test("a cleared question is not sent as chat history", async () => {
  const { owner, profile } = await newAsker(1);
  edge.create.mockResolvedValue(answer(good));
  await askQuestion(owner, profile, { question: "What was my ZORBELQ value?" });
  await clearQuestions(owner, profile);
  edge.create.mockClear();
  await askQuestion(owner, profile, { question: "What was my HbA1c?" });
  expect(JSON.stringify(edge.create.mock.calls)).not.toContain("ZORBELQ");
});

test("a parallel burst of 8 questions makes at most 6 Claude calls", async () => {
  const { owner, profile } = await newAsker(1);
  edge.create.mockResolvedValue(answer(good));
  const results = await Promise.allSettled(
    Array.from({ length: 8 }, (_, i) => askQuestion(owner, profile, { question: `Burst ${i}?` })),
  );
  const refused = results.filter((result) => result.status === "rejected");
  expect(refused).toHaveLength(2);
  for (const result of refused) expect(result.reason).toMatchObject({ status: 429 });
  expect(edge.create).toHaveBeenCalledTimes(6);
});

test("a profile deleted while Claude answers keeps the question's usage in a row without text", async () => {
  const { owner, profile } = await newAsker(1);
  edge.create.mockImplementation(async () => {
    await db.delete(schema.profiles).where(eq(schema.profiles.id, profile));
    return answer(good);
  });
  await expect(
    askQuestion(owner, profile, { question: "What was my ZORBELQ value?" }),
  ).rejects.toMatchObject({
    status: 404,
  });
  const rows = await db
    .select()
    .from(schema.assistantQuestions)
    .where(eq(schema.assistantQuestions.userId, owner));
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ question: null, answer: null, profileId: null, charged: false });
  expect(rows[0]!.usage).not.toBeNull();
  expect(rows[0]!.clearedAt).not.toBeNull();
});

test("a question refused 7 times in a minute for no quota stays a 402, never a 429", async () => {
  const { owner, profile } = await newAsker(0);
  for (let i = 0; i < 7; i++) {
    await expect(askQuestion(owner, profile, { question: `Try ${i}?` })).rejects.toMatchObject({
      status: 402,
    });
  }
  expect(edge.create).not.toHaveBeenCalled();
});

async function storeCited(owner: string, profile: string, cites: AssistantCite[]) {
  await db.insert(schema.assistantQuestions).values({
    userId: owner,
    profileId: profile,
    question: "Which report?",
    answer: JSON.stringify({ sentences: [{ text: "Cited.", cites }] }),
  });
}

test("an answer and the chat give each cite the name, lab and date its chip shows", async () => {
  edge.create.mockResolvedValue(answer(good));
  const item = await askQuestion(userId, profileId, { question: "What was my HbA1c?" });
  const chip = {
    kind: "value",
    reportId,
    target: "hba1c",
    label: "HbA1c",
    labName: "Sunrise Diagnostics",
    date: "2026-08-04",
    deleted: false,
  };
  expect(item.sentences[0]!.cites).toEqual([chip]);
  expect((await listQuestions(userId, profileId))[0]!.sentences[0]!.cites).toEqual([chip]);
});

test("study, finding and episode chips show the printed study, the finding title and the episode name", async () => {
  const [study] = await db
    .select({ id: schema.studies.id })
    .from(schema.studies)
    .where(eq(schema.studies.reportId, reportId));
  const [finding] = await db
    .insert(schema.findings)
    .values({
      reportId,
      kind: "risk",
      severity: "watch",
      title: "HbA1c is in the watch range",
      body: "Body.",
      citedKeys: ["hba1c"],
      citedStudyIds: [],
      rank: 1,
    })
    .returning();
  const [report] = await db
    .select({ episodeId: schema.reports.episodeId })
    .from(schema.reports)
    .where(eq(schema.reports.id, reportId));
  await storeCited(userId, profileId, [
    { kind: "study", reportId, target: study!.id },
    { kind: "finding", reportId, target: finding!.id },
    { kind: "episode", reportId: null, target: report!.episodeId },
  ]);

  const [cited] = await listQuestions(userId, profileId);
  expect(cited!.sentences[0]!.cites).toMatchObject([
    { label: "ultrasound, Abdomen", labName: "Sunrise Diagnostics", deleted: false },
    { label: "HbA1c is in the watch range", labName: "Sunrise Diagnostics", date: "2026-08-04" },
    { label: `${marker}-episode-name`, date: "2026-08-01", deleted: false },
  ]);
});

test("pattern, link and catalog chips show the pattern name, no label and the marker name, with the lab and date of the report", async () => {
  await storeCited(userId, profileId, [
    { kind: "pattern", reportId, target: "b12_deficiency" },
    { kind: "link", reportId, target: randomUUID() },
    { kind: "catalog", reportId: null, target: "hba1c" },
  ]);

  const [cited] = await listQuestions(userId, profileId);
  const shown = { labName: "Sunrise Diagnostics", date: "2026-08-04", deleted: false };
  expect(cited!.sentences[0]!.cites).toMatchObject([
    { label: "B12 deficiency pattern", ...shown },
    { label: null, ...shown },
    { label: "HbA1c", labName: null, date: null, deleted: false },
  ]);
});

test("a pattern, link or catalog cite of another account's report comes back deleted with no labels", async () => {
  await storeCited(userId, profileId, [
    { kind: "pattern", reportId: otherReportId, target: "b12_deficiency" },
    { kind: "link", reportId: otherReportId, target: reportId },
    { kind: "catalog", reportId: otherReportId, target: "hba1c" },
  ]);

  const [cited] = await listQuestions(userId, profileId);
  for (const cite of cited!.sentences[0]!.cites) {
    expect(cite).toMatchObject({ label: null, labName: null, date: null, deleted: true });
  }
});

test("a cite of a deleted report keeps its sentence and comes back deleted with no labels", async () => {
  const report = await insertReport(profileId, 6.1, {});
  await storeCited(userId, profileId, [{ kind: "value", reportId: report, target: "hba1c" }]);
  await db.delete(schema.reports).where(eq(schema.reports.id, report));

  const [cited] = await listQuestions(userId, profileId);
  expect(cited!.sentences[0]).toEqual({
    text: "Cited.",
    cites: [
      {
        kind: "value",
        reportId: report,
        target: "hba1c",
        label: null,
        labName: null,
        date: null,
        deleted: true,
      },
    ],
  });
});

test("a cite of another account's report comes back deleted and shows nothing of that report", async () => {
  await storeCited(userId, profileId, [
    { kind: "report", reportId: otherReportId, target: null },
    { kind: "value", reportId: otherReportId, target: "hba1c" },
  ]);

  const [cited] = await listQuestions(userId, profileId);
  for (const cite of cited!.sentences[0]!.cites) {
    expect(cite).toMatchObject({ label: null, labName: null, date: null, deleted: true });
  }
});

test("a cited study, finding or episode of another account comes back without its labels", async () => {
  const [otherStudy] = await db
    .select({ id: schema.studies.id })
    .from(schema.studies)
    .where(eq(schema.studies.reportId, otherReportId));
  const [otherEpisode] = await db
    .insert(schema.episodes)
    .values({ profileId: otherProfileId, name: `${marker}-other-episode`, startedOn: "2026-08-01" })
    .returning();
  await storeCited(userId, profileId, [
    { kind: "study", reportId, target: otherStudy!.id },
    { kind: "episode", reportId: null, target: otherEpisode!.id },
  ]);

  const [cited] = await listQuestions(userId, profileId);
  const [study, episode] = cited!.sentences[0]!.cites;
  expect(study).toMatchObject({ label: null, deleted: false });
  expect(episode).toMatchObject({ label: null, deleted: true });
  expect(JSON.stringify(cited)).not.toContain(`${marker}-other-episode`);
});

test("a cited finding or follow-up of another account comes back with its report title, never its own title", async () => {
  const [otherFinding] = await db
    .insert(schema.findings)
    .values({
      reportId: otherReportId,
      kind: "risk",
      severity: "risk",
      title: `${marker}-other-finding`,
      body: "Body.",
      citedKeys: [],
      citedStudyIds: [],
      rank: 1,
    })
    .returning();
  const [otherFollowUp] = await db
    .insert(schema.followUps)
    .values({
      reportId: otherReportId,
      kind: "retest",
      title: `${marker}-other-follow-up`,
      why: "Why.",
      nextAction: "Next.",
      rank: 1,
    })
    .returning();
  await storeCited(userId, profileId, [
    { kind: "finding", reportId, target: otherFinding!.id },
    { kind: "follow_up", reportId, target: otherFollowUp!.id },
  ]);

  const [cited] = await listQuestions(userId, profileId);
  expect(cited!.sentences[0]!.cites).toMatchObject([
    { labName: "Sunrise Diagnostics", deleted: false },
    { labName: "Sunrise Diagnostics", deleted: false },
  ]);
  expect(JSON.stringify(cited)).not.toContain(`${marker}-other-`);
});

test("during the review month a question without consent answers 403 and stores nothing, and consent lets it through", async () => {
  edge.create.mockResolvedValue(answer(good));
  const { owner, profile } = await newAsker(1);
  const enabled = env.ASSISTANT_ENABLED;
  env.ASSISTANT_ENABLED = true;
  env.ASSISTANT_REVIEW = true;
  try {
    await expect(
      askQuestion(owner, profile, { question: "What was my HbA1c?" }),
    ).rejects.toMatchObject({
      status: 403,
      message: "Agree to the review before you ask a question.",
    });
    expect(edge.create).not.toHaveBeenCalled();
    expect(await listQuestions(owner, profile)).toHaveLength(0);

    await giveConsents(owner, ["assistant_review"]);
    expect(
      (await askQuestion(owner, profile, { question: "What was my HbA1c?" })).refusalKind,
    ).toBeNull();

    env.ASSISTANT_REVIEW = false;
    const other = await newAsker(1);
    expect(
      (await askQuestion(other.owner, other.profile, { question: "And now?" })).refusalKind,
    ).toBeNull();
  } finally {
    env.ASSISTANT_ENABLED = enabled;
    env.ASSISTANT_REVIEW = false;
  }
});

test("the review day lists the kept questions of that UTC day from consenting accounts, with chips and cited values, and a second verdict replaces the first", async () => {
  const { owner, profile, report } = await newAsker(0);
  const stranger = await newAsker(0);
  await giveConsents(owner, ["assistant_review"]);
  const cite = { kind: "value" as const, reportId: report, target: "hba1c" };
  await db.insert(schema.assistantQuestions).values({
    userId: stranger.owner,
    profileId: stranger.profile,
    question: `${marker}-no-consent`,
    answer: JSON.stringify({ sentences: [] }),
    createdAt: new Date("2031-03-03T09:00:00Z"),
  });
  const [kept] = await db
    .insert(schema.assistantQuestions)
    .values([
      {
        userId: owner,
        profileId: profile,
        question: `${marker}-kept`,
        answer: JSON.stringify({
          sentences: [{ text: "Your HbA1c was 5.9 % on 4 Aug 2026.", cites: [cite] }],
        }),
        createdAt: new Date("2031-03-03T10:00:00Z"),
      },
      {
        userId: owner,
        profileId: profile,
        question: null,
        answer: null,
        clearedAt: new Date("2031-03-03T11:00:00Z"),
        createdAt: new Date("2031-03-03T11:00:00Z"),
      },
      {
        userId: owner,
        profileId: profile,
        question: `${marker}-other-day`,
        answer: JSON.stringify({ sentences: [] }),
        createdAt: new Date("2031-03-04T00:30:00Z"),
      },
    ])
    .returning();

  const day = await loadReviewDay("2031-03-03", () => true);
  expect(day.map(({ question }) => question)).toEqual([`${marker}-kept`]);
  expect(day[0]!.sentences[0]!.cites[0]).toMatchObject({ label: "HbA1c", deleted: false });
  expect(day[0]!.facts).toMatchObject([
    { markerKey: "hba1c", value: 5.9, unit: "%", status: "watch", calibratedHigh: 5.6 },
  ]);
  expect(JSON.stringify(day)).not.toContain(owner);

  await storeReview(kept!.id, "minor");
  await storeReview(kept!.id, "pass");
  expect((await loadReviewDay("2031-03-03", () => true))[0]!.verdict).toBe("pass");
  expect(
    await db
      .select({ verdict: schema.assistantReviews.verdict })
      .from(schema.assistantReviews)
      .where(eq(schema.assistantReviews.questionId, kept!.id)),
  ).toEqual([{ verdict: "pass" }]);
});
