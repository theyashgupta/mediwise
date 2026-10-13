import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { markerLink } from "@/modules/reports";
import type { MarkerDetail } from "../types";

type MarkerNavProps = {
  reportId: string;
  previous: MarkerDetail["previous"];
  next: MarkerDetail["next"];
};

const linkClass =
  "flex min-w-0 items-center gap-2 rounded-xl border bg-card p-4 outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function MarkerNav({ reportId, previous, next }: MarkerNavProps) {
  if (!previous && !next) return null;
  return (
    <nav aria-label="Other markers in this report" className="grid gap-3 sm:grid-cols-2">
      {previous ? (
        <Link {...markerLink(reportId, previous.markerKey)} className={linkClass}>
          <ChevronLeft className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0">
            <span className="block text-xs text-muted-foreground">Previous marker</span>
            <span className="block truncate font-medium">{previous.name}</span>
          </span>
        </Link>
      ) : (
        <span className="hidden sm:block" />
      )}
      {next && (
        <Link
          {...markerLink(reportId, next.markerKey)}
          className={cn(linkClass, "sm:justify-end sm:text-right")}
        >
          <span className="min-w-0">
            <span className="block text-xs text-muted-foreground">Next marker</span>
            <span className="block truncate font-medium">{next.name}</span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </Link>
      )}
    </nav>
  );
}
