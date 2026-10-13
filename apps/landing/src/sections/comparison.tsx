import { Check, Minus } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { messages, type Locale } from "@/config/messages";
import { facts } from "@/lib/facts";

export function Comparison({ locale }: { locale: Locale }) {
  const t = messages[locale].comparison;
  const { explained, scored, tracked, family, flags, cost } = t.rows;
  const rows = [
    explained,
    scored,
    tracked,
    { ...family, us: family.us(facts.maxProfiles) },
    flags,
    { ...cost, us: cost.us(facts.cheapest.perReport) },
  ];
  return (
    <section
      aria-labelledby="compare-title"
      className="mx-auto max-w-content px-4 py-12 md:px-8 md:py-20"
    >
      <SectionHeader id="compare-title" eyebrow={t.eyebrow} title={t.title} />
      <div className="reveal mt-12 overflow-hidden rounded-xl border bg-card">
        <table className="w-full table-fixed text-left text-sm md:text-base">
          <caption className="sr-only">{t.caption}</caption>
          <thead>
            <tr className="border-b">
              <th
                scope="col"
                className="w-[28%] px-4 py-4 font-normal text-muted-foreground md:px-6"
              >
                <span className="sr-only">{t.feature}</span>
              </th>
              <th scope="col" className="px-4 py-4 font-medium text-muted-foreground md:px-6">
                {t.pdf}
              </th>
              <th scope="col" className="bg-primary/6 px-4 py-4 font-semibold text-primary md:px-6">
                MediWise
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row" className="px-4 py-4 align-top font-medium md:px-6">
                  {row.label}
                </th>
                <td className="px-4 py-4 align-top text-muted-foreground md:px-6">
                  <span className="flex gap-2">
                    <Minus aria-hidden className="mt-0.5 hidden size-4 shrink-0 sm:block" />
                    {row.pdf}
                  </span>
                </td>
                <td className="bg-primary/6 px-4 py-4 align-top md:px-6">
                  <span className="flex gap-2">
                    <Check
                      aria-hidden
                      className="mt-0.5 hidden size-4 shrink-0 text-primary sm:block"
                    />
                    {row.us}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
