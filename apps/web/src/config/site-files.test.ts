import { expect, test } from "vitest";
import { siteFiles, webManifest } from "./site-files";

const origin = "https://app.mediwise.theyashgupta.me";

test("the manifest starts and scopes the app on its origin", () => {
  expect(webManifest(origin)).toMatchObject({
    start_url: "https://app.mediwise.theyashgupta.me/",
    scope: "https://app.mediwise.theyashgupta.me/",
  });
});

test("the manifest takes shared PDFs and photos as a multipart POST to the share target", () => {
  const { share_target } = webManifest(origin);
  expect(share_target).toMatchObject({ action: "/share-target", method: "POST" });
  expect(share_target.params.files[0]?.accept).toEqual(
    expect.arrayContaining(["application/pdf", ".pdf", "image/heic", ".heic", ".jpg", ".png"]),
  );
});

test("robots.txt points to the sitemap on the app origin and closes the signed-in pages", () => {
  const robots = siteFiles(origin)["/robots.txt"] ?? "";
  expect(robots).toContain("Sitemap: https://app.mediwise.theyashgupta.me/sitemap.xml");
  expect(robots).toContain("Allow: /login");
  expect(robots).toContain("Disallow: /\n");
});

test("every sitemap URL is on the app origin", () => {
  const sitemap = siteFiles(origin)["/sitemap.xml"] ?? "";
  const locs = [...sitemap.matchAll(/<loc>(.+?)<\/loc>/g)].map(([, loc]) => loc ?? "");
  expect(locs).toContain("https://app.mediwise.theyashgupta.me/terms");
  expect(locs.every((loc) => loc.startsWith(`${origin}/`))).toBe(true);
});
