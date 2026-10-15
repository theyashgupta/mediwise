import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, test, vi } from "vitest";
import { LanguageSwitch } from "./language-switch";

afterEach(() => {
  vi.unstubAllGlobals();
});

/**
 * Clicks the switch the way a visitor does and returns what it wrote to storage.
 */
function click(current: "en" | "hi") {
  const stored = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    setItem: (key: string, value: string) => stored.set(key, value),
  });
  (LanguageSwitch({ current }).props as { onClick: () => void }).onClick();
  return Object.fromEntries(stored);
}

test("the switch on the English page links to /hi and names Hindi in Devanagari", () => {
  const html = renderToStaticMarkup(<LanguageSwitch current="en" />);
  expect(html).toContain('href="/hi"');
  expect(html).toContain('hrefLang="hi-IN"');
  expect(html).toContain('lang="hi-IN"');
  expect(html).toContain("हिन्दी");
});

test("the switch on the Hindi page links to / and names English", () => {
  const html = renderToStaticMarkup(<LanguageSwitch current="hi" />);
  expect(html).toContain('href="/"');
  expect(html).toContain('hrefLang="en"');
  expect(html).toContain(">English<");
});

test("the compact switch keeps the language name for screen readers only on a phone", () => {
  expect(renderToStaticMarkup(<LanguageSwitch current="en" compact />)).toContain(
    'class="sr-only sm:not-sr-only"',
  );
  expect(renderToStaticMarkup(<LanguageSwitch current="en" />)).not.toContain("sr-only");
});

test("a click stores the target language under the key the app reads", () => {
  expect(click("en")).toEqual({ locale: "hi" });
  expect(click("hi")).toEqual({ locale: "en" });
});

test("a click still follows the link when storage is blocked", () => {
  vi.stubGlobal("localStorage", {
    setItem: () => {
      throw new Error("blocked");
    },
  });
  expect(() =>
    (LanguageSwitch({ current: "en" }).props as { onClick: () => void }).onClick(),
  ).not.toThrow();
});
