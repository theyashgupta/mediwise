import { Hono } from "hono";
import { requestLocale } from "../../common/locale.js";
import { validate } from "../../common/validate.js";
import type { AuthEnv } from "../../middleware/auth.js";
import { createShareSchema, shareParamsSchema, shareReportParamsSchema } from "./shares.schemas.js";
import { createShare, endShare, getSharedExport, listShares } from "./shares.service.js";

export const sharesRoutes = new Hono<AuthEnv>()
  .get("/:id/share", validate("param", shareReportParamsSchema), async (c) =>
    c.json(await listShares(c.var.userId, c.req.valid("param").id)),
  )
  .post(
    "/:id/share",
    validate("param", shareReportParamsSchema),
    validate("json", createShareSchema),
    async (c) =>
      c.json(
        await createShare(c.var.userId, c.req.valid("param").id, c.req.valid("json").days),
        201,
      ),
  )
  .delete("/:id/share/:shareId", validate("param", shareParamsSchema), async (c) => {
    const { id, shareId } = c.req.valid("param");
    await endShare(c.var.userId, id, shareId);
    return c.body(null, 204);
  });

/**
 * The export behind a share link, mounted before `auth` because the doctor has no account.
 *
 * @remarks
 * `no-store` keeps a proxy from serving the export after the link ends.
 */
export const sharedExportRoutes = new Hono().get("/:token", async (c) => {
  c.header("Cache-Control", "no-store");
  c.header("X-Robots-Tag", "noindex, nofollow");
  return c.json(await getSharedExport(c.req.param("token"), requestLocale(c)));
});
