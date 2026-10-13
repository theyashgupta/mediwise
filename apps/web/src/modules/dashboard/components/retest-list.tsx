import { CalendarPlus } from "lucide-react";
import { Section } from "@/common/components/section";
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
  return (
    <Section id="due-for-retest" title="Due for retest">
      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {retests.map((retest) => {
          const date = formatPlainDate(retest.dueOn, {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
          return (
            <li key={retest.markerKey} className="flex items-center gap-3 py-3 pr-3 pl-4">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{retest.name}</span>
                <span className="block text-sm text-muted-foreground">
                  {isPastDue(retest.dueOn, today) ? `Due since ${date}` : `Due on ${date}`}
                </span>
              </span>
              <Button
                variant="outline"
                size="sm"
                aria-label={`Add the ${retest.name} retest to your calendar`}
                onClick={() => onAddToCalendar(retest)}
              >
                <CalendarPlus aria-hidden />
                <span className="max-sm:sr-only">Add to calendar</span>
              </Button>
            </li>
          );
        })}
      </ul>
      <p className="text-sm text-muted-foreground">Ask your doctor before you book a retest.</p>
    </Section>
  );
}
