import { useT } from "@/common/hooks/use-locale";
import type { ReportDetail } from "../types";

type UnmeasuredListProps = {
  items: ReportDetail["unmeasured"];
};

export function UnmeasuredList({ items }: UnmeasuredListProps) {
  const t = useT();
  if (items.length === 0) {
    return <p className="text-muted-foreground">{t.report.unmeasured.empty}</p>;
  }
  return (
    <div className="space-y-3">
      <p className="text-muted-foreground">{t.report.unmeasured.intro}</p>
      <ul className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {items.map((item) => (
          <li key={item.markerKey} className="space-y-1 bg-card px-4 py-3 sm:odd:last:col-span-2">
            <p className="font-medium">{item.name}</p>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
