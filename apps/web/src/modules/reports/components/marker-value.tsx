import { cn } from "@/lib/utils";

type MarkerValueProps = {
  value: number | null;
  valueText: string | null;
  unit: string | null;
  precision: number;
  className?: string;
};

export function MarkerValue({ value, valueText, unit, precision, className }: MarkerValueProps) {
  const text =
    value === null
      ? (valueText ?? "No value")
      : value.toLocaleString("en-IN", { maximumFractionDigits: precision });
  return (
    <span className={cn("font-medium whitespace-nowrap", value !== null && "font-mono", className)}>
      {text}
      {unit && unit !== "ratio" && (
        <span className="ml-1 text-[0.85em] font-normal text-muted-foreground">{unit}</span>
      )}
    </span>
  );
}
