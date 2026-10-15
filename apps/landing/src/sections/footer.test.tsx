import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { Footer } from "./footer";

test("the footer names Codegenix as the company of the MediWise brand in both languages", () => {
  const year = new Date().getFullYear();
  expect(renderToStaticMarkup(<Footer locale="en" />)).toContain(
    `© ${year} MediWise. MediWise is a brand of Codegenix.`,
  );
  expect(renderToStaticMarkup(<Footer locale="hi" />)).toContain("Codegenix का एक ब्रांड है");
});
