import { useT } from "@/common/hooks/use-locale";
import { SourceList } from "@/common/components/source-list";
import { StatusBadge } from "@/common/components/status-badge";
import { conditionValue } from "../config/report";
import type { ReportDetail } from "../types";
import { InsightCard } from "./insight-card";
import { MarkerChip } from "./marker-chip";

type PatternListProps = {
  reportId: string;
  items: ReportDetail["patterns"];
};

export function PatternList({ reportId, items }: PatternListProps) {
  const t = useT();
  return (
    <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
      {items.map((item) => (
        <li key={item.key} id={`pattern-${item.key}`} className="scroll-mt-20">
          <InsightCard title={item.name} badge={<StatusBadge status={item.severity} />}>
            <p className="text-sm text-muted-foreground">{item.description}</p>
            <ul className="flex flex-wrap gap-1.5" aria-label={t.report.patterns.markers}>
              {item.matched.map((condition) => (
                <li key={condition.name}>
                  <MarkerChip
                    reportId={reportId}
                    markerKey={condition.markerKey}
                    value={conditionValue(condition.value, condition.unit)}
                  >
                    {condition.name}
                  </MarkerChip>
                </li>
              ))}
            </ul>
            <p className="text-sm">{item.whatItSuggests}</p>
            <p className="rounded-lg bg-muted px-3 py-2 text-sm">
              <span className="font-medium">{t.report.patterns.whatToDo}</span>
              {item.whatToDo}
            </p>
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground">
                {t.report.patterns.sources(item.sources.length)}
              </summary>
              <div className="pt-2">
                <SourceList sources={item.sources} />
              </div>
            </details>
          </InsightCard>
        </li>
      ))}
    </ul>
  );
}
