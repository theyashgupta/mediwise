import { reportLinkKinds } from "@mediwise/shared";
import { z } from "zod";

export const linkReportParamsSchema = z.object({ id: z.uuid() });

export const linkParamsSchema = z.object({ id: z.uuid(), linkId: z.uuid() });

/** Body of `POST /reports/:id/links`. */
export const createLinkSchema = z.object({
  reportId: z.uuid("Select a report"),
  kind: z.enum(reportLinkKinds),
});

/** Body of `PATCH /reports/:id/links/:linkId`. */
export const linkStateSchema = z.object({ state: z.enum(["confirmed", "dismissed"]) });
