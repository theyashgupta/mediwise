import { profileInputSchema, profileUpdateSchema } from "@mediwise/shared";
import { Hono } from "hono";
import { validate } from "../../common/validate.js";
import type { AuthEnv } from "../../middleware/auth.js";
import { profileParamsSchema } from "./profiles.schemas.js";
import {
  createProfile,
  deleteProfile,
  exportProfileCsv,
  listProfiles,
  updateProfile,
} from "./profiles.service.js";

export const profilesRoutes = new Hono<AuthEnv>()
  .get("/", async (c) => c.json(await listProfiles(c.var.userId, c.var.email, c.var.name)))
  .post("/", validate("json", profileInputSchema), async (c) =>
    c.json(await createProfile(c.var.userId, c.req.valid("json")), 201),
  )
  .patch(
    "/:id",
    validate("param", profileParamsSchema),
    validate("json", profileUpdateSchema),
    async (c) =>
      c.json(await updateProfile(c.var.userId, c.req.valid("param").id, c.req.valid("json"))),
  )
  .get("/:id/export.csv", validate("param", profileParamsSchema), async (c) =>
    c.body(await exportProfileCsv(c.var.userId, c.req.valid("param").id), 200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="mediwise-values.csv"',
    }),
  )
  .delete("/:id", validate("param", profileParamsSchema), async (c) => {
    await deleteProfile(c.var.userId, c.req.valid("param").id);
    return c.body(null, 204);
  });
