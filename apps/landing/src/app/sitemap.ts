import type { MetadataRoute } from "next";
import { localePages, locales } from "../config/messages";
import { alternateUrls } from "../lib/metadata";
import { siteUrl } from "../lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = alternateUrls();
  return locales.map((locale) => ({
    url: `${siteUrl}${localePages[locale].path}`,
    alternates: { languages },
  }));
}
