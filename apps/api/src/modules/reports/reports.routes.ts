import { createReportSchema, reportNoteSchema } from "@mediwise/shared";
import { Hono } from "hono";
import { requestLocale } from "../../common/locale.js";
import { validate } from "../../common/validate.js";
import type { AuthEnv } from "../../middleware/auth.js";
import {
  listReportsQuerySchema,
  markerParamsSchema,
  reportParamsSchema,
} from "./reports.schemas.js";
import {
  createReport,
  deleteReport,
  getMarkerDetail,
  getReportDetail,
  listReports,
  markReportUploaded,
  retryReport,
  setReportNote,
  translateReport,
} from "./reports.service.js";

export const reportsRoutes = new Hono<AuthEnv>()
  .get("/", validate("query", listReportsQuerySchema), async (c) => {
    const { profileId, cursor } = c.req.valid("query");
    return c.json(await listReports(c.var.userId, profileId, cursor));
  })
  .post("/", validate("json", createReportSchema), async (c) =>
    c.json(await createReport(c.var.userId, c.req.valid("json")), 201),
  )
  .post("/:id/uploaded", validate("param", reportParamsSchema), async (c) =>
    c.json(await markReportUploaded(c.var.userId, c.req.valid("param").id)),
  )
  .post("/:id/retry", validate("param", reportParamsSchema), async (c) =>
    c.json(await retryReport(c.var.userId, c.req.valid("param").id)),
  )
  .get("/:id", validate("param", reportParamsSchema), async (c) =>
    c.json(await getReportDetail(c.var.userId, c.req.valid("param").id, requestLocale(c))),
  )
  .post("/:id/translation", validate("param", reportParamsSchema), async (c) =>
    c.json(await translateReport(c.var.userId, c.req.valid("param").id)),
  )
  .put(
    "/:id/note",
    validate("param", reportParamsSchema),
    validate("json", reportNoteSchema),
    async (c) =>
      c.json(await setReportNote(c.var.userId, c.req.valid("param").id, c.req.valid("json").note)),
  )
  .get("/:id/markers/:markerKey", validate("param", markerParamsSchema), async (c) => {
    const { id, markerKey } = c.req.valid("param");
    return c.json(await getMarkerDetail(c.var.userId, id, markerKey, requestLocale(c)));
  })
  .delete("/:id", validate("param", reportParamsSchema), async (c) => {
    await deleteReport(c.var.userId, c.req.valid("param").id);
    return c.body(null, 204);
  });
