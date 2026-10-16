import { z } from "zod";

export const exportQuerySchema = z.object({ files: z.literal("1").optional() });
