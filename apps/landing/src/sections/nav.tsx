import { Logo } from "../../../web/src/common/components/brand/logo";
import { LanguageSwitch } from "@/components/language-switch";
import { messages, type Locale } from "@/config/messages";
import { appLinks } from "@/lib/site";

export function Nav({ locale }: { locale: Locale }) {
  const t = messages[locale].site;
  const links = [
    { href: "#how-it-works", label: t.nav.howItWorks },
    { href: "#pricing", label: t.nav.pricing },
    { href: "#faq", label: t.nav.faq },
  ];
  return (
    <header className="sticky top-0 z-40">
      <div
        aria-hidden
        className="nav-backdrop absolute inset-0 border-b bg-(--glass-tint-bar) backdrop-blur-(--blur-glass-bar)"
      />
      <div aria-hidden className="scroll-progress absolute inset-x-0 bottom-0 h-px bg-primary" />
      <nav
        aria-label={t.nav.label}
        className="relative mx-auto flex h-13 max-w-content items-center gap-8 px-4 text-sm md:h-14 md:px-8"
      >
        <a
          href="#top"
          className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          <Logo className="text-sm" />
        </a>
        <ul className="hidden gap-6 text-muted-foreground md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="transition-colors hover:text-foreground">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="ml-auto flex items-center gap-3 sm:gap-4">
          <LanguageSwitch current={locale} compact />
          <a
            href={appLinks.signIn}
            className="inline-flex h-8 items-center rounded-md font-medium whitespace-nowrap transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            {t.signIn}
          </a>
          <a
            href={appLinks.signUp}
            className="inline-flex h-8 items-center rounded-md bg-primary px-3 whitespace-nowrap font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {t.readReport}
          </a>
        </div>
      </nav>
    </header>
  );
}
