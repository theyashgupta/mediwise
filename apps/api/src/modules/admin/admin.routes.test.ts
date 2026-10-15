import { Hono } from "hono";
import { expect, test, vi } from "vitest";
import { handleError } from "../../common/problem.js";
import { env } from "../../config/env.js";
import type { AuthEnv } from "../../middleware/auth.js";
import { adminRoutes } from "./admin.routes.js";

vi.mock("./admin.repo.js", () => ({
  findQueue: async () => ({ depth: 0, oldestAt: null }),
  listFailedReports: async () => [],
  listLedgerEvents: async () => [],
  listChargedQuestions: async () => [],
  sumLedger: async () => [],
  countChargedQuestions: async () => 0,
  findReportOwner: async () => undefined,
}));

vi.mock("../spend/spend.repo.js", () => ({
  listJobsThisMonth: async () => [],
  listQuestionsThisMonth: async () => [],
  findPurchasesThisMonth: async () => ({ purchases: 0, revenuePaise: 0 }),
}));

const app = new Hono<AuthEnv>()
  .use(async (c, next) => {
    c.set("userId", c.req.header("x-user") ?? "alice");
    await next();
  })
  .route("/admin", adminRoutes);
app.onError(handleError);

const reportId = "6f1c2b9e-1d2a-4c3b-9e8f-0a1b2c3d4e5f";

const adminPaths = ["/admin/credits", "/admin/failed-reports"];

test("the credit history, the failed reads and the retry return 404 to everyone but ADMIN_USER_ID", async () => {
  env.ADMIN_USER_ID = undefined;
  for (const path of adminPaths) expect((await app.request(path)).status).toBe(404);
  env.ADMIN_USER_ID = "admin-user";
  const asAlice = { headers: { "x-user": "alice" } };
  for (const path of adminPaths) {
    const res = await app.request(path, asAlice);
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ title: "Not Found" });
  }
  const retry = await app.request(`/admin/reports/${reportId}/retry`, {
    method: "POST",
    ...asAlice,
  });
  expect(retry.status).toBe(404);
});

test("the admin passes the gate: the credit history answers 200 and a retry of an unknown report 404", async () => {
  env.ADMIN_USER_ID = "admin-user";
  const asAdmin = { headers: { "x-user": "admin-user" } };
  const credits = await app.request("/admin/credits?from=2026-10-01&to=2026-10-14", asAdmin);
  expect(credits.status).toBe(200);
  expect(await credits.json()).toMatchObject({ reportCredits: { events: [] } });
  expect((await app.request("/admin/failed-reports", asAdmin)).status).toBe(200);
  const retry = await app.request(`/admin/reports/${reportId}/retry`, {
    method: "POST",
    ...asAdmin,
  });
  expect(retry.status).toBe(404);
  expect(await retry.json()).toMatchObject({ title: "We could not find this report" });
});

test("a date filter that is not a day answers 400", async () => {
  env.ADMIN_USER_ID = "admin-user";
  const res = await app.request("/admin/credits?from=yesterday", {
    headers: { "x-user": "admin-user" },
  });
  expect(res.status).toBe(400);
});
