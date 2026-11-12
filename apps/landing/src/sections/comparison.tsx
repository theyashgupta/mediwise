import { Check, X } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { messages, type Locale } from "@/config/messages";
import { facts } from "@/lib/facts";
import { cn } from "@/lib/utils";

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
  const cellLabel =
    "mb-1 block font-sans text-xs tracking-wider text-muted-foreground uppercase md:hidden";
  const mark = "mt-0.5 size-4 shrink-0 md:mt-1";
  return (
    <section
      aria-labelledby="compare-title"
      className="mx-auto max-w-content px-4 py-12 md:px-8 md:py-20"
    >
      <SectionHeader id="compare-title" eyebrow={t.eyebrow} title={t.title} />
      <table
        role="table"
        data-reveal=""
        className="mt-12 w-full border-separate border-spacing-0 text-left wrap-anywhere max-md:block md:table-fixed"
      >
        <caption className="sr-only">{t.caption}</caption>
        <thead role="rowgroup" className="max-md:sr-only">
          <tr role="row">
            <th role="columnheader" scope="col" className="md:w-1/4">
              <span className="sr-only">{t.feature}</span>
            </th>
            <th
              role="columnheader"
              scope="col"
              className="px-6 pt-5 pb-3 align-bottom font-mono text-base font-semibold text-muted-foreground"
            >
              {t.pdf}
            </th>
            <th
              role="columnheader"
              scope="col"
              className="rounded-t-xl border-x border-t border-primary/40 bg-primary/6 px-6 pt-5 pb-3 align-bottom text-base font-semibold text-primary"
            >
              MediWise
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup" className="max-md:block">
          {rows.map((row, i) => {
            const marked = row !== rows.at(-1);
            const last = i === rows.length - 1;
            return (
              <tr key={row.label} role="row" className="max-md:block max-md:border-t max-md:py-5">
                <th
                  role="rowheader"
                  scope="row"
                  className="align-top font-semibold max-md:block max-md:pb-2 md:border-t md:py-4 md:pr-4 md:text-sm md:font-medium md:text-muted-foreground"
                >
                  {row.label}
                </th>
                <td
                  role="cell"
                  className="align-top font-mono text-sm text-muted-foreground max-md:block max-md:px-3 max-md:py-2 md:border-t md:border-dashed md:px-6 md:py-4 md:text-base"
                >
                  <span aria-hidden className={cellLabel}>
                    {t.pdf}
                  </span>
                  <span className="flex gap-2">
                    {marked && (
                      <X role="img" aria-label={t.no} className={cn(mark, "text-destructive")} />
                    )}
                    <span className={cn(!marked && "md:pl-6")}>{row.pdf}</span>
                  </span>
                </td>
                <td
                  role="cell"
                  className={cn(
                    "border-primary/40 bg-primary/6 align-top text-sm max-md:mt-2 max-md:block max-md:rounded-lg max-md:border max-md:p-3 md:border-x md:border-t md:border-t-primary/20 md:px-6 md:py-4 md:text-base",
                    last && "md:rounded-b-xl md:border-b",
                  )}
                >
                  <span aria-hidden className={cellLabel}>
                    MediWise
                  </span>
                  <span className="flex gap-2">
                    {marked && (
                      <Check role="img" aria-label={t.yes} className={cn(mark, "text-optimal")} />
                    )}
                    <span className={cn(!marked && "md:pl-6")}>{row.us}</span>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
