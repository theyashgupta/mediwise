import { Hono } from "hono";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { handleError } from "../../common/problem.js";
import type { AuthEnv } from "../../middleware/auth.js";
import { yearReviewRoutes } from "./year-review.routes.js";

const profileId = vi.hoisted(() => "5f0c6a8e-6c1a-4a39-9c43-2c1f7c3e2a10");

const store = vi.hoisted(() => {
  type Report = {
    id: string;
    collectedAt: string;
    score: number;
    labName: string | null;
    fileLabs?: string[];
    coverage?: number;
  };
  type Row = {
    reportId: string;
    markerKey: string;
    value: number;
    unit: string;
    status: "optimal" | "watch" | "risk";
  };
  const reports: Report[] = [];
  const rows: Row[] = [];
  const intros = new Map<string, { hash: string; sentences: string[] | null }>();
  const owned = (owner: string, id: string) => owner === "alice" && id === profileId;
  const done = (owner: string, id: string) =>
    owned(owner, id) ? [...reports].sort((a, b) => a.collectedAt.localeCompare(b.collectedAt)) : [];
  return {
    reports,
    rows,
    intros,
    create: vi.fn(),
    profilesRepo: {
      findProfileById: async (owner: string, id: string) =>
        owned(owner, id) ? { id, isSelf: true } : undefined,
    },
    trendsRepo: {
      listDoneReports: async (owner: string, id: string) =>
        done(owner, id).map((report) => ({
          ...report,
          labNames: [...(report.labName ? [report.labName] : []), ...(report.fileLabs ?? [])],
          createdAt: new Date(`${report.collectedAt}T00:00:00Z`),
          tier: "gold" as const,
        })),
      listMarkerRows: async (owner: string, id: string) => {
        const ids = new Set(done(owner, id).map((report) => report.id));
        return rows
          .filter((row) => ids.has(row.reportId))
          .map((row) => ({
            valueText: null,
            calibratedLow: null,
            calibratedHigh: null,
            labName: null,
            ...row,
          }));
      },
    },
    repo: {
      findIntro: async (id: string) => intros.get(id) ?? null,
      saveIntro: async (id: string, intro: { hash: string; sentences: string[] | null }) => {
        intros.set(id, intro);
      },
    },
  };
});

vi.mock("../profiles/profiles.repo.js", () => store.profilesRepo);
vi.mock("../trends/trends.repo.js", () => store.trendsRepo);
vi.mock("./year-review.repo.js", () => store.repo);
vi.mock("../links/links.repo.js", () => ({
  listProfileLinks: async () => [],
  listLinks: async () => [],
  listReportsAfter: async () => [],
  listVisitDates: async () => [],
}));
vi.mock("../../lib/anthropic.js", () => ({ anthropic: { messages: { create: store.create } } }));

type Reading = { value: number; status: string; date: string };
type Review = {
  from: string;
  to: string;
  reportCount: number;
  labCount: number;
  score: { from: number | null; to: number | null };
  moved: { markerKey: string; direction: string; from: Reading; to: Reading }[];
  stillAtRisk: { markerKey: string; from: Reading; to: Reading }[];
  measuredOnce: ({ markerKey: string } & Reading)[];
  intro: string[];
};

const app = new Hono<AuthEnv>()
  .use(async (c, next) => {
    c.set("userId", c.req.header("x-user") ?? "alice");
    await next();
  })
  .route("/profiles", yearReviewRoutes);
app.onError(handleError);

async function getReview(user = "alice") {
  const res = await app.request(`/profiles/${profileId}/year-review`, {
    headers: { "x-user": user },
  });
  return { status: res.status, body: (await res.json()) as Review };
}

function intro(sentences: { text: string; citedKeys: string[] }[]) {
  return {
    content: [{ type: "tool_use", id: "toolu_1", name: "write_intro", input: { sentences } }],
    stop_reason: "tool_use",
    usage: { input_tokens: 900, output_tokens: 80 },
  };
}

const goodIntro = [
  { text: "Your score went from 80 to 86 across three reports.", citedKeys: [] },
  { text: "LDL cholesterol moved from risk to watch status.", citedKeys: ["ldl_cholesterol"] },
];
const engineText = [
  "This review covers 3 reports from 2 labs.",
  "Your score went from 80 to 86.",
  "1 marker moved to a better status.",
  "1 marker moved to a worse status.",
  "1 marker kept risk status.",
];

function marker(reportId: string, markerKey: string, value: number, status: string, unit = "") {
  store.rows.push({ reportId, markerKey, value, unit, status } as (typeof store.rows)[number]);
}

beforeEach(() => {
  store.reports.splice(0);
  store.rows.splice(0);
  store.intros.clear();
  store.create.mockReset();
  store.create.mockResolvedValue(intro(goodIntro));
  store.reports.push(
    { id: "r0", collectedAt: "2023-01-15", score: 50, labName: "Moon Labs" },
    { id: "r1", collectedAt: "2024-03-09", score: 80, labName: "Sunrise Diagnostics" },
    { id: "r2", collectedAt: "2024-09-01", score: 82, labName: "Moon Labs" },
    { id: "r3", collectedAt: "2025-03-29", score: 86, labName: "sunrise diagnostics " },
  );
  marker("r1", "ldl_cholesterol", 160, "risk", "mg/dL");
  marker("r3", "ldl_cholesterol", 120, "watch", "mg/dL");
  marker("r1", "vitamin_d", 24, "watch", "ng/mL");
  marker("r3", "vitamin_d", 15, "risk", "ng/mL");
  marker("r1", "hba1c", 6.6, "risk", "%");
  marker("r2", "hba1c", 6.1, "watch", "%");
  marker("r3", "hba1c", 6.7, "risk", "%");
  marker("r1", "tsh", 2.1, "optimal", "µIU/mL");
  marker("r3", "tsh", 2.4, "optimal", "µIU/mL");
  marker("r3", "ferritin", 40, "optimal", "ng/mL");
  marker("r0", "vitamin_b12", 150, "risk", "pg/mL");
  marker("r3", "vitamin_b12", 400, "optimal", "pg/mL");
});

describe("window", () => {
  test("the window ends at the latest report and starts 13 months before it", async () => {
    const { status, body } = await getReview();
    expect(status).toBe(200);
    expect(body).toMatchObject({
      from: "2024-03-09",
      to: "2025-03-29",
      reportCount: 3,
      labCount: 2,
      score: { from: 80, to: 86 },
    });
  });

  test("the lab of a study file in a report counts as one more lab", async () => {
    store.reports[3]!.fileLabs = ["Lakeview Imaging"];
    expect((await getReview()).body.labCount).toBe(3);
  });

  test("a report on the first day of the window counts and a report one day earlier does not", async () => {
    store.reports[1]!.collectedAt = "2024-02-29";
    expect((await getReview()).body.from).toBe("2024-02-29");
    store.reports[1]!.collectedAt = "2024-02-28";
    expect((await getReview()).body).toMatchObject({ from: "2024-09-01", reportCount: 2 });
  });

  test("a marker with one value in the window has no trend, even with an older value", async () => {
    const { body } = await getReview();
    expect(body.measuredOnce.map(({ markerKey }) => markerKey)).toEqual([
      "vitamin_b12",
      "ferritin",
    ]);
    expect(body.measuredOnce[0]).toMatchObject({
      value: 400,
      status: "optimal",
      date: "2025-03-29",
    });
  });
});

describe("band movement", () => {
  test("a marker whose first and last status differ moved, with its direction and both values", async () => {
    const { body } = await getReview();
    expect(body.moved).toEqual([
      expect.objectContaining({
        markerKey: "ldl_cholesterol",
        direction: "improved",
        from: { value: 160, status: "risk", date: "2024-03-09" },
        to: { value: 120, status: "watch", date: "2025-03-29" },
      }),
      expect.objectContaining({
        markerKey: "vitamin_d",
        direction: "worsened",
        from: { value: 24, status: "watch", date: "2024-03-09" },
        to: { value: 15, status: "risk", date: "2025-03-29" },
      }),
    ]);
  });

  test("a marker at risk at the start and the end is still at risk, whatever happened between", async () => {
    const { body } = await getReview();
    expect(body.stillAtRisk).toEqual([
      expect.objectContaining({
        markerKey: "hba1c",
        from: { value: 6.6, status: "risk", date: "2024-03-09" },
        to: { value: 6.7, status: "risk", date: "2025-03-29" },
      }),
    ]);
  });

  test("a marker that stays optimal is in no list", async () => {
    const { body } = await getReview();
    const keys = [...body.moved, ...body.stillAtRisk, ...body.measuredOnce].map(
      ({ markerKey }) => markerKey,
    );
    expect(keys).not.toContain("tsh");
  });
});

test("the score compares the broadest panels and leaves out a glucose-only report", async () => {
  store.reports.push({
    id: "r5",
    collectedAt: "2025-04-05",
    score: 50,
    labName: "Moon Labs",
    coverage: 6,
  });
  const { body } = await getReview();
  expect(body.score).toEqual({ from: 80, to: 86 });
  expect(body.reportCount).toBe(4);
});

describe("not found", () => {
  test("a profile with one report in the window answers 404", async () => {
    store.reports.splice(1, 2);
    expect((await getReview()).status).toBe(404);
  });

  test("two reports of the same collection date are one visit and answer 404", async () => {
    store.reports.splice(0, 3, { id: "r4", collectedAt: "2025-03-29", score: 85, labName: null });
    expect((await getReview()).status).toBe(404);
  });

  test("another user's profile answers 404", async () => {
    expect((await getReview("mallory")).status).toBe(404);
    expect(store.create).not.toHaveBeenCalled();
  });
});

describe("intro", () => {
  test("an intro that passes the validator is returned and cites only review markers", async () => {
    const { body } = await getReview();
    expect(body.intro).toEqual(goodIntro.map(({ text }) => text));
    const facts = store.create.mock.calls[0]![0].messages[0].content[0].text as string;
    expect(facts).toContain("ldl_cholesterol | LDL cholesterol");
    expect(facts).not.toContain("tsh");
  });

  test("an intro rejected twice falls back to the engine text", async () => {
    store.create.mockResolvedValue(
      intro([
        { text: "Your score rose; LDL cholesterol improved.", citedKeys: ["ldl_cholesterol"] },
      ]),
    );
    const { body } = await getReview();
    expect(store.create).toHaveBeenCalledTimes(2);
    expect(body.intro).toEqual(engineText);
  });

  test("a sentence that names a marker outside the review is rejected and the retry is kept", async () => {
    store.create
      .mockResolvedValueOnce(intro([{ text: "TSH stayed optimal.", citedKeys: ["tsh"] }]))
      .mockResolvedValueOnce(intro(goodIntro));
    const { body } = await getReview();
    const retry = store.create.mock.calls[1]![0].messages[0].content[1].text as string;
    expect(retry).toContain('cites "tsh", which is not in this report');
    expect(body.intro).toEqual(goodIntro.map(({ text }) => text));
  });

  test("a sentence over 20 words is rejected", async () => {
    const long = Array.from({ length: 21 }, () => "word").join(" ");
    store.create.mockResolvedValue(intro([{ text: long, citedKeys: [] }]));
    expect((await getReview()).body.intro).toEqual(engineText);
  });

  test("a failed Claude call falls back to the engine text and caches nothing", async () => {
    store.create.mockRejectedValue(new Error("overloaded"));
    expect((await getReview()).body.intro).toEqual(engineText);
    expect(store.intros.size).toBe(0);
  });
});

describe("cache", () => {
  test("a second open uses the cached intro and makes no Claude call", async () => {
    await getReview();
    const { body } = await getReview();
    expect(store.create).toHaveBeenCalledTimes(1);
    expect(body.intro).toEqual(goodIntro.map(({ text }) => text));
  });

  test("a rejected intro is cached, so a second open makes no Claude call either", async () => {
    store.create.mockResolvedValue(intro([{ text: "Bad; sentence.", citedKeys: [] }]));
    await getReview();
    const { body } = await getReview();
    expect(store.create).toHaveBeenCalledTimes(2);
    expect(body.intro).toEqual(engineText);
  });

  test("a new report changes the review facts and writes a new intro", async () => {
    await getReview();
    store.reports.push({ id: "r5", collectedAt: "2025-09-01", score: 88, labName: "Moon Labs" });
    marker("r5", "ldl_cholesterol", 99, "optimal", "mg/dL");
    await getReview();
    expect(store.create).toHaveBeenCalledTimes(2);
  });
});
