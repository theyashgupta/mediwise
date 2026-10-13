import { z } from "zod";

export const dashboardQuerySchema = z.object({ profileId: z.uuid() });
