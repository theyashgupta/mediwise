import { Link } from "@tanstack/react-router";
import { RangeBar } from "@/common/components/range-bar";
import { StatusBadge } from "@/common/components/status-badge";
import { markerLink } from "../config/report";
import type { MarkerRow as MarkerRowData } from "../types";
import { MarkerValue } from "./marker-value";

type MarkerRowProps = {
  reportId: string;
  marker: MarkerRowData;
};

const toBar = (range: MarkerRowData["labRange"]) =>
  range ? { low: range.low ?? undefined, high: range.high ?? undefined } : undefined;

export function MarkerRow({ reportId, marker }: MarkerRowProps) {
  const showBar = marker.value !== null && (marker.labRange || marker.calibratedRange);
  return (
    <Link
      {...markerLink(reportId, marker.markerKey)}
      className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-2 px-4 py-3 outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset sm:grid-cols-[minmax(0,1fr)_auto_10rem] sm:items-center"
    >
      <span className="min-w-0 space-y-0.5">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{marker.name}</span>
          <StatusBadge status={marker.status} />
        </span>
        <span className="block text-sm text-muted-foreground sm:truncate">
          {marker.description}
        </span>
      </span>
      <MarkerValue
        value={marker.value}
        valueText={marker.valueText}
        unit={marker.unit}
        precision={marker.precision}
        className="text-right"
      />
      {showBar && marker.value !== null && (
        <span className="col-span-2 sm:col-span-1">
          <RangeBar
            value={marker.value}
            unit={marker.unit ?? undefined}
            status={marker.status}
            labRange={toBar(marker.labRange)}
            calibratedRange={toBar(marker.calibratedRange)}
            legend={false}
          />
        </span>
      )}
    </Link>
  );
}
