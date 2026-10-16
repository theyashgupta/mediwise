import { deleteMeSchema, giveConsentsSchema, updateMeSchema } from "@mediwise/shared";
import { Hono } from "hono";
import { validate } from "../../common/validate.js";
import type { AuthEnv } from "../../middleware/auth.js";
import { assistantEnabled } from "../assistant/index.js";
import { getConsents, giveConsents } from "../consents/index.js";
import { takeQuestionPack } from "../credits/index.js";
import { exportQuerySchema } from "./me.schemas.js";
import { deleteMe, exportMe, getMe, updateMe } from "./me.service.js";

export const meRoutes = new Hono<AuthEnv>()
  .get("/", async (c) => c.json(await getMe(c.var.userId, c.var.email, c.var.name)))
  .patch("/", validate("json", updateMeSchema), async (c) =>
    c.json(await updateMe(c.var.userId, c.var.email, c.req.valid("json"))),
  )
  .delete("/", validate("json", deleteMeSchema), async (c) => {
    await deleteMe(c.var.userId);
    return c.body(null, 204);
  })
  .post("/question-packs", assistantEnabled, async (c) =>
    c.json(await takeQuestionPack(c.var.userId), 201),
  )
  .get("/consents", async (c) => c.json(await getConsents(c.var.userId)))
  .post("/consents", validate("json", giveConsentsSchema), async (c) =>
    c.json(
      await giveConsents(c.var.userId, c.req.valid("json").kinds, c.req.header("User-Agent")),
      201,
    ),
  )
  .get("/export", validate("query", exportQuerySchema), async (c) =>
    c.json(await exportMe(c.var.userId, c.req.valid("query").files === "1"), 200, {
      "Content-Disposition": 'attachment; filename="mediwise-export.json"',
    }),
  );
