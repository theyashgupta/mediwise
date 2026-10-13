import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type Status, statusStyles } from "../utils/status";

type StatusBadgeProps = {
  status: Status;
  count?: number;
};

export function StatusBadge({ status, count }: StatusBadgeProps) {
  const style = statusStyles[status];
  return (
    <Badge className={cn("gap-1.5 rounded-md px-2 text-[0.8125rem]", style.badge)}>
      <span className={cn("size-1.5 rounded-full", style.mark)} aria-hidden />
      {count !== undefined && <span className="tabular-nums">{count}</span>}
      {style.label}
    </Badge>
  );
}
