import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { messages } from "@/config/messages";
import { Footer } from "./footer";
import { Security } from "./security";
import { Trust } from "./trust";

test("the security page lists every control and links to SECURITY.md in both languages", () => {
  for (const locale of ["en", "hi"] as const) {
    const html = renderToStaticMarkup(<Security locale={locale} />);
    for (const item of Object.values(messages[locale].security.items)) {
      expect(html).toContain(item.title);
    }
    expect(html).toContain('href="https://github.com/theyashgupta/mediwise/blob/main/SECURITY.md"');
  }
});

test("the trust section and the footer link to the security page of the same language", () => {
  expect(renderToStaticMarkup(<Trust locale="en" />)).toContain('href="/security"');
  expect(renderToStaticMarkup(<Trust locale="hi" />)).toContain('href="/hi/security"');
  expect(renderToStaticMarkup(<Footer locale="en" />)).toContain('href="/security"');
  expect(renderToStaticMarkup(<Footer locale="hi" />)).toContain('href="/hi/security"');
});

test("no landing text claims a certification or says Stored in India alone", () => {
  const text = JSON.stringify(messages);
  expect(text).not.toMatch(/SOC 2|HIPAA|compliant|Stored in India\./i);
});
