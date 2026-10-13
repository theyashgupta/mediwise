import { z } from "zod";

export const yearReviewParamsSchema = z.object({ id: z.uuid() });
