import { Section } from "@/common/components/section";
import { useT } from "@/common/hooks/use-locale";
import { statusStyles } from "@/common/utils/status";
import { cn } from "@/lib/utils";
import type { Suggestion } from "../types";
import { SuggestionDisclaimer } from "./suggestion-disclaimer";
import { SuggestionRow } from "./suggestion-row";
import { TrendsLink } from "./trends-link";

type DoctorListProps = {
  suggestions: Suggestion[];
};

export function DoctorList({ suggestions }: DoctorListProps) {
  const text = useT().dashboard.doctor;
  if (!suggestions[0]) return null;
  return (
    <Section id="see-a-doctor" title={text.title} description={text.source} action={<TrendsLink />}>
      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {suggestions.map((suggestion) => {
          const tone = suggestion.kind === "doctor_now" ? "risk" : "watch";
          return (
            <SuggestionRow
              key={suggestion.rank}
              suggestion={suggestion}
              tone={tone}
              badge={
                <span
                  className={cn(
                    "shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium",
                    statusStyles[tone].badge,
                  )}
                >
                  {tone === "risk" ? text.now : text.soon}
                </span>
              }
            />
          );
        })}
      </ul>
      <SuggestionDisclaimer text={suggestions[0].disclaimer} />
    </Section>
  );
}
