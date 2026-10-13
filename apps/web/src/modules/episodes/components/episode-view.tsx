import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Section } from "@/common/components/section";
import { StatusBadge } from "@/common/components/status-badge";
import { StatTile } from "@/common/components/surface/stat-tile";
import { useT } from "@/common/hooks/use-locale";
import type { Status } from "@/common/utils/status";
import { cn } from "@/lib/utils";
import { formatValue } from "@/modules/markers";
import { directionStyles, Sparkline } from "@/modules/trends";
import { episodeDays, formatEpisodeDate, studyLabel } from "../config/episodes";
import type { EpisodeDetail, RepeatedMarker } from "../types";

type EpisodeViewProps = {
  episode: EpisodeDetail;
};

type Point = RepeatedMarker["points"][number];

function statusOf(status: Point["status"]): Status {
  return status ?? "unknown";
}

function withUnit(value: number, precision: number, unit: string | null) {
  return `${formatValue(value, precision)}${unit && unit !== "ratio" ? ` ${unit}` : ""}`;
}

function MarkerName({ markerKey, name }: { markerKey: string; name: string }) {
  return (
    <Link
      to="/trends/$markerKey"
      params={{ markerKey }}
      className="font-medium underline-offset-4 hover:underline"
    >
      {name}
    </Link>
  );
}

function DirectionBadge({ direction }: { direction: RepeatedMarker["direction"] }) {
  const t = useT().episodes.page;
  return (
    <span
      className={cn(
        "rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap",
        directionStyles[direction].badge,
      )}
    >
      {t.direction[direction]}
    </span>
  );
}

function Reading({ marker, point }: { marker: RepeatedMarker; point: Point }) {
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="font-mono text-sm">
        {withUnit(point.value, marker.precision, marker.unit)}
      </span>
      <StatusBadge status={statusOf(point.status)} />
    </span>
  );
}

export function EpisodeView({ episode }: EpisodeViewProps) {
  const t = useT();
  const text = t.episodes.page;
  const { timeline, repeated, studies, outstanding } = episode;
  const outstandingCount = outstanding.markers.length + outstanding.studies.length;

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <section aria-label={text.summary}>
          <p className="max-w-measure text-lg text-pretty" data-testid="episode-summary">
            {episode.summary.join(" ")}
          </p>
        </section>
        <dl className="grid grid-cols-3 gap-2 sm:max-w-xl">
          <StatTile label={text.stats.reports} value={timeline.length} className="px-3 py-2" />
          <StatTile
            label={text.stats.days}
            value={episode.from && episode.to ? episodeDays(episode.from, episode.to) : 0}
            className="px-3 py-2"
          />
          <StatTile label={text.stats.repeated} value={repeated.length} className="px-3 py-2" />
        </dl>
      </div>

      <Section
        id="episode-timeline"
        title={text.timeline.title}
        description={text.timeline.description}
      >
        {timeline.length > 0 ? (
          <ol className="relative space-y-4 border-l pl-6" data-testid="episode-timeline">
            {timeline.map((row) => (
              <li key={row.reportId} className="relative">
                <span
                  className="absolute top-1.5 -left-[1.95rem] size-2.5 rounded-full border-2 border-card bg-primary"
                  aria-hidden
                />
                <p className="text-sm text-muted-foreground">{formatEpisodeDate(row.date)}</p>
                <Link
                  to="/reports/$reportId"
                  params={{ reportId: row.reportId }}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {row.labName ?? text.timeline.unnamedLab}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {[
                    row.markerCount > 0 && text.timeline.markers(row.markerCount, row.flaggedCount),
                    ...row.studies.map((study) => studyLabel(study.kind, study.bodyRegion)),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-muted-foreground">{text.timeline.empty}</p>
        )}
      </Section>

      <Section
        id="episode-repeated"
        title={text.repeated.title}
        description={text.repeated.description}
      >
        {repeated.length > 0 ? (
          <ul
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
            data-testid="episode-repeated"
          >
            {repeated.map((marker) => {
              const last = marker.points.at(-1);
              return (
                <li key={marker.markerKey} className="space-y-3 rounded-xl border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <MarkerName markerKey={marker.markerKey} name={marker.name} />
                    <DirectionBadge direction={marker.direction} />
                  </div>
                  <Sparkline
                    values={marker.points.map(({ value }) => value)}
                    status={statusOf(last?.status ?? null)}
                  />
                  <p className="font-mono text-sm">
                    {marker.points
                      .map(({ value }) => formatValue(value, marker.precision))
                      .join(" → ")}
                    {marker.unit && marker.unit !== "ratio" ? ` ${marker.unit}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {text.repeated.values(marker.points.length)}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-muted-foreground">{text.repeated.empty}</p>
        )}
      </Section>

      {repeated.length > 0 && (
        <Section id="episode-since" title={text.since.title} description={text.since.description}>
          <ul className="divide-y rounded-xl border bg-card" data-testid="episode-since">
            {repeated.map((marker) => {
              const first = marker.points[0];
              const last = marker.points.at(-1);
              if (!first || !last) return null;
              return (
                <li
                  key={marker.markerKey}
                  className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_auto] sm:items-center sm:gap-4"
                >
                  <MarkerName markerKey={marker.markerKey} name={marker.name} />
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Reading marker={marker} point={first} />
                    <ArrowRight
                      className="size-4 text-muted-foreground"
                      aria-label={text.since.to}
                    />
                    <Reading marker={marker} point={last} />
                  </span>
                  <span className="justify-self-start">
                    <DirectionBadge direction={marker.direction} />
                  </span>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      {studies.length > 0 && (
        <Section
          id="episode-studies"
          title={text.studies.title}
          description={text.studies.description}
        >
          <ul className="space-y-3">
            {studies.map((study) => (
              <li key={study.studyId} className="space-y-1 rounded-xl border bg-card p-4">
                <p className="text-sm text-muted-foreground">{formatEpisodeDate(study.date)}</p>
                <Link
                  to="/reports/$reportId"
                  params={{ reportId: study.reportId }}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {studyLabel(study.kind, study.bodyRegion)}
                </Link>
                <p className="max-w-measure whitespace-pre-line">
                  {study.impression ?? text.studies.noImpression}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section
        id="episode-outstanding"
        title={text.outstanding.title}
        description={outstandingCount > 0 ? text.outstanding.description : undefined}
      >
        {outstandingCount > 0 ? (
          <ul className="divide-y rounded-xl border bg-card" data-testid="episode-outstanding">
            {outstanding.markers.map((marker) => (
              <li
                key={marker.markerKey}
                className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_auto] sm:items-center sm:gap-4"
              >
                <MarkerName markerKey={marker.markerKey} name={marker.name} />
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-mono text-sm">
                    {marker.value === null
                      ? marker.valueText
                      : withUnit(marker.value, marker.precision, marker.unit)}
                  </span>
                  <StatusBadge status={marker.status} />
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatEpisodeDate(marker.date)}
                </span>
              </li>
            ))}
            {outstanding.studies.map((study) => (
              <li
                key={study.studyId}
                className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_auto] sm:items-center sm:gap-4"
              >
                <Link
                  to="/reports/$reportId"
                  params={{ reportId: study.reportId }}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {studyLabel(study.kind, study.bodyRegion)}
                </Link>
                <span className="text-sm">{study.line}</span>
                <span className="text-sm text-muted-foreground">
                  {formatEpisodeDate(study.date)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">{text.outstanding.empty}</p>
        )}
      </Section>
    </div>
  );
}
