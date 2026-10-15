import { Hono } from "hono";
import { validate } from "../../common/validate.js";
import type { AuthEnv } from "../../middleware/auth.js";
import { yearReviewParamsSchema } from "./year-review.schemas.js";
import { getYearReview, writeYearReviewIntro } from "./year-review.service.js";

export const yearReviewRoutes = new Hono<AuthEnv>()
  .get("/:id/year-review", validate("param", yearReviewParamsSchema), async (c) =>
    c.json(await getYearReview(c.var.userId, c.req.valid("param").id)),
  )
  .post("/:id/year-review/intro", validate("param", yearReviewParamsSchema), async (c) =>
    c.json(await writeYearReviewIntro(c.var.userId, c.req.valid("param").id)),
  );
