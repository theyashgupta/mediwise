import { afterEach, expect, test, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

test("every link to the app uses NEXT_PUBLIC_APP_URL without a trailing slash, and sign-in and sign-up carry the page language", async () => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.mediwise.theyashgupta.me/");
  const { appLinks } = await import("./site");
  expect(appLinks.signIn("hi")).toBe("https://app.mediwise.theyashgupta.me/login?lang=hi");
  expect(appLinks.signUp("en")).toBe("https://app.mediwise.theyashgupta.me/signup?lang=en");
  expect(appLinks.terms).toBe("https://app.mediwise.theyashgupta.me/terms");
});

test("the sitemap lists the English and Hindi pages with hreflang links under NEXT_PUBLIC_SITE_URL", async () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://mediwise.theyashgupta.me");
  const { default: sitemap } = await import("../app/sitemap");
  const { default: robots } = await import("../app/robots");
  const languages = {
    "en-IN": "https://mediwise.theyashgupta.me/",
    "hi-IN": "https://mediwise.theyashgupta.me/hi",
  };
  expect(sitemap()).toEqual([
    { url: "https://mediwise.theyashgupta.me/", alternates: { languages } },
    { url: "https://mediwise.theyashgupta.me/hi", alternates: { languages } },
  ]);
  expect(robots().sitemap).toBe("https://mediwise.theyashgupta.me/sitemap.xml");
});

test("without the variables the links stay on the local dev servers", async () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
  const { appUrl, siteUrl } = await import("./site");
  expect({ appUrl, siteUrl }).toEqual({
    appUrl: "http://localhost:5173",
    siteUrl: "http://localhost:3000",
  });
});
