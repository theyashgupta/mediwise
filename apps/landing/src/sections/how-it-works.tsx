import { Phone, Screen, type ScreenName } from "@/components/phone";
import { SectionHeader } from "@/components/section-header";
import { facts } from "@/lib/facts";

const steps: { title: string; body: string; screen: ScreenName; alt: string }[] = [
  {
    title: "Upload",
    body: `Add your report as a PDF or as photos. You can add up to ${facts.maxFiles} files in one report.`,
    screen: "upload",
    alt: `The upload page: drop up to ${facts.maxFiles} PDFs or photos.`,
  },
  {
    title: "Understand",
    body: "MediWise explains every marker in plain English. It scores each marker against ranges for your age, sex and ancestry.",
    screen: "marker",
    alt: "The Vitamin B12 page: what the marker is, the value, and where it sits in the range.",
  },
  {
    title: "Track",
    body: "See how each marker changes from one visit to the next. Keep a profile for each person in your family.",
    screen: "trends",
    alt: "The trends page: each marker with its change since the last report.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-title"
      className="mx-auto max-w-content px-4 py-12 md:px-8 md:py-20"
    >
      <SectionHeader
        id="how-title"
        eyebrow="How it works"
        title="From a lab PDF to a clear report in three steps"
      >
        You do not need to know what a marker means. MediWise reads the report and tells you.
      </SectionHeader>
      <ol className="mt-14 grid gap-12 md:grid-cols-3 md:gap-8">
        {steps.map((step, index) => (
          <li key={step.title} className="reveal flex flex-col">
            <p className="font-mono text-sm text-primary">0{index + 1}</p>
            <h3 className="mt-2 text-xl font-semibold">{step.title}</h3>
            <p className="mt-2 text-muted-foreground">{step.body}</p>
            <div className="mt-8 px-6 md:px-2 lg:px-6">
              <Phone className="mx-auto max-w-[260px]">
                <Screen name={step.screen} alt={step.alt} />
              </Phone>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
