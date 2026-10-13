import { Link } from "@tanstack/react-router";
import { StatusBadge } from "@/common/components/status-badge";
import { useT } from "@/common/hooks/use-locale";
import { cn } from "@/lib/utils";
import { MarkerValue } from "@/modules/reports";
import { verdictStyles } from "../config/trends";
import type { CompareRow, Comparison } from "../types";
import { ChangeLabel } from "./change-label";

type CompareGroupsProps = {
  groups: Comparison["groups"];
  labelA: string;
  labelB: string;
};

type SideProps = {
  value: CompareRow["valueA"];
  status: CompareRow["statusA"];
  unit: string | null;
  precision: number;
};

const headCell =
  "sticky top-12 z-10 border-b bg-card px-3 py-2.5 text-left text-xs font-medium text-muted-foreground";

function Side({ value, status, unit, precision }: SideProps) {
  const t = useT();
  if (status === null) {
    return <span className="text-sm text-muted-foreground">{t.trends.compare.notMeasured}</span>;
  }
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <MarkerValue
        value={typeof value === "number" ? value : null}
        valueText={typeof value === "string" ? value : null}
        unit={unit}
        precision={precision}
        className="text-sm wrap-anywhere whitespace-normal"
      />
      <StatusBadge status={status} />
    </span>
  );
}

function Verdict({ row, className }: { row: CompareRow; className?: string }) {
  const t = useT();
  return (
    <span
      className={cn(
        "inline-block rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap",
        verdictStyles[row.verdictChange],
        className,
      )}
    >
      {t.trends.verdict[row.verdictChange]}
    </span>
  );
}

export function CompareGroups({ groups, labelA, labelB }: CompareGroupsProps) {
  const t = useT();
  return (
    <div className="rounded-xl border bg-card">
      <table className="w-full table-fixed border-separate border-spacing-0 text-left">
        <thead>
          <tr>
            <th scope="col" className={cn(headCell, "w-[40%] rounded-tl-xl pl-4 lg:w-[26%]")}>
              {t.trends.columns.marker}
            </th>
            <th scope="col" className={cn(headCell, "w-[30%] lg:w-[21%]")}>
              {t.trends.columns.a} <span className="font-normal">· {labelA}</span>
            </th>
            <th
              scope="col"
              className={cn(headCell, "w-[30%] rounded-tr-xl lg:w-[21%] lg:rounded-none")}
            >
              {t.trends.columns.b} <span className="font-normal">· {labelB}</span>
            </th>
            <th scope="col" className={cn(headCell, "hidden w-[20%] lg:table-cell")}>
              {t.trends.columns.change}
            </th>
            <th
              scope="col"
              className={cn(headCell, "hidden w-[12%] rounded-tr-xl pr-4 lg:table-cell")}
            >
              {t.trends.columns.status}
            </th>
          </tr>
        </thead>
        {groups.map((group) => (
          <tbody key={group.key}>
            <tr>
              <th
                colSpan={5}
                scope="colgroup"
                className="border-b bg-muted/50 px-4 py-2 text-left text-sm font-semibold"
              >
                {group.label}{" "}
                <span className="font-mono font-normal text-muted-foreground">
                  {group.rows.length}
                </span>
              </th>
            </tr>
            {group.rows.map((row) => (
              <tr key={row.markerKey} className="align-top [&>*]:border-b">
                <th scope="row" className="py-3 pr-3 pl-4 text-left font-normal">
                  <Link
                    to="/trends/$markerKey"
                    params={{ markerKey: row.markerKey }}
                    className="font-medium hyphens-auto underline-offset-4 hover:underline"
                  >
                    {row.name}
                  </Link>
                  <Verdict row={row} className="mt-1 lg:hidden" />
                </th>
                <td className="px-3 py-3">
                  <Side
                    value={row.valueA}
                    status={row.statusA}
                    unit={row.unit}
                    precision={row.precision}
                  />
                </td>
                <td className="px-3 py-3">
                  <Side
                    value={row.valueB}
                    status={row.statusB}
                    unit={row.unit}
                    precision={row.precision}
                  />
                </td>
                <td className="hidden px-3 py-3 lg:table-cell">
                  {row.change && (
                    <ChangeLabel
                      change={row.change}
                      precision={row.precision}
                      unit={row.unit}
                      className="whitespace-normal text-muted-foreground"
                    />
                  )}
                </td>
                <td className="hidden py-3 pr-4 pl-3 lg:table-cell">
                  <Verdict row={row} />
                </td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}
