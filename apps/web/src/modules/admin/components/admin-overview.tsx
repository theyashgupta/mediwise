import type { InferResponseType } from "hono/client";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Section } from "@/common/components/section";
import { formatPlainDate } from "@/common/utils/date";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { api } from "@/lib/api";
import {
  errorClassLabels,
  formatCents,
  formatCount,
  formatPaise,
  formatWait,
} from "../config/admin";
import { ReadsChart } from "./reads-chart";

type Overview = Exclude<InferResponseType<typeof api.admin.overview.$get, 200>, null>;

type AdminOverviewProps = {
  overview: Overview;
  retryingId: string | undefined;
  onRetry: (id: string) => void;
};

function Stat({ label, value, testId }: { label: string; value: string; testId: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-mono text-2xl font-semibold" data-testid={testId}>
        {value}
      </dd>
    </div>
  );
}

const grid = "grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4";

export function AdminOverview({ overview, retryingId, onRetry }: AdminOverviewProps) {
  const { spend, queue, credits, people } = overview;
  const share = spend.capCents > 0 ? Math.round((spend.monthCents / spend.capCents) * 100) : 100;
  return (
    <div className="space-y-12">
      {overview.alerts.length > 0 && (
        <div role="alert" className="space-y-2" data-testid="admin-alerts">
          {overview.alerts.map((alert) => (
            <p
              key={alert}
              data-testid={`admin-alert-${alert}`}
              className="flex items-center gap-2 rounded-lg border border-destructive/40 px-4 py-3 text-sm text-destructive"
            >
              <AlertTriangle aria-hidden className="size-4 shrink-0" />
              {alert === "spend"
                ? `Claude spend is at ${share}% of the monthly cap. At 100%, reading stops.`
                : `A job is in the queue for ${formatWait(queue.oldestQueuedMs ?? 0)}. Examine the worker.`}
            </p>
          ))}
        </div>
      )}

      <Section
        id="admin-spend"
        title="Claude spend"
        description="UTC days. A week starts on Monday."
      >
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>
              {formatCents(spend.monthCents)} of {formatCents(spend.capCents)} this month
            </span>
            <span className="font-mono">{share}%</span>
          </div>
          <Progress value={Math.min(share, 100)} aria-label="Monthly cap used" />
        </div>
        <dl className={grid}>
          <Stat label="Today" value={formatCents(spend.todayCents)} testId="admin-spend-today" />
          <Stat label="This week" value={formatCents(spend.weekCents)} testId="admin-spend-week" />
          <Stat
            label="This month"
            value={formatCents(spend.monthCents)}
            testId="admin-spend-month"
          />
          <Stat
            label="Reads this month"
            value={formatCount(spend.reads)}
            testId="admin-reads-month"
          />
          <Stat
            label="Questions this month"
            value={formatCount(spend.questions)}
            testId="admin-questions-month"
          />
          <Stat
            label="Purchases this month"
            value={`${formatCount(spend.purchases)} · ${formatPaise(spend.revenuePaise)}`}
            testId="admin-purchases-month"
          />
        </dl>
      </Section>

      <Section
        id="admin-reads"
        title="Reads per day"
        description={
          overview.meanCostPerReadCents === null
            ? "No reads in the last 30 days."
            : `Mean cost per read in 30 days: ${formatCents(overview.meanCostPerReadCents)}.`
        }
      >
        <ReadsChart days={overview.days} />
      </Section>

      <Section id="admin-queue" title="Queue">
        <dl className={grid}>
          <Stat label="Jobs waiting" value={formatCount(queue.depth)} testId="admin-queue-depth" />
          <Stat
            label="Oldest wait"
            value={queue.oldestQueuedMs === null ? "None" : formatWait(queue.oldestQueuedMs)}
            testId="admin-queue-oldest"
          />
        </dl>
      </Section>

      <Section id="admin-credits" title="Credits" description="All time, every user.">
        <dl className={grid}>
          <Stat
            label="Granted"
            value={formatCount(credits.granted)}
            testId="admin-credits-granted"
          />
          <Stat
            label="Bought"
            value={formatCount(credits.purchased)}
            testId="admin-credits-purchased"
          />
          <Stat
            label="Spent on reads"
            value={formatCount(credits.spentOnReads)}
            testId="admin-credits-reads"
          />
          <Stat
            label="Spent on questions"
            value={formatCount(credits.spentOnQuestions)}
            testId="admin-credits-questions"
          />
        </dl>
      </Section>

      <Section
        id="admin-people"
        title="Profiles and users"
        description="Active means a report added in the last 30 days."
      >
        <dl className={grid}>
          <Stat label="Profiles" value={formatCount(people.profiles)} testId="admin-profiles" />
          <Stat label="Users" value={formatCount(people.users)} testId="admin-users" />
          <Stat
            label="Active profiles"
            value={formatCount(people.activeProfiles)}
            testId="admin-active-profiles"
          />
          <Stat
            label="Active users"
            value={formatCount(people.activeUsers)}
            testId="admin-active-users"
          />
        </dl>
      </Section>

      <Section
        id="admin-failed"
        title="Failed reads"
        description="The 50 newest. Re-read uses the credit of the owner."
      >
        {overview.failed.length === 0 ? (
          <p className="text-sm text-muted-foreground">No read failed.</p>
        ) : (
          <ul className="divide-y rounded-xl border" data-testid="admin-failed">
            {overview.failed.map((report) => (
              <li
                key={report.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                data-testid={`admin-failed-${report.id}`}
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="font-medium">
                    {errorClassLabels[report.errorClass] ?? report.errorClass}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatPlainDate(report.createdAt, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · <span className="font-mono">{report.id.slice(0, 8)}</span>
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={retryingId === report.id}
                  onClick={() => onRetry(report.id)}
                  data-testid={`admin-retry-${report.id}`}
                >
                  <RotateCcw aria-hidden />
                  Re-read
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
