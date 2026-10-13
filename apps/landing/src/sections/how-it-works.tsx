import { PhoneSteps, type PhoneStep } from "@/components/phone-steps";
import { SectionHeader } from "@/components/section-header";
import { facts } from "@/lib/facts";

const steps: PhoneStep[] = [
  {
    title: "Upload",
    body: `Add your report as a PDF or as photos. You can add up to ${facts.maxFiles} files in one report.`,
    screen: "upload",
    alt: `The upload page: drop up to ${facts.maxFiles} PDFs or photos.`,
  },
  {
    title: "Understand",
    body: "MediWise explains every marker in plain English or Hindi. It scores each marker against ranges for your age, sex and ancestry.",
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
      <PhoneSteps steps={steps} />
    </section>
  );
}
