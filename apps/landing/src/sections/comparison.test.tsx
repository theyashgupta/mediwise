import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { messages, type Locale } from "@/config/messages";
import { facts } from "@/lib/facts";
import { Comparison } from "./comparison";

const rowsOf = (html: string) => html.split("<tr ").slice(2);

test.each<Locale>(["en", "hi"])(
  "the %s comparison is one table with six rows and labelled marks",
  (locale) => {
    const t = messages[locale].comparison;
    const html = renderToStaticMarkup(<Comparison locale={locale} />);
    expect(html.match(/<table/g)).toHaveLength(1);
    expect(html).toContain(`<caption class="sr-only">${t.caption}</caption>`);
    expect(html.match(/scope="row"/g)).toHaveLength(6);
    expect(html.match(new RegExp(`role="img" aria-label="${t.yes}"`, "g"))).toHaveLength(5);
    expect(html.match(new RegExp(`role="img" aria-label="${t.no}"`, "g"))).toHaveLength(5);
  },
);

test("each row lists the lab PDF value before the MediWise value", () => {
  const t = messages.en.comparison;
  const rows = rowsOf(renderToStaticMarkup(<Comparison locale="en" />));
  expect(rows).toHaveLength(6);
  for (const row of rows) {
    const pdf = row.indexOf(`>${t.pdf}<`);
    expect(pdf).toBeGreaterThan(row.indexOf('scope="row"'));
    expect(row.indexOf(">MediWise<")).toBeGreaterThan(pdf);
  }
});

test("the cost row shows plain text on both sides with no mark", () => {
  const t = messages.en.comparison;
  const cost = rowsOf(renderToStaticMarkup(<Comparison locale="en" />)).at(-1)!;
  expect(cost).toContain(t.rows.cost.pdf);
  expect(cost).toContain(t.rows.cost.us(facts.cheapest.perReport));
  expect(cost).not.toContain('role="img"');
});
