import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { problem } from "../../common/problem.js";
import { validate } from "../../common/validate.js";
import { env } from "../../config/env.js";
import type { AuthEnv } from "../../middleware/auth.js";
import { askQuestionSchema, assistantParamsSchema } from "./assistant.schemas.js";
import { askQuestion, clearQuestions, flagQuestion, listQuestions } from "./assistant.service.js";

/**
 * Answers 404 on an assistant route while `ASSISTANT_ENABLED` is off.
 *
 * @remarks
 * Set per route, never with `.use`, because these routes mount on `/profiles` next to the profile routes.
 */
const enabled = createMiddleware<AuthEnv>(async (c, next) => {
  if (!env.ASSISTANT_ENABLED) return problem(c, 404, "Not Found");
  await next();
});

export const profileQuestionsRoutes = new Hono<AuthEnv>()
  .post(
    "/:id/questions",
    enabled,
    validate("param", assistantParamsSchema),
    validate("json", askQuestionSchema),
    async (c) =>
      c.json(await askQuestion(c.var.userId, c.req.valid("param").id, c.req.valid("json")), 201),
  )
  .get("/:id/questions", enabled, validate("param", assistantParamsSchema), async (c) =>
    c.json(await listQuestions(c.var.userId, c.req.valid("param").id)),
  )
  .delete("/:id/questions", enabled, validate("param", assistantParamsSchema), async (c) => {
    await clearQuestions(c.var.userId, c.req.valid("param").id);
    return c.body(null, 204);
  });

export const questionsRoutes = new Hono<AuthEnv>().post(
  "/:id/flag",
  enabled,
  validate("param", assistantParamsSchema),
  async (c) => c.json(await flagQuestion(c.var.userId, c.req.valid("param").id)),
);
