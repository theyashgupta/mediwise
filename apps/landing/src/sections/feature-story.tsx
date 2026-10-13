import { SectionHeader } from "@/components/section-header";
import { Story, type Scene } from "@/components/story";

const scenes: Scene[] = [
  {
    title: "A line for your doctor",
    body: "MediWise copies the words from your ECG, ultrasound and X-ray reports. When a line names a mass, a nodule, a stone or a similar finding, MediWise shows that line first. It does not explain the line. It tells you to ask your doctor.",
    screen: "alert",
    alt: "The studies on a report: an ECG, a chest X-ray and an abdomen ultrasound, each with its printed impression.",
  },
  {
    title: "What changed since your last visit",
    body: "Findings compare this report with your last one. You see which markers improved, which became worse, and which results go together.",
    screen: "findings",
    alt: "Findings: fatty liver on the scan, TSH worse since January 2024, Vitamin B12 worse since January 2024.",
  },
  {
    title: "Your score, and what to move first",
    body: "Fixed rules score each report, so the same values always give the same score. MediWise then puts the markers to work on first in order.",
    screen: "move-first",
    alt: "Move first: urine albumin, homocysteine, mean platelet volume, potassium and HDL cholesterol, in order.",
  },
  {
    title: "Questions for your doctor",
    body: "MediWise writes questions from your results. Copy them and take them to your next visit.",
    screen: "questions",
    alt: "Eight questions for the doctor, with a button to copy all of them.",
  },
];

export function FeatureStory() {
  return (
    <section aria-labelledby="story-title" className="border-t bg-sidebar">
      <div className="mx-auto max-w-content px-4 py-12 md:px-8 md:py-20">
        <SectionHeader id="story-title" eyebrow="Inside a report" title="What MediWise shows you">
          Every screen on this page is from the MediWise app. The values come from a real report.
        </SectionHeader>
        <div className="mt-10">
          <Story scenes={scenes} />
        </div>
      </div>
    </section>
  );
}
