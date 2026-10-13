import { Hono } from "hono";
import { expect, test } from "vitest";
import { handleError } from "../../common/problem.js";
import { env } from "../../config/env.js";
import type { AuthEnv } from "../../middleware/auth.js";
import { adminRoutes } from "./admin.routes.js";

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
