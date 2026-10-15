import { Bug, Fingerprint, KeyRound, Lock, ShieldCheck, Trash2, EyeOff } from "lucide-react";
import { messages, type Locale } from "@/config/messages";
import { buttonStyles, securityPolicyUrl } from "@/lib/site";
import { Footer } from "@/sections/footer";
import { Nav } from "@/sections/nav";

export function Security({ locale }: { locale: Locale }) {
  const t = messages[locale].security;
  const items = [
    { icon: Lock, ...t.items.encryption },
    { icon: KeyRound, ...t.items.storage },
    { icon: EyeOff, ...t.items.trackers },
    { icon: Trash2, ...t.items.deletion },
    { icon: Fingerprint, ...t.items.shareLinks },
    { icon: ShieldCheck, ...t.items.supplyChain },
  ];
  return (
    <>
      <Nav locale={locale} />
      <main id="main" className="mx-auto max-w-content px-4 py-16 md:px-8 md:py-20">
        <h1 className="font-display text-4xl text-balance md:text-5xl">{t.title}</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{t.intro}</p>
        <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, title, body }) => (
            <li key={title}>
              <Icon aria-hidden className="size-5 text-primary" />
              <h2 className="mt-3 font-semibold">{title}</h2>
              <p className="mt-1 text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>
        <section
          aria-labelledby="report-title"
          className="mt-16 rounded-2xl border bg-card p-6 md:p-8"
        >
          <Bug aria-hidden className="size-5 text-primary" />
          <h2 id="report-title" className="mt-3 text-xl font-semibold">
            {t.report.title}
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">{t.report.body}</p>
          <a href={securityPolicyUrl} className={`${buttonStyles.outline} mt-6`}>
            {t.report.link}
          </a>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}
