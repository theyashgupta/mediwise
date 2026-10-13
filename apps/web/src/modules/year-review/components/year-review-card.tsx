import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatReviewDate } from "../config/year-review";
import type { YearReview } from "../types";

type YearReviewCardProps = {
  review: YearReview;
  profileId: string;
};

export function YearReviewCard({ review, profileId }: YearReviewCardProps) {
  const { score, moved, stillAtRisk } = review;
  const facts = [
    score.from !== null && score.to !== null ? `Score ${score.from} → ${score.to}` : undefined,
    `${moved.length} ${moved.length === 1 ? "marker" : "markers"} moved`,
    `${stillAtRisk.length} still at risk`,
  ].filter(Boolean);
  return (
    <section
      aria-labelledby="year-review-card"
      className="flex flex-col gap-4 rounded-xl border bg-card p-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 gap-3">
        <CalendarRange className="mt-1 size-5 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 space-y-1">
          <h2 id="year-review-card" className="text-lg font-semibold tracking-tight">
            Year in review
          </h2>
          <p className="text-sm text-muted-foreground">
            {formatReviewDate(review.from)} to {formatReviewDate(review.to)} · {facts.join(" · ")}
          </p>
        </div>
      </div>
      <Button asChild variant="outline" className="self-start sm:self-center">
        <Link to="/year-review" search={{ profileId }}>
          Open the review
          <ArrowRight aria-hidden />
        </Link>
      </Button>
    </section>
  );
}
