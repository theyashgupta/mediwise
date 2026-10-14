import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AskContainer } from "@/modules/assistant";

const askSearchSchema = z.object({
  report: z.uuid().optional().catch(undefined),
  q: z
    .string()
    .transform((q) => q.slice(0, 500) || undefined)
    .optional()
    .catch(undefined),
});

export const Route = createFileRoute("/_app/ask")({
  validateSearch: askSearchSchema,
  component: AskContainer,
});
