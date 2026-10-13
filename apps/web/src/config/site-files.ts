/**
 * Returns the web app manifest with `start_url` and `scope` on the app origin.
 *
 * @remarks
 * A browser ignores both on a pages.dev alias, because they name another origin, and falls back to the page it installs from.
 */
export function webManifest(appOrigin: string) {
  return {
    name: "MediWise",
    short_name: "MediWise",
    start_url: `${appOrigin}/`,
    scope: `${appOrigin}/`,
    display: "standalone",
    theme_color: "#FBFAF7",
    background_color: "#FBFAF7",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

const publicPaths = ["/login", "/signup", "/terms", "/privacy", "/refunds", "/contact"];

/** Returns robots.txt for the app: the public pages are open to crawlers, the signed-in pages are not. */
export function robotsTxt(appOrigin: string) {
  return [
    "User-agent: *",
    ...publicPaths.map((path) => `Allow: ${path}`),
    "Disallow: /",
    "",
    `Sitemap: ${appOrigin}/sitemap.xml`,
    "",
  ].join("\n");
}

/** Returns sitemap.xml with the public pages of the app. */
export function sitemapXml(appOrigin: string) {
  const urls = publicPaths.map((path) => `  <url><loc>${appOrigin}${path}</loc></url>`);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}

/** Builds each generated file at its public path, for the dev server and the build. */
export function siteFiles(appOrigin: string): Record<string, string> {
  return {
    "/site.webmanifest": JSON.stringify(webManifest(appOrigin), null, 2),
    "/robots.txt": robotsTxt(appOrigin),
    "/sitemap.xml": sitemapXml(appOrigin),
  };
}
