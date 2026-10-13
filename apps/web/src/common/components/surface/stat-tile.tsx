import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { type Status, statusStyles } from "@/common/utils/status";

type StatTileProps = {
  label: string;
  value: ReactNode;
  unit?: string;
  status?: Status;
  className?: string;
};

export function StatTile({ label, value, unit, status, className }: StatTileProps) {
  return (
    <div className={cn("min-w-0 rounded-lg border bg-card px-4 py-3", className)}>
      <dt className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
        {status && (
          <span className={cn("size-1.5 shrink-0 rounded-full", statusStyles[status].mark)} />
        )}
        {label}
      </dt>
      <dd className="mt-1 font-mono text-2xl leading-8 font-medium">
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>}
      </dd>
    </div>
  );
}
