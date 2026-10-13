import { z } from "zod";

export const narrativeHeadings = [
  "The headline",
  "What stands out",
  "What looks good",
  "What to do next",
] as const;

/** The plain-English narrative Claude writes from the engine output, one cited sentence at a time. */
export const narrativeSchema = z.object({
  sections: z.array(
    z.object({
      heading: z.enum(narrativeHeadings),
      sentences: z.array(
        z.object({
          text: z.string().trim().min(1).describe("One sentence of 20 words or fewer"),
          markerKeys: z
            .array(z.string())
            .describe("Marker keys and pattern keys from the allowed list that this sentence uses"),
        }),
      ),
    }),
  ),
});
export type Narrative = z.infer<typeof narrativeSchema>;
