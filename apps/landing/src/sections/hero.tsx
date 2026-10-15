import { Info } from "lucide-react";
import { PauseMotionButton } from "@/components/motion";
import { Phone, Screen } from "@/components/phone";
import { messages, type Locale } from "@/config/messages";
import { facts } from "@/lib/facts";
import { appLinks, buttonStyles } from "@/lib/site";

export function Hero({ locale }: { locale: Locale }) {
  const { site, hero: t } = messages[locale];
  const callouts = [
    { value: t.callouts.files(facts.maxFiles), label: t.callouts.filesLabel },
    { value: t.callouts.markers(facts.markers), label: t.callouts.markersLabel },
    { value: t.callouts.fileTypes(facts.fileTypes), label: t.callouts.fileTypesLabel },
  ];
  return (
    <section id="top" aria-labelledby="hero-title" className="relative">
      <div className="mx-auto grid max-w-content items-center gap-12 px-4 pt-10 pb-12 md:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:pt-16">
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
          <div className="rise-in w-full">
            <Phone>
              <Screen name="report" priority alt={t.reportAlt} />
            </Phone>
          </div>
          <PauseMotionButton label={site.pauseMotion} />
        </div>
      </div>

      <div className="mx-auto max-w-content pb-12 md:px-8 md:pb-16">
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
