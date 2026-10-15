import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Section } from "@/common/components/section";
import { StatusBadge } from "@/common/components/status-badge";
import { StatTile } from "@/common/components/surface/stat-tile";
import { getIntlTag, useT } from "@/common/hooks/use-locale";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MarkerValue } from "@/modules/reports";
import { formatReviewDate } from "../config/year-review";
import type { Reading, YearReview } from "../types";

type YearReviewViewProps = {
  review: YearReview;
  writingIntro: boolean;
  introError: boolean;
  onWriteIntro: () => void;
};

type MarkerInfo = {
  markerKey: string;
  name: string;
  unit: string | null;
  precision: number;
};

const directionStyles = {
  improved: "bg-optimal-soft text-optimal",
  worsened: "bg-risk-soft text-risk",
};

function ReadingCell({ marker, reading }: { marker: MarkerInfo; reading: Reading }) {
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <MarkerValue
        value={reading.value}
        valueText={null}
        unit={marker.unit}
        precision={marker.precision}
        className="text-sm"
      />
      <StatusBadge status={reading.status} />
    </span>
  );
}

function MarkerName({ marker }: { marker: MarkerInfo }) {
  return (
    <Link
      to="/trends/$markerKey"
      params={{ markerKey: marker.markerKey }}
      className="font-medium underline-offset-4 hover:underline"
    >
      {marker.name}
    </Link>
  );
}

function ChangeList({
  items,
}: {
  items: (MarkerInfo & { from: Reading; to: Reading; direction?: "improved" | "worsened" })[];
}) {
  const t = useT();
  return (
    <ul className="divide-y rounded-xl border bg-card">
      {items.map((item) => (
        <li
          key={item.markerKey}
          className="grid gap-2 px-4 py-3 break-inside-avoid sm:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_auto] sm:items-center sm:gap-4"
        >
          <MarkerName marker={item} />
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <ReadingCell marker={item} reading={item.from} />
            <ArrowRight className="size-4 text-muted-foreground" aria-label={t.yearReview.to} />
            <ReadingCell marker={item} reading={item.to} />
          </span>
          {item.direction && (
            <span
              className={cn(
                "justify-self-start rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap",
                directionStyles[item.direction],
              )}
            >
              {t.yearReview.direction[item.direction]}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function YearReviewView({
  review,
  writingIntro,
  introError,
  onWriteIntro,
}: YearReviewViewProps) {
  const t = useT();
  const { score, moved, stillAtRisk, measuredOnce } = review;
  const scoreText = (
    <span className="text-xl whitespace-nowrap sm:text-2xl">
      {score.from !== null && score.to !== null
        ? `${score.from} → ${score.to}`
        : t.yearReview.noScore}
    </span>
  );
  return (
    <div className="space-y-10 print:space-y-6">
      <div className="space-y-6">
        {review.intro ? (
          <p className="max-w-measure text-lg text-pretty">{review.intro.join(" ")}</p>
        ) : (
          <div className="space-y-2 print:hidden">
            <Button variant="outline" size="sm" disabled={writingIntro} onClick={onWriteIntro}>
              {t.yearReview.page.writeIntro}
            </Button>
            {introError && (
              <p role="alert" className="text-sm text-destructive">
                {t.yearReview.page.introError}
              </p>
            )}
          </div>
        )}
        <dl className="grid grid-cols-3 gap-2 sm:max-w-xl">
          <StatTile label={t.yearReview.stats.score} value={scoreText} className="px-3 py-2" />
          <StatTile
            label={t.yearReview.stats.reports}
            value={review.reportCount.toLocaleString(getIntlTag())}
            className="px-3 py-2"
          />
          <StatTile
            label={t.yearReview.stats.labs}
            value={review.labCount.toLocaleString(getIntlTag())}
            className="px-3 py-2"
          />
        </dl>
      </div>

      <Section
        id="review-moved"
        title={t.yearReview.moved.title}
        description={t.yearReview.moved.description}
      >
        {moved.length > 0 ? (
          <ChangeList items={moved} />
        ) : (
          <p className="text-muted-foreground">{t.yearReview.moved.empty}</p>
        )}
      </Section>

      <Section
        id="review-risk"
        title={t.yearReview.risk.title}
        description={t.yearReview.risk.description}
      >
        {stillAtRisk.length > 0 ? (
          <ChangeList items={stillAtRisk} />
        ) : (
          <p className="text-muted-foreground">{t.yearReview.risk.empty}</p>
        )}
      </Section>

      {measuredOnce.length > 0 && (
        <Section
          id="review-once"
          title={t.yearReview.once.title}
          description={t.yearReview.once.description}
        >
          <ul className="divide-y rounded-xl border bg-card">
            {measuredOnce.map((item) => (
              <li
                key={item.markerKey}
                className="grid gap-2 px-4 py-3 break-inside-avoid sm:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_auto] sm:items-center sm:gap-4"
              >
                <MarkerName marker={item} />
                <ReadingCell marker={item} reading={item} />
                <span className="text-sm text-muted-foreground">{formatReviewDate(item.date)}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
