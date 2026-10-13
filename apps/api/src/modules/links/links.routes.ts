import { Hono } from "hono";
import { validate } from "../../common/validate.js";
import type { AuthEnv } from "../../middleware/auth.js";
import {
  createLinkSchema,
  linkParamsSchema,
  linkReportParamsSchema,
  linkStateSchema,
} from "./links.schemas.js";
import { linkReports, setLinkState } from "./links.service.js";

export const linksRoutes = new Hono<AuthEnv>()
  .post(
    "/:id/links",
    validate("param", linkReportParamsSchema),
    validate("json", createLinkSchema),
    async (c) => {
      const { reportId, kind } = c.req.valid("json");
      return c.json(await linkReports(c.var.userId, c.req.valid("param").id, reportId, kind), 201);
    },
  )
  .patch(
    "/:id/links/:linkId",
    validate("param", linkParamsSchema),
    validate("json", linkStateSchema),
    async (c) => {
      const { id, linkId } = c.req.valid("param");
      return c.json(await setLinkState(c.var.userId, id, linkId, c.req.valid("json").state));
    },
  );
