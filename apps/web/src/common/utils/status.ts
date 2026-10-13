export type Status = "optimal" | "watch" | "risk" | "unknown";

export const statusStyles: Record<
  Status,
  { label: string; badge: string; mark: string; fill: string }
> = {
  optimal: {
    label: "Optimal",
    badge: "bg-optimal-soft text-optimal",
    mark: "bg-optimal",
    fill: "fill-optimal",
  },
  watch: {
    label: "Watch",
    badge: "bg-watch-soft text-watch",
    mark: "bg-watch",
    fill: "fill-watch",
  },
  risk: { label: "Risk", badge: "bg-risk-soft text-risk", mark: "bg-risk", fill: "fill-risk" },
  unknown: {
    label: "Unknown",
    badge: "bg-unknown-soft text-unknown",
    mark: "bg-unknown",
    fill: "fill-unknown",
  },
};
