import { PhoneSteps } from "@/components/phone-steps";
import { SectionHeader } from "@/components/section-header";
import { messages, type Locale } from "@/config/messages";
import { facts } from "@/lib/facts";

export function History({ locale }: { locale: Locale }) {
  const t = messages[locale].history;
  return (
    <section
      aria-labelledby="history-title"
      className="mx-auto max-w-content px-4 py-12 md:px-8 md:py-20"
    >
      <SectionHeader id="history-title" eyebrow={t.eyebrow} title={t.title}>
        {t.body}
      </SectionHeader>
      <PhoneSteps
        steps={[
          {
            ...t.settled,
            body: t.settled.body(facts.repeatStudyDays),
            screen: "settled",
          },
          { ...t.episode, screen: "episode" },
          { ...t.hindi, screen: "hindi" },
        ]}
      />
    </section>
  );
}
