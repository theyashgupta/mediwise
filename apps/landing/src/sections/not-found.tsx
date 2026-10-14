import { localePages, messages, type Locale } from "@/config/messages";
import { buttonStyles } from "@/lib/site";
import { Footer } from "@/sections/footer";
import { Nav } from "@/sections/nav";

export function NotFound({ locale }: { locale: Locale }) {
  const t = messages[locale].site.notFound;
  return (
    <>
      <Nav locale={locale} />
      <main
        id="main"
        className="mx-auto flex min-h-[60vh] max-w-content flex-col items-start justify-center gap-6 px-4 py-20 md:px-8"
      >
        <p className="font-mono text-sm text-muted-foreground">404</p>
        <h1 className="font-display text-5xl text-balance md:text-6xl">{t.title}</h1>
        <p className="max-w-lg text-lg text-muted-foreground">{t.body}</p>
        <a href={localePages[locale].path} className={buttonStyles.primary}>
          {t.home}
        </a>
      </main>
      <Footer locale={locale} />
    </>
  );
}
