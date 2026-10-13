import { StatusBadge } from "@/common/components/status-badge";
import { formatRange } from "@/common/utils/range-scale";
import { MarkerValue } from "@/modules/reports";
import type { MarkerDetail } from "../types";

type MarkerHeaderProps = {
  marker: MarkerDetail["marker"];
};

export function MarkerHeader({ marker }: MarkerHeaderProps) {
  const lab = marker.labRange;
  const unit = marker.unit && marker.unit !== "ratio" ? marker.unit : undefined;
  return (
    <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1.5">
        <h1 className="font-display text-display text-balance">{marker.name}</h1>
        <p className="max-w-measure text-muted-foreground">{marker.description}</p>
      </div>
      <div className="space-y-1.5 sm:text-right">
        <div className="flex items-center gap-3 sm:justify-end">
          <MarkerValue
            value={marker.value}
            valueText={marker.valueText}
            unit={marker.unit}
            precision={marker.precision}
            className="text-3xl"
          />
          <StatusBadge status={marker.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          {lab
            ? `Lab range: ${formatRange({ low: lab.low ?? undefined, high: lab.high ?? undefined }, unit)}`
            : "The report shows no lab range."}
        </p>
      </div>
    </header>
  );
}
