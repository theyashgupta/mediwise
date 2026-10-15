import { afterEach, expect, test, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

/** Loads the metadata helpers with the production site URL. */
async function load() {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://mediwise.theyashgupta.me");
  return import("./metadata");
}

test("each page links to both languages and to the English page as x-default", async () => {
  const { pageMetadata } = await load();
  for (const locale of ["en", "hi"] as const) {
    expect(pageMetadata(locale).alternates?.languages).toEqual({
      en: "https://mediwise.theyashgupta.me/",
      "hi-IN": "https://mediwise.theyashgupta.me/hi",
      "x-default": "https://mediwise.theyashgupta.me/",
    });
  }
});

test("the Hindi page has its own canonical link, title and Open Graph locale", async () => {
  const { pageMetadata } = await load();
  const hindi = pageMetadata("hi");
  expect(hindi.alternates?.canonical).toBe("/hi");
  expect(hindi.title).toMatch(/\p{Script=Devanagari}/u);
  expect(hindi.openGraph).toMatchObject({
    url: "/hi",
    locale: "hi_IN",
    alternateLocale: ["en_US"],
    title: hindi.title,
    description: hindi.description,
  });
});

test("the English page keeps its title and points Open Graph at the Hindi page as the alternate", async () => {
  const { pageMetadata } = await load();
  const english = pageMetadata("en");
  expect(english.alternates?.canonical).toBe("/");
  expect(english.title).toBe("MediWise: your lab report, explained marker by marker");
  expect(english.openGraph).toMatchObject({ locale: "en_US", alternateLocale: ["hi_IN"] });
});
