import { SectionHeader } from "@/components/section-header";
import { Story, type Scene } from "@/components/story";

const scenes: Scene[] = [
  {
    title: "A line for your doctor",
    body: "MediWise copies the words from your ECG, ultrasound and X-ray reports. When a line names a mass, a nodule, a stone or a similar finding, MediWise shows that line first. It does not explain the line. It tells you to ask your doctor.",
    screen: "alert",
    alt: "Findings: the ultrasound line about a 6 mm thyroid nodule comes first. It tells you to ask your doctor.",
  },
  {
    title: "What changed since your last visit",
    body: "Findings compare this report with your last one. You see which markers improved, which became worse, and which results go together.",
    screen: "findings",
    alt: "Findings: LDL cholesterol, homocysteine and urine albumin are worse since March 2024.",
  },
  {
    title: "Your score, and what to move first",
    body: "Fixed rules score each report, so the same values always give the same score. MediWise then puts the markers to work on first in order.",
    screen: "move-first",
    alt: "Move first: urine albumin, homocysteine, potassium, mean platelet volume and LDL cholesterol, in order.",
  },
  {
    title: "Questions for your doctor",
    body: "MediWise writes questions from your results. Copy them and take them to your next visit.",
    screen: "questions",
    alt: "Six questions for the doctor, with a button to copy all of them.",
  },
];

export function FeatureStory() {
  return (
    <section aria-labelledby="story-title" className="border-t bg-sidebar">
      <div className="mx-auto max-w-content px-4 py-12 md:px-8 md:py-20">
        <SectionHeader id="story-title" eyebrow="Inside a report" title="What MediWise shows you">
          Every screen on this page is from the MediWise app. The person and the values are made up.
        </SectionHeader>
        <div className="mt-10">
          <Story scenes={scenes} />
        </div>
      </div>
    </section>
  );
}
