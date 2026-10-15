import { StatusBadge } from "@/common/components/status-badge";
import type { Status } from "@/common/utils/status";
import { statusCounts } from "../config/report";

type StatusCountsProps = {
  items: { status: Status }[];
  only?: Status[];
};

export function StatusCounts({ items, only }: StatusCountsProps) {
  return statusCounts(items)
    .filter(({ status }) => !only || only.includes(status))
    .map(({ status, count }) => <StatusBadge key={status} status={status} count={count} />);
}
