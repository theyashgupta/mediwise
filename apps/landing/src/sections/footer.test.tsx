import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { messages } from "@/config/messages";
import { Footer } from "./footer";

test("the footer names Codegenix as the company of the MediWise brand in both languages", () => {
  const year = new Date().getFullYear();
  expect(renderToStaticMarkup(<Footer locale="en" />)).toContain(
    `© ${year} MediWise. MediWise is a brand of Codegenix.`,
  );
  expect(renderToStaticMarkup(<Footer locale="hi" />)).toContain("Codegenix का एक ब्रांड है");
});

test("the footer says the screens show sample data, next to the disclaimer, in both languages", () => {
  for (const locale of ["en", "hi"] as const) {
    const t = messages[locale].site;
    expect(renderToStaticMarkup(<Footer locale={locale} />)).toContain(
      `${t.disclaimer} ${t.sampleData}`,
    );
  }
});
