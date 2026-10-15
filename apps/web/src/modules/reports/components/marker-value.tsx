import { getIntlTag, useT } from "@/common/hooks/use-locale";
import { cn } from "@/lib/utils";

type Reading = { value: number; unit: string };

type MarkerValueProps = {
  value: number | null;
  valueText: string | null;
  unit: string | null;
  precision: number;
  printed?: Reading | null;
  equation?: string | null;
  className?: string;
};

function UnitText({ unit }: { unit: string | null }) {
  return unit && unit !== "ratio" ? (
    <span className="ml-1 text-[0.85em] font-normal text-muted-foreground">{unit}</span>
  ) : null;
}

export function MarkerValue({
  value,
  valueText,
  unit,
  precision,
  printed,
  equation,
  className,
}: MarkerValueProps) {
  const t = useT();
  const format = (number: number, digits: number) =>
    number.toLocaleString(getIntlTag(), { maximumFractionDigits: digits });
  const numeric = printed ?? (value === null ? null : { value, unit });
  return (
    <span className={cn("font-medium whitespace-nowrap", numeric && "font-mono", className)}>
      {numeric
        ? format(numeric.value, printed ? 3 : precision)
        : (valueText ?? t.report.markers.noValue)}
      <UnitText unit={numeric ? numeric.unit : unit} />
      {equation && (
        <span className="block font-sans text-sm font-normal text-muted-foreground">
          {equation}
        </span>
      )}
      {printed && value !== null && printed.value !== value && (
        <span
          className="block text-sm font-normal text-muted-foreground"
          data-testid="marker-canonical"
        >
          {format(value, precision)}
          <UnitText unit={unit} />
        </span>
      )}
    </span>
  );
}
