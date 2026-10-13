import { Logo } from "../../../web/src/common/components/brand/logo";
import { LanguageSwitch } from "@/components/language-switch";
import { messages, type Locale } from "@/config/messages";
import { appLinks, buttonStyles } from "@/lib/site";

const socialLinks: { href: string; label: string }[] = [];

export function FinalCta({ locale }: { locale: Locale }) {
  const t = messages[locale].site;
  return (
    <section
      aria-labelledby="cta-title"
      className="mx-auto max-w-content px-4 py-12 md:px-8 md:py-20"
    >
      <div className="reveal rounded-2xl border bg-card px-6 py-14 text-center md:px-12">
        <h2
          id="cta-title"
          className="text-3xl font-semibold tracking-tight text-balance md:text-4xl"
        >
          {t.finalCta.title}
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">{t.finalCta.body}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href={appLinks.signUp(locale)} className={buttonStyles.primary}>
            {t.readReport}
          </a>
          <a href={appLinks.signIn(locale)} className={buttonStyles.outline}>
            {t.signIn}
          </a>
        </div>
      </div>
    </section>
  );
}

export function Footer({ locale }: { locale: Locale }) {
  const t = messages[locale].site;
  const policyLinks = [
    { href: appLinks.terms, label: t.footer.terms },
    { href: appLinks.privacy, label: t.footer.privacy },
    { href: appLinks.refunds, label: t.footer.refunds },
    { href: appLinks.contact, label: t.footer.contact },
  ];
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-content flex-col gap-8 px-4 py-10 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <Logo />
          <nav aria-label={t.footer.policies}>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {[...policyLinks, ...socialLinks].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="underline-offset-4 hover:text-foreground hover:underline"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <p className="text-sm text-muted-foreground">{t.disclaimer}</p>
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} MediWise</p>
          <LanguageSwitch current={locale} className="text-sm" />
        </div>
      </div>
    </footer>
  );
}
