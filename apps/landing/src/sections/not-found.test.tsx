import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { NotFound } from "./not-found";

test("the English 404 page links home, to the page sections and to the Hindi page", () => {
  const html = renderToStaticMarkup(<NotFound locale="en" />);
  expect(html).toContain("Page not found");
  expect(html).toContain('href="/#how-it-works"');
  expect(html).toContain('href="/hi" hrefLang="hi-IN"');
});

test("the Hindi 404 page shows Hindi text and links to the Hindi home page and to English", () => {
  const html = renderToStaticMarkup(<NotFound locale="hi" />);
  expect(html).toContain("पेज नहीं मिला");
  expect(html).toContain('href="/hi#how-it-works"');
  expect(html).toContain('href="/" hrefLang="en"');
});
