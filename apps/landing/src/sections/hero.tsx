import { Info } from "lucide-react";
import { PauseMotionButton } from "@/components/motion";
import { Phone, Screen } from "@/components/phone";
import { messages, type Locale } from "@/config/messages";
import { facts, heroMarkers } from "@/lib/facts";
import { appLinks, buttonStyles } from "@/lib/site";

const tags = [
  { name: heroMarkers[0], left: "18%", top: "58%" },
  { name: heroMarkers[1], left: "52%", top: "42%" },
  { name: heroMarkers[2], left: "90%", top: "18%" },
];

const wave = "M-60 0q7.5-5 15 0t15 0 15 0 15 0 15 0 15 0 15 0 15 0 15 0 15 0 15 0 15 0V200H-60Z";

const drop = "M12 2C12 2 4 12 4 17a8 8 0 0 0 16 0C20 12 12 2 12 2Z";

const tubes = [24, 62, 100];

function Liquid({ clip, x = 0, y }: { clip: string; x?: number; y: number }) {
  return (
    <g clipPath={`url(#${clip})`}>
      <g transform={`translate(${x} ${y})`}>
        <g className="hero-lab-rise">
          <path className="hero-lab-liquid hero-lab-wave" d={wave} />
        </g>
      </g>
    </g>
  );
}

function Vessel({ name, viewBox, outline }: { name: string; viewBox: string; outline: string }) {
  const clip = `hero-lab-${name}`;
  return (
    <svg viewBox={viewBox} className={`hero-lab-item hero-lab-${name}`}>
      <clipPath id={clip}>
        <path d={outline} />
      </clipPath>
      <Liquid clip={clip} y={92} />
      <path className="hero-lab-glass" d={outline} />
    </svg>
  );
}

function HeroGlassware() {
  return (
    <div className="hero-lab absolute inset-0 mx-auto max-w-content">
      <Vessel
        name="flask"
        viewBox="0 0 120 150"
        outline="M46 10h28M50 10v42L14 128a10 10 0 0 0 9 14h74a10 10 0 0 0 9-14L70 52V10"
      />
      <Vessel name="round" viewBox="0 0 110 140" outline="M45 8h20M48 8v42a38 38 0 1 0 14 0V8" />
      <svg viewBox="0 0 150 130" className="hero-lab-item hero-lab-rack">
        {tubes.map((x, index) => (
          <g key={x}>
            <clipPath id={`hero-lab-tube-${index}`}>
              <path d={`M${x} 6v86a13 13 0 0 0 26 0V6Z`} />
            </clipPath>
            <Liquid clip={`hero-lab-tube-${index}`} x={x - 30} y={40 + index * 14} />
            <path className="hero-lab-glass" d={`M${x - 4} 6h34M${x} 6v86a13 13 0 0 0 26 0V6`} />
          </g>
        ))}
        <path className="hero-lab-glass" d="M8 70h134M14 70v52M136 70v52M8 122h134" />
      </svg>
      <svg viewBox="0 0 40 120" className="hero-lab-item hero-lab-pipette">
        <path className="hero-lab-glass" d="M14 4h12v30l-3 56-3 14-3-14-3-56V4Z" />
        <path className="hero-lab-liquid" d="M15.6 60h8.8l-1.4 30-3 12-3-12Z" />
        <g transform="translate(14 104) scale(0.5)">
          <path className="hero-lab-liquid hero-lab-drip" d={drop} />
        </g>
      </svg>
      {[1, 2, 3, 4].map((index) => (
        <svg
          key={index}
          viewBox="0 0 24 28"
          className={`hero-lab-item hero-lab-drop hero-lab-drop-${index}`}
        >
          <path className="hero-lab-liquid hero-lab-glass" d={drop} />
        </svg>
      ))}
    </div>
  );
}

function HeroMotion() {
  return (
    <div
      aria-hidden
      className="hero-motion pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="hero-blob hero-blob-1" />
      <div className="hero-blob hero-blob-2" />
      <div className="hero-blob hero-blob-3" />
      <HeroGlassware />
    </div>
  );
}

function HeroTrend() {
  return (
    <div
      aria-hidden
      className="hero-motion pointer-events-none absolute inset-x-0 bottom-[calc(100%-1rem)] -z-10 h-28 overflow-hidden"
    >
      <svg
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        className="size-full bg-linear-to-b from-transparent via-optimal-soft/60 to-transparent [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
      >
        <path
          d="M0 94 C120 84 160 74 216 70 S480 56 624 50 S960 28 1080 22 S1160 18 1200 16"
          pathLength={1}
          fill="none"
          strokeWidth="2"
          className="hero-line stroke-primary opacity-60"
        />
      </svg>
      {tags.map((tag) => (
        <span
          key={tag.name}
          style={{ left: tag.left, top: tag.top }}
          className="absolute hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full border bg-background px-2.5 py-0.5 text-xs whitespace-nowrap text-muted-foreground xl:inline-flex"
        >
          <span className="size-1.5 rounded-full bg-optimal" />
          {tag.name}
        </span>
      ))}
    </div>
  );
}

export function Hero({ locale }: { locale: Locale }) {
  const { site, hero: t } = messages[locale];
  const callouts = [
    { value: t.callouts.files(facts.maxFiles), label: t.callouts.filesLabel },
    { value: t.callouts.markers(facts.markers), label: t.callouts.markersLabel },
    { value: t.callouts.fileTypes(facts.fileTypes), label: t.callouts.fileTypesLabel },
  ];
  return (
    <section id="top" aria-labelledby="hero-title" className="relative isolate overflow-x-clip">
      <HeroMotion />
      <div className="mx-auto grid max-w-content items-center gap-12 px-4 pt-10 pb-12 md:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:pt-16 lg:pb-24">
        <div>
          <p className="font-mono text-xs tracking-wider text-primary uppercase">{t.eyebrow}</p>
          <h1 id="hero-title" className="mt-4 font-display text-hero text-balance">
            {t.title}
          </h1>
          <p className="mt-6 max-w-xl text-lg text-pretty text-muted-foreground">{t.body}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href={appLinks.signUp(locale)} className={buttonStyles.primary}>
              {site.readReport}
            </a>
            <a href="#how-it-works" className={buttonStyles.outline}>
              {t.howItWorks}
            </a>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            <span className="font-mono text-base text-foreground">{facts.firstPack.price}</span>{" "}
            {t.forOneReport}{" "}
            <span className="font-mono text-base text-foreground">{facts.cheapest.perReport}</span>{" "}
            {t.perReportInPack(facts.cheapest.credits)} {t.tax}
          </p>
          <p className="mt-4 flex max-w-xl gap-2 text-sm text-muted-foreground">
            <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
            {site.disclaimer}
          </p>
        </div>

        <div className="relative mx-auto flex w-full max-w-[300px] flex-col items-center gap-4">
          <Phone>
            <Screen name="report" priority alt={t.reportAlt} />
          </Phone>
          <PauseMotionButton label={site.pauseMotion} />
        </div>
      </div>

      <div className="relative mx-auto max-w-content pb-12 md:px-8 md:pb-16">
        <HeroTrend />
        <dl className="grid grid-cols-1 border-y sm:grid-cols-3 md:rounded-xl md:border">
          {callouts.map((callout) => (
            <div
              key={callout.label}
              className="flex flex-col-reverse border-b px-6 py-5 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0"
            >
              <dt className="mt-1 text-sm text-muted-foreground">{callout.label}</dt>
              <dd className="font-mono text-2xl tracking-tight">{callout.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
