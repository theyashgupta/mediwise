import { RotateCcw } from "lucide-react";
import { Section } from "@/common/components/section";
import { formatPlainDate } from "@/common/utils/date";
import { Button } from "@/components/ui/button";
import { errorClassLabels } from "../config/admin";
import type { FailedReport } from "../types";

type FailedReadsProps = {
  failed: FailedReport[];
  retryingId: string | undefined;
  onRetry: (id: string) => void;
};

export function FailedReads({ failed, retryingId, onRetry }: FailedReadsProps) {
  return (
    <Section
      id="admin-failed"
      title="Failed reads"
      description="The 50 newest. Re-read uses the credit of the owner."
    >
      {failed.length === 0 ? (
        <p className="text-sm text-muted-foreground">No read failed.</p>
      ) : (
        <ul className="divide-y rounded-xl border" data-testid="admin-failed">
          {failed.map((report) => (
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
  );
}
