import { CalendarPlus } from "lucide-react";
import { Section } from "@/common/components/section";
import { useT } from "@/common/hooks/use-locale";
import { formatPlainDate } from "@/common/utils/date";
import { Button } from "@/components/ui/button";
import { isPastDue } from "../config/calendar-file";
import type { RetestDate } from "../types";

type RetestListProps = {
  retests: RetestDate[];
  today: Date;
  onAddToCalendar: (retest: RetestDate) => void;
};

export function RetestList({ retests, today, onAddToCalendar }: RetestListProps) {
  const text = useT().dashboard.retest;
  return (
    <Section id="due-for-retest" title={text.title}>
      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {retests.map((retest) => {
          const date = formatPlainDate(retest.dueOn, {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
          return (
            <li
              key={retest.markerKey}
              className="flex items-center gap-3 py-3 pr-3 pl-4"
              data-testid={`retest-row-${retest.markerKey}`}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{retest.name}</span>
                <span className="block text-sm text-muted-foreground">
                  {isPastDue(retest.dueOn, today) ? text.dueSince(date) : text.dueOn(date)}
                </span>
              </span>
              <Button
                variant="outline"
                size="sm"
                aria-label={text.addLabel(retest.name)}
                onClick={() => onAddToCalendar(retest)}
              >
                <CalendarPlus aria-hidden />
                <span className="max-sm:sr-only">{text.add}</span>
              </Button>
            </li>
          );
        })}
      </ul>
      <p className="text-sm text-muted-foreground">{text.askDoctor}</p>
    </Section>
  );
}
