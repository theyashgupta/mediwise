import { beforeEach, expect, test, vi } from "vitest";
import { env } from "../config/env.js";
import { parkIfOverBudget, resumeIfUnderBudget } from "./budget.js";

const edge = vi.hoisted(() => ({
  tokens: { inputTokens: 0, outputTokens: 0, reads: 0 },
  jobs: new Map<string, string>(),
  statuses: [] as unknown[][],
  warnings: [] as string[],
}));

vi.mock("../modules/spend/spend.repo.js", () => ({
  listQuestionsThisMonth: async () => [],
  listJobsThisMonth: async () => [{ userId: null, status: "done", usage: null, ...edge.tokens }],
  parkJob: async (id: string) => edge.jobs.set(id, "paused_budget"),
  resumeParkedJobs: async () => {
    const parked = [...edge.jobs].filter(([, status]) => status === "paused_budget");
    parked.forEach(([id]) => edge.jobs.set(id, "queued"));
    return parked.length;
  },
}));
vi.mock("../modules/reports/reports.repo.js", () => ({
  updateReportStatus: async (...args: unknown[]) => edge.statuses.push(args),
}));
vi.mock("../middleware/logger.js", () => ({
  log: {
    info: () => undefined,
    warn: (...args: unknown[]) => edge.warnings.push(args.join(" ")),
    error: () => undefined,
  },
}));

const reportId = "0b8f7a52-2a4e-4f3c-9d5e-6f1a2b3c4d5e";
const job = { id: "job-1", kind: "process_report", payload: { reportId } };

beforeEach(() => {
  edge.tokens = { inputTokens: 10_000, outputTokens: 0, reads: 1 };
  edge.jobs.clear();
  edge.jobs.set(job.id, "running");
  edge.statuses.length = 0;
});

test("over the cap the job is parked, its report shows paused, and one warning is logged per hour", async () => {
  env.CLAUDE_MONTHLY_CAP_CENTS = 1;

  expect(await parkIfOverBudget(job)).toBe(true);
  await resumeIfUnderBudget();

  expect(edge.jobs.get(job.id)).toBe("paused_budget");
  expect(edge.statuses).toEqual([[reportId, "paused"]]);
  expect(edge.warnings).toHaveLength(1);
  expect(edge.warnings[0]).toContain("spent_cents=2.00 cap_cents=1");
});

test("raising the cap resumes parked jobs on the next poll and lets new jobs run", async () => {
  edge.jobs.set(job.id, "paused_budget");
  env.CLAUDE_MONTHLY_CAP_CENTS = 2000;

  await resumeIfUnderBudget();

  expect(edge.jobs.get(job.id)).toBe("queued");
  expect(await parkIfOverBudget(job)).toBe(false);
});
