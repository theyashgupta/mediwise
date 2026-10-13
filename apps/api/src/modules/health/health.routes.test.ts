import { healthResponseSchema } from "@mediwise/shared";
import { expect, test } from "vitest";
import { healthRoutes } from "./health.routes.js";

test("GET /health returns ok with the current time", async () => {
  const res = await healthRoutes.request("/");
  expect(res.status).toBe(200);
  expect(healthResponseSchema.parse(await res.json()).status).toBe("ok");
});
