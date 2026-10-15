import { z } from "zod";

export const reportParamsSchema = z.object({ id: z.uuid() });

/** Validates the credit history filters: UTC days from and to, both included, and one user id. */
export const creditsQuerySchema = z.object({
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  userId: z.string().min(1).max(100).optional(),
});

export type CreditsQuery = z.infer<typeof creditsQuerySchema>;
