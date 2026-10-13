import { useT } from "@/common/hooks/use-locale";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type Status, statusStyles } from "../utils/status";

type StatusBadgeProps = {
  status: Status;
  count?: number;
};

export function StatusBadge({ status, count }: StatusBadgeProps) {
  const style = statusStyles[status];
  const t = useT();
  return (
    <Badge className={cn("gap-1.5 rounded-md px-2 text-[0.8125rem]", style.badge)}>
      <span className={cn("size-1.5 rounded-full", style.mark)} aria-hidden />
      {count !== undefined && <span className="tabular-nums">{count}</span>}
      {t.common.status[status]}
    </Badge>
  );
}
