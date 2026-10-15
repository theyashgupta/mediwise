import { z } from "zod";

const text = z.string().trim().min(1);

/**
 * What Claude reads off a lab report, copied as printed.
 *
 * @remarks
 * A value that is not a plain number ("Negative", "<5") stays a string. The engine scores it only when a catalog text rule matches.
 */
export const extractedReportSchema = z.object({
  lab: z.object({ name: text.optional(), location: text.optional() }).optional(),
  patient: z
    .object({
      name: text.optional(),
      ageYears: z.number().optional(),
      ageMonths: z.number().optional(),
      ageDays: z.number().optional(),
      sex: text.optional(),
    })
    .optional(),
  collectedAt: z.iso.date().optional().describe("Sample collection date as YYYY-MM-DD"),
  reportedAt: z.iso.date().optional().describe("Report date as YYYY-MM-DD"),
  dateAmbiguous: z
    .boolean()
    .optional()
    .describe("The printed dates can read as day first or month first"),
  markers: z.array(
    z.object({
      rawName: text.describe("Test name exactly as printed"),
      panel: text
        .optional()
        .describe(
          "Main heading of the test group, as printed, for example Complete Urine Examination",
        ),
      value: z
        .union([z.number(), text])
        .describe("A number when the printed result is a plain number, otherwise the text"),
      unit: text.optional(),
      referenceText: text.optional().describe("Printed reference range, verbatim"),
      referenceLow: z.number().optional(),
      referenceHigh: z.number().optional(),
      flag: text.optional().describe("Printed flag such as H, L or *"),
      pageIndex: z.number().int().describe("Zero-based page or photo the test is printed on"),
    }),
  ),
  notes: text.optional(),
});
export type ExtractedReport = z.infer<typeof extractedReportSchema>;
export type ExtractedMarker = ExtractedReport["markers"][number];
