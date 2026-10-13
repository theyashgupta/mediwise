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
  lab: LabInfo;
  unit?: string;
};

function rangeText(range: Bounds | null, unit: string | undefined, empty: string) {
  if (!range) return empty;
  return formatRange({ low: range.low ?? undefined, high: range.high ?? undefined }, unit);
}

export function ValueTooltip({ date, value, lab, unit }: ValueTooltipProps) {
  const rows = [
    ["Lab", lab.name ?? "Not printed"],
    ["Lab range", rangeText(lab.range, unit, "Not printed")],
    ["Optimal range", rangeText(lab.optimalRange, unit, "None")],
  ];
  return (
    <div className="grid min-w-48 gap-1.5 rounded-lg border bg-background px-3 py-2 text-xs shadow-xl">
      <p className="font-medium">{date}</p>
      <p className="font-mono text-sm font-medium">
        {value}
        {unit ? ` ${unit}` : ""}
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        {rows.map(([term, detail]) => (
          <div key={term} className="contents">
            <dt className="text-muted-foreground">{term}</dt>
            <dd className="text-right text-foreground">{detail}</dd>
          </div>
        ))}
      </dl>
      {lab.change && <p className="text-muted-foreground">The lab changed at this result.</p>}
    </div>
  );
}
