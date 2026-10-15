import type { Metadata, Viewport } from "next";
import { localePages, locales, messages, type Locale } from "../config/messages";
import { securityPath, siteUrl } from "./site";

export const homePath = (locale: Locale) => localePages[locale].path;

/**
 * Maps each page's language tag to its absolute URL, plus x-default for the English page, for hreflang links and the sitemap.
 */
export function alternateUrls(pathOf: (locale: Locale) => string = homePath) {
  return {
    ...Object.fromEntries(
      locales.map((locale) => [localePages[locale].lang, `${siteUrl}${pathOf(locale)}`]),
    ),
    "x-default": `${siteUrl}${pathOf("en")}`,
  };
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
      languages: alternateUrls(),
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

export function securityMetadata(locale: Locale): Metadata {
  const { title, description } = messages[locale].security;
  return {
    title,
    description,
    alternates: { canonical: securityPath(locale), languages: alternateUrls(securityPath) },
  };
}

/**
 * Builds the title of one language's 404 page and keeps the page out of search results.
 */
export function notFoundMetadata(locale: Locale): Metadata {
  return { title: messages[locale].site.notFound.title, robots: { index: false } };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBFAF7" },
    { media: "(prefers-color-scheme: dark)", color: "#181715" },
  ],
};
