import { useT } from "@/common/hooks/use-locale";
import { followUpIcons } from "../config/report";
import type { FollowUp } from "../types";

type FollowUpListProps = {
  items: FollowUp[];
};

export function FollowUpList({ items }: FollowUpListProps) {
  const t = useT();
  if (items.length === 0) {
    return <p className="text-muted-foreground">{t.report.followUps.empty}</p>;
  }
  return (
    <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
      {items.map((item) => {
        const Icon = followUpIcons[item.kind];
        return (
          <li key={item.rank}>
            <article className="flex h-full flex-col gap-2 rounded-xl border bg-card p-5">
              <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Icon className="size-4" aria-hidden />
                {t.report.followUps.kinds[item.kind]}
              </p>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-sm">{item.why}</p>
              <p className="mt-auto rounded-lg bg-muted px-3 py-2 text-sm">
                <span className="font-medium">{t.report.followUps.next}</span>
                {item.next}
              </p>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
