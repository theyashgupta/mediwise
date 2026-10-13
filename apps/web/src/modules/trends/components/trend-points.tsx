import { Link } from "@tanstack/react-router";
import { StatusBadge } from "@/common/components/status-badge";
import { MarkerValue, markerLink, studiesLink } from "@/modules/reports";
import type { TrendDetail } from "../types";

type TrendPointsProps = {
  markerKey: string;
  category: string;
  points: (TrendDetail["points"][number] & { date: string })[];
  unit: string | null;
  precision: number;
};

export function TrendPoints({ markerKey, category, points, unit, precision }: TrendPointsProps) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full text-left">
        <thead className="border-b text-sm text-muted-foreground">
          <tr>
            <th scope="col" className="p-4 font-medium">
              Date
            </th>
            <th scope="col" className="p-4 font-medium">
              Lab
            </th>
            <th scope="col" className="p-4 text-right font-medium">
              Value
            </th>
            <th scope="col" className="p-4 font-medium">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {points.toReversed().map((point) => (
            <tr key={point.reportId}>
              <td className="p-4">
                <Link
                  {...(category === "studies"
                    ? studiesLink(point.reportId)
                    : markerLink(point.reportId, markerKey))}
                  className="hover:underline"
                >
                  {point.date}
                </Link>
              </td>
              <td className="p-4 text-muted-foreground">{point.labName ?? "Not printed"}</td>
              <td className="p-4 text-right">
                <MarkerValue
                  value={point.value}
                  valueText={null}
                  unit={unit}
                  precision={precision}
                />
              </td>
              <td className="p-4">
                <StatusBadge status={point.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
