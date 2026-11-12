import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { messages } from "@/config/messages";
import { content } from "@/lib/content";
import { facts } from "@/lib/facts";
import { Faq } from "./faq";

test("the FAQ renders every question of the snapshot with the tokens filled from the code, in both languages", () => {
  for (const locale of ["en", "hi"] as const) {
    const html = renderToStaticMarkup(<Faq locale={locale} />);
    for (const item of content[locale].faq) expect(html).toContain(item.question);
    expect(html).not.toMatch(/\{\w+\}/);
    expect(html).toContain(`${facts.markers}`);
    expect(html).toContain(messages[locale].site.disclaimer);
  }
  expect(renderToStaticMarkup(<Faq locale="en" />)).toContain(
    `You can add up to ${facts.maxFiles} files in one report.`,
  );
});
