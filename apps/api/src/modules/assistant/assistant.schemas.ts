import { z } from "zod";

export const assistantParamsSchema = z.object({ id: z.uuid() });

/** Body of `POST /profiles/:id/questions`. */
export const askQuestionSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, "Write a question")
    .max(500, "Write 500 characters or fewer")
    .refine((text) => !text.includes("\u0000"), "Remove the hidden characters from the question"),
  reportId: z.uuid().optional(),
});
export type AskQuestionInput = z.infer<typeof askQuestionSchema>;
