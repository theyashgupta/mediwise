import { SectionHeader } from "@/components/section-header";
import { Story } from "@/components/story";
import { messages, type Locale } from "@/config/messages";

export function FeatureStory({ locale }: { locale: Locale }) {
  const t = messages[locale].story;
  return (
    <section aria-labelledby="story-title" className="border-t bg-sidebar">
      <div className="mx-auto max-w-content px-4 py-12 md:px-8 md:py-20">
        <SectionHeader id="story-title" eyebrow={t.eyebrow} title={t.title}>
          {t.body}
        </SectionHeader>
        <div className="mt-10">
          <Story
            scenes={[
              { ...t.alert, screen: "alert" },
              { ...t.findings, screen: "findings" },
              { ...t.moveFirst, screen: "move-first" },
              { ...t.questions, screen: "questions" },
            ]}
          />
        </div>
      </div>
    </section>
  );
}
