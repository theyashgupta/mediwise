import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { messages } from "@/config/messages";
import { content } from "@/lib/content";
import { Footer } from "./footer";
import { Security } from "./security";
import { Trust } from "./trust";

test("the security page renders the snapshot title and every heading, and links to SECURITY.md in both languages", () => {
  for (const locale of ["en", "hi"] as const) {
    const { title, html: body } = content[locale].pages.security;
    const html = renderToStaticMarkup(<Security locale={locale} />);
    expect(html).toContain(title);
    for (const [heading] of body.matchAll(/<h2>[^<]+<\/h2>/g)) expect(html).toContain(heading);
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
  const text = JSON.stringify([messages, content]);
  expect(text).not.toMatch(/SOC 2|HIPAA|compliant|Stored in India\./i);
});
