import { z } from "zod";

export const reportParamsSchema = z.object({ id: z.uuid() });

export const listReportsQuerySchema = z.object({
  profileId: z.uuid(),
  cursor: z.iso.datetime().optional(),
});

export const markerParamsSchema = z.object({
  id: z.uuid(),
  markerKey: z.string().regex(/^[a-z][a-z0-9_]{0,63}$/),
});
