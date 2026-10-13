import { z } from "zod";

export const shareReportParamsSchema = z.object({ id: z.uuid() });

export const shareParamsSchema = z.object({ id: z.uuid(), shareId: z.uuid() });

export const createShareSchema = z.object({ days: z.int().min(1).max(30).default(7) });
