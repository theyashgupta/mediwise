import { useT } from "../hooks/use-locale";
import { formatRange } from "../utils/range-scale";

type Bounds = { low: number | null; high: number | null };

export type LabInfo = {
  name: string | null;
  range: Bounds | null;
  optimalRange: Bounds | null;
  change: boolean;
};

type ValueTooltipProps = {
  date: string;
  value: string;
  lab?: LabInfo;
  sameDay?: { value: string; labName: string | null }[];
  unit?: string;
  episode?: string | null;
};

function rangeText(range: Bounds | null, unit: string | undefined, empty: string) {
  if (!range) return empty;
  return formatRange({ low: range.low ?? undefined, high: range.high ?? undefined }, unit);
}

export function ValueTooltip({ date, value, lab, sameDay = [], unit, episode }: ValueTooltipProps) {
  const t = useT();
  const { chart, range } = t.common;
  const withUnit = (text: string) => `${text}${unit ? ` ${unit}` : ""}`;
  const rows = lab
    ? [
        [chart.lab, lab.name ?? chart.notPrinted],
        [range.lab, rangeText(lab.range, unit, chart.notPrinted)],
        [range.optimal, rangeText(lab.optimalRange, unit, chart.none)],
      ]
    : [];
  if (episode) rows.push([chart.episode, episode]);
  return (
    <div className="grid min-w-48 gap-1.5 rounded-lg border bg-background px-3 py-2 text-xs shadow-xl">
      <p className="font-medium">{date}</p>
      <p className="font-mono text-sm font-medium">{withUnit(value)}</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        {rows.map(([term, detail]) => (
          <div key={term} className="contents">
            <dt className="text-muted-foreground">{term}</dt>
            <dd className="text-right text-foreground">{detail}</dd>
          </div>
        ))}
      </dl>
      {lab?.change && <p className="text-muted-foreground">{chart.labChangedSentence}</p>}
      {sameDay.length > 0 && (
        <div className="grid gap-1 border-t pt-1.5">
          <p className="text-muted-foreground">{chart.sameDay}</p>
          {sameDay.map((other, index) => (
            <p key={index} className="flex justify-between gap-3">
              <span className="font-mono">{withUnit(other.value)}</span>
              <span className="text-muted-foreground">{other.labName ?? chart.notPrinted}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
