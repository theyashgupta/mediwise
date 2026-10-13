import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { chipClass, markerLink } from "../config/report";

type MarkerChipProps = {
  reportId: string;
  markerKey: string;
  value?: string;
  children: ReactNode;
};

export function MarkerChip({ reportId, markerKey, value, children }: MarkerChipProps) {
  return (
    <Badge asChild variant="outline" className={chipClass}>
      <Link {...markerLink(reportId, markerKey)}>
        {children}
        {value && <span className="font-mono text-muted-foreground">{value}</span>}
      </Link>
    </Badge>
  );
}
