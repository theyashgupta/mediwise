import { Link } from "@tanstack/react-router";
import { StatusBadge } from "@/common/components/status-badge";
import { useT } from "@/common/hooks/use-locale";
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
  const t = useT();
  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full text-left">
        <thead className="border-b text-sm text-muted-foreground">
          <tr>
            <th scope="col" className="p-4 font-medium">
              {t.trends.columns.date}
            </th>
            <th scope="col" className="p-4 font-medium">
              {t.common.chart.lab}
            </th>
            <th scope="col" className="p-4 text-right font-medium">
              {t.common.chart.value}
            </th>
            <th scope="col" className="p-4 font-medium">
              {t.trends.columns.status}
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
              <td className="p-4 text-muted-foreground">
                {point.labName ?? t.common.chart.notPrinted}
              </td>
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
