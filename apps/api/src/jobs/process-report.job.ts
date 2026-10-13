import { z } from "zod";
import type { ReportUsage } from "../modules/extraction/index.js";
import { chargeReport } from "../modules/credits/index.js";
import { failReport, pauseReport, processReport } from "../modules/reports/index.js";

const payloadSchema = z.object({ reportId: z.uuid() });

/** Debits the report's credit, then reads it. A retry or a resumed job is not debited again. */
export async function handleProcessReport(payload: unknown, usage: ReportUsage) {
  const { reportId } = payloadSchema.parse(payload);
  await chargeReport(reportId);
  await processReport(reportId, usage);
}

/** Marks the job's report failed once the worker gives up on it. */
export async function failProcessReport(payload: unknown, error: unknown) {
  const parsed = payloadSchema.safeParse(payload);
  if (parsed.success) await failReport(parsed.data.reportId, error);
}

/** Shows the job's report as paused while the spend guard holds the job. */
export async function pauseProcessReport(payload: unknown) {
  const parsed = payloadSchema.safeParse(payload);
  if (parsed.success) await pauseReport(parsed.data.reportId);
}
