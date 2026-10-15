import { Section } from "@/common/components/section";
import { StatusBadge } from "@/common/components/status-badge";
import { useT } from "@/common/hooks/use-locale";
import { cn } from "@/lib/utils";
import { directionStyles } from "@/modules/trends";
import type { PatternTrend } from "../types";
import { MarkerChipList } from "./marker-chip-list";
import { SuggestionDisclaimer } from "./suggestion-disclaimer";
import { TrendsLink } from "./trends-link";

type PatternTrendListProps = {
  patterns: PatternTrend[];
  disclaimer: string;
};

const changeStyles: Record<NonNullable<PatternTrend["change"]>, string> = {
  new: directionStyles.worsening.badge,
  worsening: directionStyles.worsening.badge,
  improving: directionStyles.improving.badge,
  stable: directionStyles.stable.badge,
  cleared: directionStyles.improving.badge,
};

export function PatternTrendList({ patterns, disclaimer }: PatternTrendListProps) {
  const text = useT().dashboard.patterns;
  if (patterns.length === 0) return null;
  return (
    <Section
      id="patterns-across-reports"
      title={text.title}
      description={text.source}
      action={<TrendsLink />}
    >
      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {patterns.map((pattern) => {
          const cleared = pattern.change === "cleared";
          return (
            <li key={pattern.key} data-testid="pattern-row" className="space-y-2 py-3 pr-3 pl-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("font-medium", cleared && "text-muted-foreground")}>
                  {pattern.name}
                </span>
                {!cleared && <StatusBadge status={pattern.severity} />}
                {pattern.change && (
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-xs font-medium",
                      changeStyles[pattern.change],
                    )}
                  >
                    {text.change[pattern.change]}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{pattern.description}</p>
              {!cleared && <MarkerChipList label={text.markers} markers={pattern.matched} />}
            </li>
          );
        })}
      </ul>
      <SuggestionDisclaimer text={disclaimer} />
    </Section>
  );
}
