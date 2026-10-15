import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useT } from "@/common/hooks/use-locale";
import { type Status, statusStyles } from "@/common/utils/status";
import { cn } from "@/lib/utils";
import { studiesLink } from "@/modules/reports";
import type { Suggestion } from "../types";
import { MarkerChipList } from "./marker-chip-list";

type SuggestionRowProps = {
  suggestion: Suggestion;
  tone?: Status;
  badge?: ReactNode;
};

export function SuggestionRow({ suggestion, tone, badge }: SuggestionRowProps) {
  const text = useT().dashboard.suggestion;
  return (
    <li data-testid={`suggestion-${suggestion.kind}`} className="flex gap-3 py-3 pr-3 pl-4">
      {tone && (
        <span
          className={cn("w-1 shrink-0 self-stretch rounded-full", statusStyles[tone].mark)}
          aria-hidden
        />
      )}
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium">{suggestion.title}</p>
          {badge}
        </div>
        <p className="text-sm text-muted-foreground">{suggestion.why}</p>
        <p className="text-sm">{suggestion.next}</p>
        {suggestion.markers.length > 0 ? (
          <MarkerChipList label={text.markers} markers={suggestion.markers} />
        ) : (
          suggestion.kind === "doctor_now" && (
            <Link
              {...studiesLink(suggestion.reportId)}
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {text.openStudy}
            </Link>
          )
        )}
      </div>
    </li>
  );
}
