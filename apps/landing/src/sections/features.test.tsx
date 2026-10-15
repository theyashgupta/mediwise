import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { messages } from "@/config/messages";
import { facts } from "@/lib/facts";
import { Features } from "./features";

test("the features index lists every bento, history and questions item with its fact values, and no cards", () => {
  for (const locale of ["en", "hi"] as const) {
    const { bento: t, history: h, story: s } = messages[locale];
    const html = renderToStaticMarkup(<Features locale={locale} />);
    for (const text of [
      t.files.title(facts.maxFiles),
      t.files.body(facts.maxFileMb, facts.maxTotalMb),
      t.family.body(facts.maxProfiles),
      t.cost.body(facts.firstPack.price, facts.cheapest.perReport, facts.cheapest.credits),
      h.settled.body(facts.repeatStudyDays),
      h.hindi.body,
      s.questions.body,
      ...t.family.people,
    ]) {
      expect(html).toContain(text);
    }
    expect(html).not.toMatch(/rounded-xl|bg-card/);
  }
});
