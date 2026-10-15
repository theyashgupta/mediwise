import { Inter, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { localePages, type Locale } from "@/config/messages";
import { siteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";
import { contact } from "../../../web/src/modules/payments/config/policies";
import "../app/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: false,
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  preload: false,
});

const organization = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: contact.brand,
  legalName: contact.businessName,
  url: siteUrl,
  logo: `${siteUrl}/apple-touch-icon.png`,
  email: contact.email,
  telephone: contact.phone,
});

const restoreMotion = `try{if(localStorage.getItem("motion")==="paused")document.documentElement.dataset.motion="paused"}catch(e){}`;

export function Document({
  locale,
  fontClassName,
  children,
}: {
  locale: Locale;
  fontClassName: string;
  children: ReactNode;
}) {
  return (
    <html
      lang={localePages[locale].lang}
      className={cn(inter.variable, jetbrainsMono.variable, fontClassName)}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="preload"
          as="image"
          href="/screens/report-light.webp"
          media="(prefers-color-scheme: light)"
          fetchPriority="high"
        />
        <link
          rel="preload"
          as="image"
          href="/screens/report-dark.webp"
          media="(prefers-color-scheme: dark)"
          fetchPriority="high"
        />
        <script dangerouslySetInnerHTML={{ __html: restoreMotion }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: organization }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
