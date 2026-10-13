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
    <section
      aria-labelledby="numbers-title"
      className="mx-auto max-w-content px-4 py-12 md:px-8 md:py-20"
    >
      <h2 id="numbers-title" className="sr-only">
        {t.title}
      </h2>
      <dl className="grid grid-cols-2 gap-y-10 lg:grid-cols-4">
        {numbers.map((number) => (
          <div key={number.label} className="flex flex-col-reverse border-l px-5">
            <dt className="mt-2 text-sm text-muted-foreground">{number.label}</dt>
            <dd className="text-4xl tracking-tight md:text-5xl">
              <NumberTicker
                value={number.value}
                decimals={number.decimals}
                prefix={number.prefix}
              />
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-10 text-xs text-muted-foreground">{t.note}</p>
    </section>
  );
}
