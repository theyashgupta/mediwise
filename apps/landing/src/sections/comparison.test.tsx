import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { messages } from "@/config/messages";
import { facts } from "@/lib/facts";
import { Comparison } from "./comparison";

test("the comparison shows both column heads and six aligned row pairs", () => {
  const t = messages.en.comparison;
  const html = renderToStaticMarkup(<Comparison locale="en" />);
  expect(html).toContain(`aria-label="${t.caption}"`);
  expect(html).toContain(t.pdf);
  expect(html.match(/grid-rows-subgrid/g)).toHaveLength(4);
  for (const row of Object.values(t.rows)) {
    expect(html.split(`</span>${row.label}</p>`)).toHaveLength(3);
  }
  expect(html).toContain(t.rows.cost.us(facts.cheapest.perReport));
});
