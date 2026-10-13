import { Info } from "lucide-react";
import { PauseMotionButton } from "@/components/motion";
import { Phone, Screen } from "@/components/phone";
import { facts } from "@/lib/facts";
import { appLinks, buttonStyles, disclaimer } from "@/lib/site";

const callouts = [
  { value: `${facts.maxFiles} files`, label: "PDFs or photos in one report" },
  { value: `${facts.markers} markers`, label: "Explained, each with a cited source" },
  { value: "Mumbai", label: "Where we store your reports" },
];

export function Hero() {
  return (
    <section id="top" aria-labelledby="hero-title" className="relative">
      <div className="mx-auto grid max-w-content items-center gap-12 px-4 pt-10 pb-12 md:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:pt-16">
        <div>
          <p className="font-mono text-xs tracking-wider text-primary uppercase">
            For lab reports in India
          </p>
          <h1 id="hero-title" className="mt-4 font-display text-hero text-balance">
            Your lab report, explained marker by marker.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-pretty text-muted-foreground">
            Upload a report as a PDF or photos. MediWise explains every marker and scores it for
            your age, sex and ancestry. Then it tracks each marker across visits.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href={appLinks.signUp} className={buttonStyles.primary}>
              Read my report
            </a>
            <a href="#how-it-works" className={buttonStyles.outline}>
              See how it works
            </a>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            <span className="font-mono text-base text-foreground">{facts.firstPack.price}</span> for
            one report.{" "}
            <span className="font-mono text-base text-foreground">{facts.cheapest.perReport}</span>{" "}
            a report in the pack of {facts.cheapest.credits}. Prices include GST.
          </p>
          <p className="mt-4 flex max-w-xl gap-2 text-sm text-muted-foreground">
            <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
            {disclaimer}
          </p>
        </div>

        <div className="relative mx-auto flex w-full max-w-[300px] flex-col items-center gap-4">
          <div className="rise-in w-full">
            <Phone>
              <Screen
                name="report"
                priority
                alt="A MediWise report: 67 of 81 markers sit in the calibrated ranges, and urine albumin is the one to move first. Score 89, Platinum."
              />
            </Phone>
          </div>
          <PauseMotionButton />
        </div>
      </div>

      <div className="mx-auto max-w-content md:px-8">
        <dl className="grid grid-cols-1 border-y sm:grid-cols-3 md:rounded-xl md:border">
          {callouts.map((callout) => (
            <div
              key={callout.value}
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
