import { Check, Minus } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { messages, type Locale } from "@/config/messages";
import { facts } from "@/lib/facts";
import { cn } from "@/lib/utils";

type Row = { label: string; text: string };

function Column({
  id,
  heading,
  rows,
  feature,
  ours,
}: {
  id: string;
  heading: string;
  rows: Row[];
  feature: string;
  ours: boolean;
}) {
  const Mark = ours ? Check : Minus;
  return (
    <div
      className={cn(
        "row-span-7 grid grid-rows-subgrid rounded-xl border px-3 py-4 wrap-anywhere md:px-6 md:py-6",
        ours ? "border-primary/40 bg-primary/6" : "bg-background font-mono",
      )}
    >
      <h3
        id={id}
        className={cn(
          "pb-3 text-sm font-semibold md:text-base",
          ours ? "text-primary" : "text-muted-foreground",
        )}
      >
        {heading}
      </h3>
      <ul role="list" aria-labelledby={id} className="row-span-6 grid grid-rows-subgrid">
        {rows.map((row) => (
          <li
            key={row.label}
            className={cn("border-t py-3", ours ? "border-primary/20" : "border-dashed")}
          >
            <p className="font-sans text-xs tracking-wider text-muted-foreground uppercase">
              <span className="sr-only">{feature}: </span>
              {row.label}
            </p>
            <p
              className={cn(
                "mt-1 flex gap-2 text-sm md:text-base",
                ours ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <Mark
                aria-hidden
                className={cn("mt-0.5 hidden size-4 shrink-0 sm:block", ours && "text-primary")}
              />
              {row.text}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

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
      <div
        role="group"
        aria-label={t.caption}
        data-reveal=""
        className="mt-12 grid grid-cols-2 grid-rows-[auto_repeat(6,auto)] gap-x-3 md:gap-x-6"
      >
        <Column
          id="compare-pdf"
          heading={t.pdf}
          feature={t.feature}
          ours={false}
          rows={rows.map((row) => ({ label: row.label, text: row.pdf }))}
        />
        <Column
          id="compare-us"
          heading="MediWise"
          feature={t.feature}
          ours
          rows={rows.map((row) => ({ label: row.label, text: row.us }))}
        />
      </div>
    </section>
  );
}
