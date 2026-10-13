import { SectionHeader } from "@/components/section-header";
import { messages, type Locale } from "@/config/messages";
import { facts, packs } from "@/lib/facts";
import { appLinks, buttonStyles } from "@/lib/site";
import { cn } from "@/lib/utils";

export function Pricing({ locale }: { locale: Locale }) {
  const { site, pricing: t } = messages[locale];
  return (
    <section
      id="pricing"
      aria-labelledby="pricing-title"
      className="mx-auto max-w-content px-4 py-12 md:px-8 md:py-20"
    >
      <SectionHeader id="pricing-title" eyebrow={t.eyebrow} title={t.title}>
        {t.body(facts.maxFiles)}
      </SectionHeader>
      <ul className="mt-12 grid gap-4 md:grid-cols-3">
        {packs.map((pack) => {
          const best = pack.id === facts.cheapest.id;
          return (
            <li
              key={pack.id}
              className={cn(
                "reveal flex flex-col rounded-xl border bg-card p-6",
                best && "border-primary ring-1 ring-primary",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">{t.pack(pack.credits)}</h3>
                {best && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {t.best}
                  </span>
                )}
              </div>
              <p className="mt-6 font-mono text-4xl tracking-tight">{pack.price}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {pack.credits === 1 ? t.forOneReport : t.perReport(pack.perReport)}
              </p>
              <a
                href={appLinks.signUp}
                className={cn("mt-8", best ? buttonStyles.primary : buttonStyles.outline)}
              >
                {site.readReport}
              </a>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-sm text-muted-foreground">{t.refund}</p>
    </section>
  );
}
