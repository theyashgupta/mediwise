import { Hono } from "hono";
import { expect, test, vi } from "vitest";
import { handleError } from "../../common/problem.js";
import { env } from "../../config/env.js";
import type { AuthEnv } from "../../middleware/auth.js";
import { adminRoutes } from "./admin.routes.js";

vi.mock("./admin.repo.js", () => ({
  listJobsSince: async () => [],
  listQuestionsSince: async () => [],
  findQueue: async () => ({ depth: 0, oldestAt: null }),
  listFailedReports: async () => [],
  sumCreditsByReason: async () => [],
  countProfiles: async () => ({ profiles: 0, users: 0, activeProfiles: 0, activeUsers: 0 }),
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

test("the admin overview and the admin retry return 404 to everyone but ADMIN_USER_ID", async () => {
  env.ADMIN_USER_ID = undefined;
  expect((await app.request("/admin/overview")).status).toBe(404);
  env.ADMIN_USER_ID = "admin-user";
  const asAlice = { headers: { "x-user": "alice" } };
  const overview = await app.request("/admin/overview", asAlice);
  expect(overview.status).toBe(404);
  expect(await overview.json()).toMatchObject({ title: "Not Found" });
  const retry = await app.request(`/admin/reports/${reportId}/retry`, {
    method: "POST",
    ...asAlice,
  });
  expect(retry.status).toBe(404);
});

test("the admin passes the gate: the overview answers 200 and a retry of an unknown report 404", async () => {
  env.ADMIN_USER_ID = "admin-user";
  const asAdmin = { headers: { "x-user": "admin-user" } };
  const overview = await app.request("/admin/overview", asAdmin);
  expect(overview.status).toBe(200);
  expect(await overview.json()).toMatchObject({ alerts: [], meanCostPerReadCents: null });
  const retry = await app.request(`/admin/reports/${reportId}/retry`, {
    method: "POST",
    ...asAdmin,
  });
  expect(retry.status).toBe(404);
  expect(await retry.json()).toMatchObject({ title: "We could not find this report" });
});
