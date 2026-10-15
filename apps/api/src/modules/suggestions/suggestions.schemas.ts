import { z } from "zod";

export const suggestionsParamsSchema = z.object({ id: z.uuid() });
