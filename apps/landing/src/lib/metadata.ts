import type { Metadata, Viewport } from "next";
import { localePages, locales, messages, type Locale } from "../config/messages";
import { siteUrl } from "./site";

/**
 * Maps each page's language tag to its absolute URL, for hreflang links and the sitemap.
 */
export function alternateUrls() {
  return Object.fromEntries(
    locales.map((locale) => [localePages[locale].lang, `${siteUrl}${localePages[locale].path}`]),
  );
}

/**
 * Builds the title, description, hreflang links and Open Graph tags of one language's page.
 */
export function pageMetadata(locale: Locale): Metadata {
  const { title, description } = messages[locale].site;
  const page = localePages[locale];
  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: {
      canonical: page.path,
      languages: { ...alternateUrls(), "x-default": `${siteUrl}/` },
    },
    icons: {
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/favicon.ico", sizes: "any" },
      ],
      apple: "/apple-touch-icon.png",
    },
    openGraph: {
      type: "website",
      url: page.path,
      siteName: "MediWise",
      locale: page.ogLocale,
      alternateLocale: locales
        .filter((other) => other !== locale)
        .map((other) => localePages[other].ogLocale),
      title,
      description,
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "MediWise" }],
    },
    twitter: { card: "summary_large_image", images: ["/og-image.png"] },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBFAF7" },
    { media: "(prefers-color-scheme: dark)", color: "#181715" },
  ],
};
