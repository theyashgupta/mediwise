import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Section } from "@/common/components/section";
import { useT } from "@/common/hooks/use-locale";
import { StatusBadge } from "@/common/components/status-badge";
import { statusStyles } from "@/common/utils/status";
import { cn } from "@/lib/utils";
import { MarkerValue, markerLink } from "@/modules/reports";
import type { MoveFirstMarker } from "../types";

type AttentionListProps = {
  reportId: string;
  markers: MoveFirstMarker[];
  flaggedCount: number;
};

const rowLink =
  "outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset";

export function AttentionList({ reportId, markers, flaggedCount }: AttentionListProps) {
  const text = useT().dashboard.attention;
  return (
    <Section
      id="needs-attention"
      title={text.title}
      action={
        flaggedCount > 0 && (
          <Link
            to="/reports/$reportId"
            params={{ reportId }}
            search={{ show: "attention" }}
            className="rounded-sm text-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {text.seeAll(flaggedCount)}
          </Link>
        )
      }
    >
      {markers.length === 0 ? (
        <p className="rounded-xl border bg-card p-4 text-muted-foreground">{text.none}</p>
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {markers.map((marker) => (
            <li key={`${marker.markerKey}-${marker.name}`}>
              <Link
                {...(marker.markerKey
                  ? markerLink(marker.reportId, marker.markerKey)
                  : { to: "/reports/$reportId", params: { reportId: marker.reportId } })}
                className={cn("flex items-center gap-3 py-3 pr-3 pl-4", rowLink)}
              >
                <span
                  className={cn(
                    "h-9 w-1 shrink-0 rounded-full",
                    marker.status ? statusStyles[marker.status].mark : "bg-muted",
                  )}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{marker.name}</span>
                  {marker.description && (
                    <span className="block truncate text-sm text-muted-foreground">
                      {marker.description}
                    </span>
                  )}
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  {marker.value !== null && (
                    <MarkerValue
                      value={marker.value}
                      valueText={null}
                      unit={marker.unit}
                      precision={2}
                      className="text-sm"
                    />
                  )}
                  {marker.status && <StatusBadge status={marker.status} />}
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
