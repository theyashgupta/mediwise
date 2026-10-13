import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Section } from "@/common/components/section";
import { StatusBadge } from "@/common/components/status-badge";
import { StatTile } from "@/common/components/surface/stat-tile";
import { cn } from "@/lib/utils";
import { MarkerValue } from "@/modules/reports";
import { formatReviewDate } from "../config/year-review";
import type { Reading, YearReview } from "../types";

type YearReviewViewProps = {
  review: YearReview;
};

type MarkerInfo = {
  markerKey: string;
  name: string;
  unit: string | null;
  precision: number;
};

const directionStyles = {
  improved: { label: "Better status", badge: "bg-optimal-soft text-optimal" },
  worsened: { label: "Worse status", badge: "bg-risk-soft text-risk" },
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
            <ArrowRight className="size-4 text-muted-foreground" aria-label="to" />
            <ReadingCell marker={item} reading={item.to} />
          </span>
          {item.direction && (
            <span
              className={cn(
                "justify-self-start rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap",
                directionStyles[item.direction].badge,
              )}
            >
              {directionStyles[item.direction].label}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function YearReviewView({ review }: YearReviewViewProps) {
  const { score, moved, stillAtRisk, measuredOnce } = review;
  const scoreText = (
    <span className="text-xl whitespace-nowrap sm:text-2xl">
      {score.from !== null && score.to !== null ? `${score.from} → ${score.to}` : "No score"}
    </span>
  );
  return (
    <div className="space-y-10 print:space-y-6">
      <div className="space-y-6">
        <p className="max-w-measure text-lg text-pretty">{review.intro.join(" ")}</p>
        <dl className="grid grid-cols-3 gap-2 sm:max-w-xl">
          <StatTile label="Score" value={scoreText} className="px-3 py-2" />
          <StatTile label="Reports" value={review.reportCount} className="px-3 py-2" />
          <StatTile label="Labs" value={review.labCount} className="px-3 py-2" />
        </dl>
      </div>

      <Section
        id="review-moved"
        title="Markers that moved"
        description="These markers have a different status in the last report than in the first report."
      >
        {moved.length > 0 ? (
          <ChangeList items={moved} />
        ) : (
          <p className="text-muted-foreground">No marker moved to a different status.</p>
        )}
      </Section>

      <Section
        id="review-risk"
        title="Markers still at risk"
        description="These markers have risk status in the first report and in the last report."
      >
        {stillAtRisk.length > 0 ? (
          <ChangeList items={stillAtRisk} />
        ) : (
          <p className="text-muted-foreground">No marker kept risk status.</p>
        )}
      </Section>

      {measuredOnce.length > 0 && (
        <Section
          id="review-once"
          title="Markers measured once"
          description="These markers have one value in this period, so they have no trend."
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
