import { PhoneSteps, type PhoneStep } from "@/components/phone-steps";
import { SectionHeader } from "@/components/section-header";
import { facts } from "@/lib/facts";

const steps: PhoneStep[] = [
  {
    title: "A repeat scan can settle a line",
    body: `MediWise links two reports when both have the same study within ${facts.repeatStudyDays} days. You can undo the link. When the later report has no alert line, the earlier line moves to Settled.`,
    screen: "settled",
    alt: "The Settled block: a 34 mm cyst on 10 Feb 2025. The repeat ultrasound of 17 Mar 2025 shows no cyst.",
  },
  {
    title: "One episode for one workup",
    body: "MediWise finds reports that may belong together. Give them a name, such as thyroid tests. The episode shows each report in date order and the markers that repeat.",
    screen: "episode",
    alt: "An episode timeline: five reports from 3 Feb 2025 to 17 Mar 2025, oldest first.",
  },
  {
    title: "Your report in Hindi",
    body: "Choose Hindi in Settings or on the sign-in page. The app, the marker explanations and the report summary show in Hindi. Marker names and printed lines stay as the lab prints them.",
    screen: "hindi",
    alt: "The report summary in Hindi. Marker names such as Urine albumin and Homocysteine stay in English.",
  },
];

export function History() {
  return (
    <section
      aria-labelledby="history-title"
      className="mx-auto max-w-content px-4 py-12 md:px-8 md:py-20"
    >
      <SectionHeader id="history-title" eyebrow="Across reports" title="Every report in one history">
        Scans, repeat tests and second opinions arrive weeks apart. MediWise keeps them together, in
        date order.
      </SectionHeader>
      <PhoneSteps steps={steps} />
    </section>
  );
}
