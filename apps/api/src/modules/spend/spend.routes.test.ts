import { Hono } from "hono";
import { expect, test, vi } from "vitest";
import { handleError } from "../../common/problem.js";
import { env } from "../../config/env.js";
import type { AuthEnv } from "../../middleware/auth.js";
import { spendRoutes } from "./spend.routes.js";

vi.mock("./spend.repo.js", () => {
  const step = { inputTokens: 0, cachedInputTokens: 0, cacheWriteTokens: 0, outputTokens: 0 };
  return {
    findPurchasesThisMonth: async () => ({ purchases: 3, revenuePaise: 29700 }),
    listQuestionsThisMonth: async () => [
      { userId: "bob", usage: { ...step, model: "claude-haiku-5-5", outputTokens: 4_000_000 } },
      { userId: "bob", usage: null },
      { userId: "carol", usage: { ...step, model: "claude-haiku-5-5", inputTokens: 1_000_000 } },
    ],
    listJobsThisMonth: async () => [
      {
        userId: "alice",
        status: "done",
        usage: null,
        inputTokens: 1_000_000,
        outputTokens: 200_000,
      },
      {
        userId: "bob",
        status: "done",
        usage: {
          extract: {
            ...step,
            model: "claude-haiku-5-5",
            inputTokens: 1_000_000,
            cachedInputTokens: 1_000_000,
          },
          narrative: { ...step, model: "claude-sonnet-5-5", outputTokens: 10_000 },
        },
        inputTokens: 2_000_000,
        outputTokens: 10_000,
      },
      { userId: "bob", status: "failed", usage: null, inputTokens: 500_000, outputTokens: 0 },
    ],
  };
});

const app = new Hono<AuthEnv>()
  .use(async (c, next) => {
    c.set("userId", c.req.header("x-user") ?? "alice");
    await next();
  })
  .route("/admin", spendRoutes);
app.onError(handleError);

test("GET /admin/spend returns 404 to everyone but ADMIN_USER_ID", async () => {
  env.ADMIN_USER_ID = undefined;
  expect((await app.request("/admin/spend")).status).toBe(404);
  env.ADMIN_USER_ID = "admin-user";
  expect((await app.request("/admin/spend", { headers: { "x-user": "alice" } })).status).toBe(404);
});

test("GET /admin/spend prices each job and question by model and cache use, counts failed jobs, lists the top users and this month's purchases", async () => {
  env.ADMIN_USER_ID = "admin-user";
  env.CLAUDE_MONTHLY_CAP_CENTS = 2000;
  const res = await app.request("/admin/spend", { headers: { "x-user": "admin-user" } });

  expect(await res.json()).toMatchObject({
    costCents: 731,
    capCents: 2000,
    reads: 2,
    questions: 3,
    purchases: 3,
    revenuePaise: 29700,
    topUsers: [
      { userId: "alice", costCents: 400, reads: 1, questions: 0 },
      { userId: "bob", costCents: 321, reads: 1, questions: 2 },
      { userId: "carol", costCents: 10, reads: 0, questions: 1 },
    ],
  });
});
