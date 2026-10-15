import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { messages } from "@/config/messages";
import { Numbers } from "./numbers";

test("the numbers band renders the final catalog counts and the lowest price before any count-up", () => {
  for (const locale of ["en", "hi"] as const) {
    const html = renderToStaticMarkup(<Numbers locale={locale} />);
    const values = [
      ...html.matchAll(/<span class="inline-block font-mono tabular-nums"[^>]*>([^<]+)<\/span>/g),
    ].map((match) => match[1]);
    expect(values).toHaveLength(4);
    expect(values[3]).toMatch(/^₹\d+\.\d{2}$/);
    expect(values.slice(0, 3).every((value) => /^\d+$/.test(value ?? ""))).toBe(true);
    expect(html).toContain(messages[locale].numbers.note);
  }
});
