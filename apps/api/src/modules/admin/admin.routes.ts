import { Hono } from "hono";
import { problem } from "../../common/problem.js";
import { validate } from "../../common/validate.js";
import { env } from "../../config/env.js";
import type { AuthEnv } from "../../middleware/auth.js";
import { reportParamsSchema } from "./admin.schemas.js";
import { getOverview, retryFailedReport } from "./admin.service.js";

export const adminRoutes = new Hono<AuthEnv>()
  .use(async (c, next) => {
    if (!env.ADMIN_USER_ID || c.var.userId !== env.ADMIN_USER_ID)
      return problem(c, 404, "Not Found");
    await next();
  })
  .get("/overview", async (c) => c.json(await getOverview()))
  .post("/reports/:id/retry", validate("param", reportParamsSchema), async (c) => {
    await retryFailedReport(c.req.valid("param").id);
    return c.body(null, 204);
  });
