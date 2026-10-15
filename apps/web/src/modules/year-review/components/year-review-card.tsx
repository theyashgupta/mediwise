import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarRange } from "lucide-react";
import { useT } from "@/common/hooks/use-locale";
import { Button } from "@/components/ui/button";
import { formatReviewDate } from "../config/year-review";
import type { YearReview } from "../types";
import { wrapLabel } from "@/common/utils/wrap-label";
import { cn } from "@/lib/utils";

type YearReviewCardProps = {
  review: YearReview;
  profileId: string;
};

export function YearReviewCard({ review, profileId }: YearReviewCardProps) {
  const t = useT();
  const { score, moved, stillAtRisk } = review;
  const facts = [
    score.from !== null && score.to !== null
      ? t.yearReview.card.score(score.from, score.to)
      : undefined,
    t.yearReview.card.moved(moved.length),
    t.yearReview.card.stillAtRisk(stillAtRisk.length),
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
            {t.yearReview.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t.yearReview.period(formatReviewDate(review.from), formatReviewDate(review.to))} ·{" "}
            {facts.join(" · ")}
          </p>
        </div>
      </div>
      <Button asChild variant="outline" className={cn(wrapLabel, "self-start sm:self-center")}>
        <Link to="/year-review" search={{ profileId }}>
          {t.yearReview.card.open}
          <ArrowRight aria-hidden />
        </Link>
      </Button>
    </section>
  );
}
