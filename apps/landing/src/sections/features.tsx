import type { CSSProperties } from "react";
import { SectionHeader } from "@/components/section-header";
import { messages, type Locale } from "@/config/messages";
import { facts } from "@/lib/facts";

type Item = { title: string; body: string; tags?: string[] };

function Entries({ items }: { items: Item[] }) {
  return (
    <dl className="mt-8 gap-x-10 sm:columns-2 lg:columns-3">
      {items.map((item, index) => (
        <div
          key={item.title}
          data-reveal=""
          style={{ "--i": index % 3 } as CSSProperties}
          className="mb-8 break-inside-avoid border-t pt-4"
        >
          <dt className="font-medium">{item.title}</dt>
          <dd className="mt-1 text-sm text-pretty text-muted-foreground">{item.body}</dd>
          {item.tags && (
            <dd className="mt-3 flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <span key={tag} className="rounded-full border px-2.5 py-0.5 text-xs">
                  {tag}
                </span>
              ))}
            </dd>
          )}
        </div>
      ))}
    </dl>
  );
}

export function Features({ locale }: { locale: Locale }) {
  const { bento: t, history: h, story: s } = messages[locale];
  const items: Item[] = [
    { title: t.files.title(facts.maxFiles), body: t.files.body(facts.maxFileMb, facts.maxTotalMb) },
    t.studies,
    { title: t.family.title, body: t.family.body(facts.maxProfiles), tags: t.family.people },
    { title: h.hindi.title, body: h.hindi.body },
    t.doctor,
    s.questions,
    {
      title: t.cost.title,
      body: t.cost.body(facts.firstPack.price, facts.cheapest.perReport, facts.cheapest.credits),
    },
  ];
  const history: Item[] = [
    { title: h.settled.title, body: h.settled.body(facts.repeatStudyDays) },
    h.episode,
    t.trends,
  ];
  return (
    <section
      aria-labelledby="features-title"
      className="mx-auto max-w-content px-4 py-12 md:px-8 md:py-20"
    >
      <SectionHeader id="features-title" eyebrow={t.eyebrow} title={t.title} />
      <Entries items={items} />
      <p className="mt-8 font-mono text-xs tracking-wider text-primary uppercase">{h.eyebrow}</p>
      <h3 className="mt-2 text-xl font-semibold tracking-tight">{h.title}</h3>
      <p className="mt-2 max-w-2xl text-muted-foreground">{h.body}</p>
      <Entries items={history} />
    </section>
  );
}
