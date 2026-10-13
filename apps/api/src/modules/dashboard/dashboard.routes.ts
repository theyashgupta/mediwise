import { Hono } from "hono";
import { requestLocale } from "../../common/locale.js";
import { validate } from "../../common/validate.js";
import type { AuthEnv } from "../../middleware/auth.js";
import { dashboardQuerySchema } from "./dashboard.schemas.js";
import { getDashboard, getFamily } from "./dashboard.service.js";

export const dashboardRoutes = new Hono<AuthEnv>()
  .get("/", validate("query", dashboardQuerySchema), async (c) =>
    c.json(await getDashboard(c.var.userId, c.req.valid("query").profileId, requestLocale(c))),
  )
  .get("/family", async (c) => c.json(await getFamily(c.var.userId)));
