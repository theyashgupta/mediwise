import { afterEach, beforeEach, expect, test, vi } from "vitest";

const edge = vi.hoisted(() => ({
  answers: [] as string[],
  items: [] as Record<string, unknown>[],
  loadReviewDay: vi.fn(),
  storeReview: vi.fn(),
  end: vi.fn(),
  close: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
}));

vi.mock("node:readline", () => ({
  createInterface: () => ({
    close: edge.close,
    [Symbol.asyncIterator]: () => ({
      next: async () =>
        edge.answers.length > 0
          ? { done: false, value: edge.answers.shift() }
          : { done: true, value: undefined },
    }),
  }),
}));
vi.mock("../db/client.js", () => ({ db: { $client: { end: edge.end } } }));
vi.mock("../middleware/logger.js", () => ({ log: { info: edge.info, error: edge.error } }));
vi.mock("../modules/assistant/index.js", () => ({
  loadReviewDay: edge.loadReviewDay,
  storeReview: edge.storeReview,
  countReviews: async () => [{ verdict: "pass", total: 1 }],
}));

function item(id: string, verdict: string | null = null) {
  return {
    id,
    question: "What was my HbA1c?",
    createdAt: new Date("2026-10-13T10:00:00Z"),
    refusalKind: null,
    flagged: false,
    copy: null,
    sentences: [],
    facts: [],
    verdict,
  };
}

/** Runs the review script once for the given day argument, as `pnpm assistant:review` does. */
async function run(day?: string) {
  vi.resetModules();
  process.argv = ["node", "review-assistant.ts", ...(day ? [day] : [])];
  await import("./review-assistant.js");
}

const argv = process.argv;

beforeEach(() => {
  vi.clearAllMocks();
  edge.answers = [];
  edge.loadReviewDay.mockImplementation(async () => edge.items);
  edge.items = [item("q1"), item("q2"), item("q3"), item("done", "pass")];
});

afterEach(() => {
  process.argv = argv;
  process.exitCode = undefined;
});

test("an impossible day prints the usage and loads no question", async () => {
  await run("2026-02-30");

  expect(process.exitCode).toBe(1);
  expect(edge.error).toHaveBeenCalledWith(expect.stringContaining("Usage:"));
  expect(edge.loadReviewDay).not.toHaveBeenCalled();
  expect(edge.end).toHaveBeenCalled();
});

test("p stores pass, an unknown key asks again, s skips and q stops the review", async () => {
  edge.answers = ["x", " P ", "s", "q"];

  await run("2026-10-13");

  expect(edge.loadReviewDay).toHaveBeenCalledWith("2026-10-13", expect.any(Function));
  expect(edge.info).toHaveBeenCalledWith("2026-10-13 (UTC): 4 sampled, 1 already reviewed.");
  expect(edge.storeReview.mock.calls).toEqual([["q1", "pass"]]);
  expect(edge.close).toHaveBeenCalled();
  expect(edge.info).toHaveBeenLastCalledWith(expect.stringContaining("Reviewed 1 of 200."));
});

test("c stores critical, m stores minor and the end of the input stops the review", async () => {
  edge.answers = ["c", "m"];

  await run("2026-10-13");

  expect(edge.storeReview.mock.calls).toEqual([
    ["q1", "critical"],
    ["q2", "minor"],
  ]);
  expect(process.exitCode).toBeUndefined();
});

test("with no day the review reads today in UTC", async () => {
  edge.items = [];

  await run();

  expect(edge.loadReviewDay).toHaveBeenCalledWith(
    new Date().toISOString().slice(0, 10),
    expect.any(Function),
  );
});
