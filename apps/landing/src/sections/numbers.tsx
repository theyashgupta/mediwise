import { NumberTicker } from "@/components/motion";
import { messages, type Locale } from "@/config/messages";
import { facts } from "@/lib/facts";

export function Numbers({ locale }: { locale: Locale }) {
  const t = messages[locale].numbers;
  const numbers = [
    { value: facts.markers, label: t.markers },
    { value: facts.patterns, label: t.patterns },
    { value: facts.sources, label: t.sources },
    { value: facts.cheapestPaise / 100, decimals: 2, prefix: "₹", label: t.lowestPrice },
  ];
  return (
    <section aria-labelledby="numbers-title" className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-content px-4 py-14 md:px-8 md:py-24">
        <h2 id="numbers-title" className="sr-only">
          {t.title}
        </h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
          {numbers.map((number) => (
            <div
              key={number.label}
              className="@container flex flex-col-reverse justify-end border-t border-primary-foreground/30 pt-5"
            >
              <dt className="mt-2 text-sm text-pretty md:text-base">{number.label}</dt>
              <dd className="text-[min(4.5rem,26cqi)] leading-none tracking-tight">
                <NumberTicker
                  value={number.value}
                  decimals={number.decimals}
                  prefix={number.prefix}
                />
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-12 text-xs">{t.note}</p>
      </div>
    </section>
  );
}
