import { conditionValue, MarkerChip } from "@/modules/reports";

type MarkerChipListProps = {
  label: string;
  markers: {
    markerKey: string;
    name: string;
    value: number | string;
    unit: string | null;
    reportId: string;
  }[];
};

export function MarkerChipList({ label, markers }: MarkerChipListProps) {
  return (
    <ul aria-label={label} className="flex flex-wrap gap-1.5">
      {markers.map((marker) => (
        <li key={marker.name}>
          <MarkerChip
            reportId={marker.reportId}
            markerKey={marker.markerKey}
            value={conditionValue(marker.value, marker.unit ?? "")}
          >
            {marker.name}
          </MarkerChip>
        </li>
      ))}
    </ul>
  );
}
