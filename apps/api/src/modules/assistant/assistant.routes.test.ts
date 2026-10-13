import type Anthropic from "@anthropic-ai/sdk";
import { Hono } from "hono";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { handleError } from "../../common/problem.js";
import type { AuthEnv } from "../../middleware/auth.js";
import type { Snapshot } from "./assistant.context.js";
import { refusalCopy, unavailableCopy } from "./assistant.copy.js";

const ids = vi.hoisted(() => ({
  profile: "5f0c6a8e-6c1a-4a39-9c43-2c1f7c3e2a10",
  bobProfile: "7b2e8c0a-8e3c-4c5b-9e65-4e3b9e5a4c32",
  report: "e1000000-0000-4000-8000-000000000001",
  otherReport: "e1000000-0000-4000-8000-000000000009",
}));

const store = vi.hoisted(() => {
  type Row = {
    id: string;
    userId: string;
    profileId: string;
    focusReportId: string | null;
    question: string;
    answer: { sentences: { text: string; cites: unknown[] }[] };
    refusalKind: string | null;
    rules?: string[];
    model?: string | null;
    costCents?: number;
    flaggedAt: Date | null;
    createdAt: Date;
  };
  const rows: Row[] = [];
  const owners: Record<string, string> = {};
  const state = { enabled: true, overCap: false, snapshot: undefined as unknown };
  const create = vi.fn();
  const pick = ({
    id,
    question,
    focusReportId,
    answer,
    refusalKind,
    flaggedAt,
    createdAt,
  }: Row) => ({
    id,
    question,
    focusReportId,
    answer,
    refusalKind,
    flaggedAt,
    createdAt,
  });
  return {
    rows,
    owners,
    state,
    create,
    repo: {
      findSnapshot: async () => state.snapshot,
      isProfileReport: async (profileId: string, reportId: string) =>
        profileId === "5f0c6a8e-6c1a-4a39-9c43-2c1f7c3e2a10" &&
        reportId === "e1000000-0000-4000-8000-000000000001",
      insertQuestion: async (
        row: Omit<Row, "id" | "flaggedAt" | "createdAt" | "refusalKind"> & {
          refusalKind?: string | null;
        },
      ) => {
        const stored = {
          ...row,
          refusalKind: row.refusalKind ?? null,
          id: `0000000${rows.length}-0000-4000-8000-000000000000`,
          flaggedAt: null,
          createdAt: new Date(Date.UTC(2026, 9, 13, 0, rows.length)),
        };
        rows.push(stored);
        return pick(stored);
      },
      listQuestions: async (userId: string, profileId: string, limit: number) =>
        rows
          .filter((row) => row.userId === userId && row.profileId === profileId)
          .toSorted((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, limit)
          .map(pick),
      deleteQuestions: async (userId: string, profileId: string) => {
        const keep = rows.filter((row) => row.userId !== userId || row.profileId !== profileId);
        rows.splice(0, rows.length, ...keep);
      },
      flagQuestion: async (userId: string, id: string) => {
        const row = rows.find((item) => item.id === id && item.userId === userId);
        if (!row) return undefined;
        row.flaggedAt ??= new Date();
        return pick(row);
      },
    },
    profilesRepo: {
      findProfileById: async (owner: string, id: string) =>
        owners[id] === owner ? { id, isSelf: true } : undefined,
    },
    spendRepo: {
      listJobsThisMonth: async () =>
        state.overCap
          ? [{ userId: "alice", status: "done", usage: null, inputTokens: 2e9, outputTokens: 0 }]
          : [],
    },
  };
});

vi.mock("./assistant.repo.js", () => store.repo);
vi.mock("../profiles/profiles.repo.js", () => store.profilesRepo);
vi.mock("../spend/spend.repo.js", () => store.spendRepo);
vi.mock("../../lib/anthropic.js", () => ({ anthropic: { messages: { create: store.create } } }));
vi.mock("../../config/env.js", async (importOriginal) => {
  const { env } = await importOriginal<typeof import("../../config/env.js")>();
  return {
    env: new Proxy(env, {
      get: (target, key) =>
        key === "ASSISTANT_ENABLED"
          ? store.state.enabled
          : (target as Record<string | symbol, unknown>)[key],
    }),
  };
});

const { profileQuestionsRoutes, questionsRoutes } = await import("./assistant.routes.js");

const app = new Hono<AuthEnv>()
  .use(async (c, next) => {
    c.set("userId", c.req.header("x-user") ?? "alice");
    await next();
  })
  .route("/profiles", profileQuestionsRoutes)
  .route("/questions", questionsRoutes);
app.onError(handleError);

const snapshot: Snapshot = {
  person: { ageYears: 40, sex: "male", ancestry: "south_asian" },
  reports: [
    {
      id: ids.report,
      date: "2026-08-04",
      createdAt: new Date("2026-08-05T00:00:00Z"),
      labName: "Sunrise Diagnostics",
      score: 81,
      tier: "gold",
      coverage: 100,
      verdict: "One marker needs attention.",
      patterns: [],
      episodeId: null,
    },
  ],
  markers: [
    {
      reportId: ids.report,
      markerKey: "hba1c",
      rawName: "HbA1c",
      value: 5.9,
      valueText: null,
      unit: "%",
      labRangeLow: 4,
      labRangeHigh: 5.6,
      status: "watch",
      calibratedLow: 4,
      calibratedHigh: 5.6,
    },
  ],
  studies: [],
  findings: [],
  followUps: [],
  links: [],
  episodes: [],
};

function toolUse(input: unknown): Anthropic.Message {
  return {
    id: "msg",
    type: "message",
    role: "assistant",
    model: "claude-haiku-5-5",
    content: [{ type: "tool_use", id: "toolu", name: "answer_question", input }],
    stop_reason: "tool_use",
    stop_sequence: null,
    usage: {
      input_tokens: 500,
      output_tokens: 100,
      cache_creation_input_tokens: 2_000,
      cache_read_input_tokens: 0,
    },
  } as Anthropic.Message;
}

const good = {
  kind: "answer",
  sentences: [{ text: "Your HbA1c was 5.9 % on 4 Aug 2026.", cites: ["R1:hba1c"] }],
};
const invented = {
  kind: "answer",
  sentences: [{ text: "Your HbA1c was 6.4 % on 4 Aug 2026.", cites: ["R1:hba1c"] }],
};

function ask(body: unknown, profile = ids.profile, user = "alice") {
  return app.request(`/profiles/${profile}/questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-user": user },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  store.rows.splice(0);
  store.create.mockReset();
  store.state.enabled = true;
  store.state.overCap = false;
  store.state.snapshot = structuredClone(snapshot);
  store.owners[ids.profile] = "alice";
  store.owners[ids.bobProfile] = "bob";
});

describe("assistant routes", () => {
  test("with ASSISTANT_ENABLED off every assistant route answers 404", async () => {
    store.state.enabled = false;
    const responses = await Promise.all([
      ask({ question: "What was my HbA1c?" }),
      app.request(`/profiles/${ids.profile}/questions`),
      app.request(`/profiles/${ids.profile}/questions`, { method: "DELETE" }),
      app.request(`/questions/${ids.report}/flag`, { method: "POST" }),
    ]);
    expect(responses.map(({ status }) => status)).toEqual([404, 404, 404, 404]);
    expect(store.create).not.toHaveBeenCalled();
  });

  test("a question over 500 characters or an empty one answers 400", async () => {
    expect((await ask({ question: "a".repeat(501) })).status).toBe(400);
    expect((await ask({ question: "   " })).status).toBe(400);
    expect(store.rows).toHaveLength(0);
  });

  test("an emergency question returns the fixed copy and makes no Claude call", async () => {
    const response = await ask({ question: "I have chest pain. Is my ECG okay?" });
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      refusalKind: "emergency",
      copy: refusalCopy.emergency,
      sentences: [],
    });
    expect(store.create).not.toHaveBeenCalled();
    expect(store.rows[0]).toMatchObject({ refusalKind: "emergency" });
  });

  test("a dose question returns the treatment copy and makes no Claude call", async () => {
    const response = await ask({ question: "What dose of vitamin D should I take?" });
    expect(await response.json()).toMatchObject({ copy: refusalCopy.treatment });
    expect(store.create).not.toHaveBeenCalled();
  });

  test("over the monthly cap the question answers 503 with the fixed copy and stores nothing", async () => {
    store.state.overCap = true;
    const response = await ask({ question: "What was my HbA1c?" });
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ title: unavailableCopy });
    expect(store.create).not.toHaveBeenCalled();
    expect(store.rows).toHaveLength(0);
  });

  test("an owner gets cited sentences, stored with report ids, model, usage, cost and charged false", async () => {
    store.create.mockResolvedValueOnce(toolUse(good));
    const response = await ask({ question: "What was my HbA1c?", reportId: ids.report });
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      refusalKind: null,
      copy: null,
      focusReportId: ids.report,
      sentences: [
        {
          text: "Your HbA1c was 5.9 % on 4 Aug 2026.",
          cites: [{ kind: "value", reportId: ids.report, target: "hba1c" }],
        },
      ],
    });
    const [row] = store.rows;
    expect(row).toMatchObject({ model: "claude-haiku-5-5", rules: [] });
    expect(row).not.toHaveProperty("charged", true);
    expect(row?.costCents).toBeGreaterThan(0);
  });

  test("the request caches the system prompt and the profile block and names the open report", async () => {
    store.create.mockResolvedValueOnce(toolUse(good));
    await ask({ question: "What was my HbA1c?", reportId: ids.report });
    const body = store.create.mock.calls[0]![0] as Anthropic.MessageCreateParamsNonStreaming;
    expect(body.thinking).toEqual({ type: "disabled" });
    expect(body.system).toEqual([
      expect.objectContaining({ cache_control: { type: "ephemeral" } }),
    ]);
    const [profile, tail] = body.messages[0]!.content as Anthropic.TextBlockParam[];
    expect(profile).toMatchObject({ cache_control: { type: "ephemeral" } });
    expect(profile!.text).toContain("R1:hba1c 5.9 %");
    expect(tail!.text).toContain("The person has R1 open.");
    expect(tail!.text).toContain("New question: What was my HbA1c?");
  });

  test("the last 3 questions of the chat go into the next request, oldest first", async () => {
    for (const question of ["One?", "Two?", "Three?", "Four?", "Five?"]) {
      store.create.mockResolvedValueOnce(toolUse(good));
      await ask({ question });
    }
    const body = store.create.mock.calls[4]![0] as Anthropic.MessageCreateParamsNonStreaming;
    const tail = (body.messages[0]!.content as Anthropic.TextBlockParam[])[1]!.text;
    expect(tail).not.toContain("Question: One?");
    expect(tail.indexOf("Question: Two?")).toBeGreaterThan(-1);
    expect(tail.indexOf("Question: Two?")).toBeLessThan(tail.indexOf("Question: Four?"));
    expect(tail).toContain("Answer: Your HbA1c was 5.9 % on 4 Aug 2026.");
  });

  test("a rejected first answer gets one retry with the problems, and the retry is stored", async () => {
    store.create.mockResolvedValueOnce(toolUse(invented)).mockResolvedValueOnce(toolUse(good));
    const response = await ask({ question: "What was my HbA1c?" });
    expect(await response.json()).toMatchObject({
      sentences: [{ text: "Your HbA1c was 5.9 % on 4 Aug 2026." }],
    });
    expect(store.create).toHaveBeenCalledTimes(2);
    const retry = store.create.mock.calls[1]![0] as Anthropic.MessageCreateParamsNonStreaming;
    expect(JSON.stringify(retry.messages)).toContain("6.4, which is not in the cited facts");
    expect(store.rows[0]?.rules).toEqual(["number_not_in_fact"]);
  });

  test("two failed answers store the fallback copy", async () => {
    store.create.mockResolvedValue(toolUse(invented));
    const response = await ask({ question: "What was my HbA1c?" });
    expect(await response.json()).toMatchObject({
      refusalKind: "fallback",
      copy: refusalCopy.fallback,
      sentences: [],
    });
    expect(store.create).toHaveBeenCalledTimes(2);
  });

  test("a worry refusal returns the cited facts and then the worry copy", async () => {
    store.create.mockResolvedValueOnce(toolUse({ ...good, kind: "refuse", refuseKind: "worry" }));
    const response = await ask({ question: "Should I worry about my HbA1c?" });
    expect(await response.json()).toMatchObject({
      refusalKind: "worry",
      copy: refusalCopy.worry,
      sentences: [{ text: "Your HbA1c was 5.9 % on 4 Aug 2026." }],
    });
  });

  test("the log line holds ids, outcome, rules, tokens and cost, and no question, answer or marker", async () => {
    const lines: string[] = [];
    const spy = vi.spyOn(console, "log").mockImplementation((...args) => {
      lines.push(args.join(" "));
    });
    store.create.mockResolvedValueOnce(toolUse(invented)).mockResolvedValueOnce(toolUse(good));
    await ask({ question: "What was my secret HbA1c question?" });
    spy.mockRestore();
    const line = lines.find((text) => text.includes("assistant question="));
    expect(line).toMatch(
      /outcome=answer rules=number_not_in_fact input_tokens=1000 cached_tokens=0 cache_write_tokens=4000 output_tokens=200 cents=\d/,
    );
    expect(line).not.toMatch(/secret|HbA1c|hba1c|5\.9|Aug|profile/i);
  });

  test("another user's profile or a report of another profile answers 404 with no call and no row", async () => {
    expect((await ask({ question: "What was my HbA1c?" }, ids.bobProfile)).status).toBe(404);
    expect((await ask({ question: "What was my HbA1c?", reportId: ids.otherReport })).status).toBe(
      404,
    );
    expect(store.create).not.toHaveBeenCalled();
    expect(store.rows).toHaveLength(0);
  });

  test("the chat lists newest first, clear chat empties it, and only the owner can flag", async () => {
    store.create.mockResolvedValue(toolUse(good));
    await ask({ question: "First?" });
    await ask({ question: "Second?" });
    const list = (await (await app.request(`/profiles/${ids.profile}/questions`)).json()) as {
      id: string;
      question: string;
    }[];
    expect(list.map(({ question }) => question)).toEqual(["Second?", "First?"]);

    const flagged = await app.request(`/questions/${list[0]!.id}/flag`, { method: "POST" });
    expect(await flagged.json()).toMatchObject({ flagged: true });
    const stolen = await app.request(`/questions/${list[1]!.id}/flag`, {
      method: "POST",
      headers: { "x-user": "bob" },
    });
    expect(stolen.status).toBe(404);
    expect(store.rows.find(({ id }) => id === list[1]!.id)?.flaggedAt).toBeNull();

    const bobList = await app.request(`/profiles/${ids.profile}/questions`, {
      headers: { "x-user": "bob" },
    });
    expect(bobList.status).toBe(404);
    const cleared = await app.request(`/profiles/${ids.profile}/questions`, {
      method: "DELETE",
    });
    expect(cleared.status).toBe(204);
    expect(store.rows).toHaveLength(0);
  });
});
