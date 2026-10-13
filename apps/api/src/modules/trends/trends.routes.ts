import { Hono } from "hono";
import { validate } from "../../common/validate.js";
import type { AuthEnv } from "../../middleware/auth.js";
import {
  compareQuerySchema,
  earlierQuerySchema,
  trendParamsSchema,
  trendsQuerySchema,
} from "./trends.schemas.js";
import { compareReports, getTrend, listEarlierValues, listTrends } from "./trends.service.js";

export const trendsRoutes = new Hono<AuthEnv>()
  .get("/", validate("query", trendsQuerySchema), async (c) =>
    c.json(await listTrends(c.var.userId, c.req.valid("query").profileId)),
  )
  .get(
    "/:markerKey",
    validate("param", trendParamsSchema),
    validate("query", trendsQuerySchema),
    async (c) =>
      c.json(
        await getTrend(
          c.var.userId,
          c.req.valid("query").profileId,
          c.req.valid("param").markerKey,
        ),
      ),
  );

export const compareRoutes = new Hono<AuthEnv>()
  .get("/", validate("query", compareQuerySchema), async (c) =>
    c.json(await compareReports(c.var.userId, c.req.valid("query"))),
  )
  .get("/earlier", validate("query", earlierQuerySchema), async (c) =>
    c.json(await listEarlierValues(c.var.userId, c.req.valid("query").reportId)),
  );
