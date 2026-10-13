import { NumberTicker } from "@/components/motion";
import { facts } from "@/lib/facts";

const numbers = [
  { value: facts.markers, label: "lab markers in the catalog" },
  { value: facts.patterns, label: "patterns that link two or more markers" },
  { value: facts.sources, label: "published sources behind the ranges" },
  {
    value: facts.cheapestPaise / 100,
    decimals: 2,
    prefix: "₹",
    label: "the lowest price for one report",
  },
];

export function Numbers() {
  return (
    <section
      aria-labelledby="numbers-title"
      className="mx-auto max-w-content px-4 py-12 md:px-8 md:py-20"
    >
      <h2 id="numbers-title" className="sr-only">
        MediWise in numbers
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
      <p className="mt-10 text-xs text-muted-foreground">
        Counted from the MediWise catalog and price list when this page was built.
      </p>
    </section>
  );
}
