import { Section } from "@/common/components/section";
import { useT } from "@/common/hooks/use-locale";
import type { Suggestion } from "../types";
import { SuggestionDisclaimer } from "./suggestion-disclaimer";
import { SuggestionRow } from "./suggestion-row";
import { TrendsLink } from "./trends-link";

type HabitListProps = {
  habits: Suggestion[];
  questions: Suggestion[];
};

export function HabitList({ habits, questions }: HabitListProps) {
  const text = useT().dashboard.habits;
  const first = habits[0] ?? questions[0];
  if (!first) return null;
  const groups = [
    { id: "habit-group-habits", title: text.habits, items: habits },
    { id: "habit-group-questions", title: text.questions, items: questions },
  ].filter(({ items }) => items.length > 0);
  return (
    <Section
      id="habits-and-questions"
      title={text.title}
      description={text.source}
      action={<TrendsLink />}
    >
      {groups.map(({ id, title, items }) => (
        <div key={id} className="space-y-2">
          <h3 id={id} className="text-sm font-medium text-muted-foreground">
            {title}
          </h3>
          <ul aria-labelledby={id} className="divide-y overflow-hidden rounded-xl border bg-card">
            {items.map((suggestion) => (
              <SuggestionRow key={suggestion.rank} suggestion={suggestion} />
            ))}
          </ul>
        </div>
      ))}
      <SuggestionDisclaimer text={first.disclaimer} />
    </Section>
  );
}
