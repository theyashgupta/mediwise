import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatChange } from "../config/trends";
import type { Change } from "../types";

type ChangeLabelProps = {
  change: Change;
  precision: number;
  unit: string | null;
  className?: string;
};

export function ChangeLabel({ change, precision, unit, className }: ChangeLabelProps) {
  const Arrow =
    !change || change.absolute === 0 ? ArrowRight : change.absolute > 0 ? ArrowUp : ArrowDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono text-sm font-medium whitespace-nowrap",
        className,
      )}
    >
      <Arrow className="size-4 shrink-0" aria-hidden />
      {formatChange(change, precision, unit)}
    </span>
  );
}
