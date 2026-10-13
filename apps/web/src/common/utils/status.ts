export type Status = "optimal" | "watch" | "risk" | "unknown";

export const statusStyles: Record<
  Status,
  { badge: string; mark: string; fill: string }
> = {
  optimal: {
    badge: "bg-optimal-soft text-optimal",
    mark: "bg-optimal",
    fill: "fill-optimal",
  },
  watch: {
    badge: "bg-watch-soft text-watch",
    mark: "bg-watch",
    fill: "fill-watch",
  },
  risk: { badge: "bg-risk-soft text-risk", mark: "bg-risk", fill: "fill-risk" },
  unknown: {
    badge: "bg-unknown-soft text-unknown",
    mark: "bg-unknown",
    fill: "fill-unknown",
  },
};
