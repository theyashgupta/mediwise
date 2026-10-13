import type { ReportStatus } from "@mediwise/shared";
import { Badge } from "@/components/ui/badge";
import { reportStatusLabels } from "../config/status";

type ReportStatusBadgeProps = {
  status: ReportStatus;
};

export function ReportStatusBadge({ status }: ReportStatusBadgeProps) {
  return (
    <Badge
      variant={status === "failed" ? "destructive" : status === "done" ? "secondary" : "outline"}
    >
      {reportStatusLabels[status]}
    </Badge>
  );
}
