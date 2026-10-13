import { Hono } from "hono";
import { problem } from "../../common/problem.js";
import { env } from "../../config/env.js";
import type { AuthEnv } from "../../middleware/auth.js";
import { getSpendSummary } from "./spend.service.js";

export const spendRoutes = new Hono<AuthEnv>().get("/spend", async (c) => {
  if (!env.ADMIN_USER_ID || c.var.userId !== env.ADMIN_USER_ID) return problem(c, 404, "Not Found");
  return c.json(await getSpendSummary());
});
