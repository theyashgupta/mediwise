import { SectionHeader } from "@/components/section-header";
import { messages, type Locale } from "@/config/messages";
import { facts } from "@/lib/facts";
import { StoryStepper } from "./story-stepper";

export function HowItWorks({ locale }: { locale: Locale }) {
  const { howItWorks: how, story } = messages[locale];
  const steps = [
    {
      title: how.upload.title,
      body: how.upload.body(facts.maxFiles),
      screen: "upload",
      alt: how.upload.alt(facts.maxFiles),
    },
    { ...story.moveFirst, screen: "move-first" },
    { ...how.understand, screen: "marker" },
    { ...story.findings, screen: "findings" },
    { ...story.alert, screen: "alert" },
    { ...how.track, screen: "trends" },
  ] as const;
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-title"
      className="story-section mx-auto max-w-content px-4 pt-12 pb-16 md:px-8 md:pt-20 lg:pb-24"
    >
      <SectionHeader id="how-title" eyebrow={how.eyebrow} title={how.title}>
        {how.body}
      </SectionHeader>
      <StoryStepper steps={steps.map((step, index) => ({ ...step, label: how.step(index + 1) }))} />
    </section>
  );
}
