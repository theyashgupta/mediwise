import { FaqList } from "@/components/faq-list";
import { SectionHeader } from "@/components/section-header";
import { messages, type Locale } from "@/config/messages";
import { facts } from "@/lib/facts";

export function Faq({ locale }: { locale: Locale }) {
  const { site, faq: t } = messages[locale];
  const { upload, labs, accuracy, diagnosis, data, refund, family } = t;
  const questions = [
    { ...upload, answer: upload.answer(facts.maxFiles, facts.maxFileMb, facts.maxTotalMb) },
    { ...labs, answer: labs.answer(facts.markers) },
    accuracy,
    { ...diagnosis, answer: diagnosis.answer(site.disclaimer) },
    data,
    refund,
    { ...family, answer: family.answer(facts.maxProfiles) },
  ];
  return (
    <section id="faq" aria-labelledby="faq-title" className="border-t bg-sidebar">
      <div className="mx-auto grid max-w-content gap-10 px-4 py-12 md:px-8 md:py-20 lg:grid-cols-[1fr_1.6fr]">
        <SectionHeader id="faq-title" eyebrow={t.eyebrow} title={t.title} />
        <FaqList questions={questions} />
      </div>
    </section>
  );
}
