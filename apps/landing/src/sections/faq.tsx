import { FaqList } from "@/components/faq-list";
import { SectionHeader } from "@/components/section-header";
import { messages, type Locale } from "@/config/messages";
import { faqItems } from "@/lib/content";

export function Faq({ locale }: { locale: Locale }) {
  const t = messages[locale].faq;
  return (
    <section id="faq" aria-labelledby="faq-title" className="border-t bg-sidebar">
      <div className="mx-auto grid max-w-content gap-10 px-4 py-12 md:px-8 md:py-20 lg:grid-cols-[1fr_1.6fr]">
        <SectionHeader id="faq-title" eyebrow={t.eyebrow} title={t.title} />
        <FaqList questions={faqItems(locale)} />
      </div>
    </section>
  );
}
