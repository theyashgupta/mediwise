import type { MetadataRoute } from "next";
import { locales } from "../config/messages";
import { alternateUrls, homePath } from "../lib/metadata";
import { securityPath, siteUrl } from "../lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [homePath, securityPath].flatMap((pathOf) =>
    locales.map((locale) => ({
      url: `${siteUrl}${pathOf(locale)}`,
      alternates: { languages: alternateUrls(pathOf) },
    })),
  );
}
