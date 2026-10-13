import { PhoneSteps } from "@/components/phone-steps";
import { SectionHeader } from "@/components/section-header";
import { messages, type Locale } from "@/config/messages";
import { facts } from "@/lib/facts";

export function HowItWorks({ locale }: { locale: Locale }) {
  const t = messages[locale].howItWorks;
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-title"
      className="mx-auto max-w-content px-4 py-12 md:px-8 md:py-20"
    >
      <SectionHeader id="how-title" eyebrow={t.eyebrow} title={t.title}>
        {t.body}
      </SectionHeader>
      <PhoneSteps
        steps={[
          {
            title: t.upload.title,
            body: t.upload.body(facts.maxFiles),
            screen: "upload",
            alt: t.upload.alt(facts.maxFiles),
          },
          { ...t.understand, screen: "marker" },
          { ...t.track, screen: "trends" },
        ]}
      />
    </section>
  );
}
