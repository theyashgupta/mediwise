import { Section } from "@/common/components/section";
import { useT } from "@/common/hooks/use-locale";
import type { SettledFinding } from "../types";
import { SequenceSteps } from "./sequence-steps";

type SettledListProps = { items: SettledFinding[] };

export function SettledList({ items }: SettledListProps) {
  const t = useT();
  if (items.length === 0) return null;
  return (
    <Section id="settled" title={t.report.settled.title} description={t.report.settled.description}>
      <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3" data-testid="settled-findings">
        {items.map((item) => (
          <li key={item.title}>
            <article className="flex h-full flex-col gap-3 rounded-xl border bg-card p-5">
              <h3 className="font-semibold text-balance">{item.title}</h3>
              <SequenceSteps sequence={item} />
            </article>
          </li>
        ))}
      </ul>
    </Section>
  );
}
