import { CreditCard, IdCard, MapPin, Scale, Stethoscope } from "lucide-react";
import { messages, type Locale } from "@/config/messages";

export function Trust({ locale }: { locale: Locale }) {
  const t = messages[locale].trust;
  const items = [
    { icon: MapPin, ...t.storage },
    { icon: Scale, ...t.law },
    { icon: Stethoscope, ...t.diagnosis },
    { icon: IdCard, ...t.identity },
    { icon: CreditCard, ...t.payments },
  ];
  return (
    <section aria-labelledby="trust-title" className="border-y bg-card">
      <div className="mx-auto max-w-content px-4 py-12 md:px-8 md:py-16">
        <h2 id="trust-title" className="sr-only">
          {t.title}
        </h2>
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6">
          {items.map(({ icon: Icon, title, body }) => (
            <li key={title}>
              <Icon aria-hidden className="size-5 text-primary" />
              <h3 className="mt-3 text-sm font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
