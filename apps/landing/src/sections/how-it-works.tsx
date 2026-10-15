import { SectionHeader } from "@/components/section-header";
import { Story, type Scene } from "@/components/story";
import { messages, type Locale } from "@/config/messages";
import { facts } from "@/lib/facts";

export function HowItWorks({ locale }: { locale: Locale }) {
  const { howItWorks: how, story } = messages[locale];
  const scenes: Scene[] = [
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
  ];
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-title"
      className="story-section mx-auto max-w-content px-4 pt-12 md:px-8 md:pt-20"
    >
      <SectionHeader id="how-title" eyebrow={how.eyebrow} title={how.title}>
        {how.body}
      </SectionHeader>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{story.body}</p>
      <Story scenes={scenes} />
    </section>
  );
}
