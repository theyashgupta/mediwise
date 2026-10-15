import { CreditCard, IdCard, Lock, Scale, Stethoscope } from "lucide-react";
import { messages, type Locale } from "@/config/messages";
import { securityPath } from "@/lib/site";

export function Trust({ locale }: { locale: Locale }) {
  const t = messages[locale].trust;
  const items = [
    { icon: Lock, ...t.storage },
    { icon: Scale, ...t.law },
    { icon: Stethoscope, ...t.diagnosis },
    { icon: IdCard, ...t.identity },
    { icon: CreditCard, ...t.payments },
  ];
  return (
    <section aria-labelledby="trust-title" className="border-y bg-card">
      <div className="mx-auto max-w-2xl px-4 py-14 md:py-20">
        <h2
          id="trust-title"
          data-reveal=""
          className="text-2xl font-semibold tracking-tight text-balance md:text-3xl"
        >
          {t.title}
        </h2>
        <ul className="mt-8 divide-y border-y">
          {items.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-4 py-5">
              <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ul>
        <a
          href={securityPath(locale)}
          className="mt-6 inline-block text-sm font-medium underline underline-offset-4"
        >
          {t.securityLink}
        </a>
      </div>
    </section>
  );
}
