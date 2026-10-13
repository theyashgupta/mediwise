import { z } from "zod";

export const trendsQuerySchema = z.object({ profileId: z.uuid() });

export const trendParamsSchema = z.object({
  markerKey: z.string().regex(/^[a-z][a-z0-9_]{0,63}$/),
});

export const compareQuerySchema = z
  .object({ a: z.uuid().optional(), b: z.uuid().optional(), profileId: z.uuid().optional() })
  .refine(({ b, profileId }) => b !== undefined || profileId !== undefined, {
    message: "Give b or profileId",
  });

export const earlierQuerySchema = z.object({ reportId: z.uuid() });

export type CompareQuery = z.infer<typeof compareQuerySchema>;
