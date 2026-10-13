import type { ReportStatus } from "@mediwise/shared";
import { useT } from "@/common/hooks/use-locale";
import { Badge } from "@/components/ui/badge";

type ReportStatusBadgeProps = {
  status: ReportStatus;
};

export function ReportStatusBadge({ status }: ReportStatusBadgeProps) {
  const t = useT();
  return (
    <Badge
      variant={status === "failed" ? "destructive" : status === "done" ? "secondary" : "outline"}
    >
      {t.report.status[status]}
    </Badge>
  );
}
