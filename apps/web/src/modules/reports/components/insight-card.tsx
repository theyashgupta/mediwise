import type { ReactNode } from "react";

type InsightCardProps = {
  title: string;
  badge: ReactNode;
  children: ReactNode;
};

export function InsightCard({ title, badge, children }: InsightCardProps) {
  return (
    <article className="flex h-full flex-col gap-3 rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-balance">{title}</h3>
        <span className="shrink-0">{badge}</span>
      </div>
      {children}
    </article>
  );
}
