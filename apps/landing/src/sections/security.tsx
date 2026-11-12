import type { Locale } from "@/config/messages";
import { content, sanitizeHtml } from "@/lib/content";
import { Footer } from "@/sections/footer";
import { Nav } from "@/sections/nav";

export function Security({ locale }: { locale: Locale }) {
  const { title, html } = content[locale].pages.security;
  return (
    <>
      <Nav locale={locale} />
      <main id="main" className="mx-auto max-w-content px-4 py-16 md:px-8 md:py-20">
        <h1 className="font-display text-4xl text-balance md:text-5xl">{title}</h1>
        <div
          className="mt-4 max-w-2xl text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-10 [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&>p:first-child]:text-lg"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
        />
      </main>
      <Footer locale={locale} />
    </>
  );
}
