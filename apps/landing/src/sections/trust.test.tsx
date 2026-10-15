import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { Trust } from "./trust";

test("the trust block lists five items and links to the security page", () => {
  const html = renderToStaticMarkup(<Trust locale="hi" />);
  expect(html.match(/<li /g)).toHaveLength(5);
  expect(html).toContain('href="/hi/security"');
});
