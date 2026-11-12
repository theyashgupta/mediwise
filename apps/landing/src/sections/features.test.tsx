import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { messages } from "@/config/messages";
import { facts } from "@/lib/facts";
import { Features } from "./features";

/**
 * Lists the title and the sentence of each vignette, with the fact values filled in.
 */
function captions(locale: "en" | "hi") {
  const t = messages[locale].features;
  return [
    [t.files.title(facts.maxFiles), t.files.body(facts.maxFileMb, facts.maxTotalMb)],
    [t.studies.title, t.studies.body],
    [t.family.title, t.family.body(facts.maxProfiles)],
    [t.doctor.title, t.doctor.body],
    [t.questions.title, t.questions.body],
    [t.settled.title, t.settled.body(facts.repeatStudyDays)],
    [t.episode.title, t.episode.body],
    [t.trends.title, t.trends.body],
  ] as const;
}

test("the features section shows 8 vignettes, each with its title, sentence and fact values", () => {
  for (const locale of ["en", "hi"] as const) {
    const html = renderToStaticMarkup(<Features locale={locale} />);
    expect(html.match(/<li /g)).toHaveLength(8);
    expect(html.match(/<svg viewBox="0 0 240 160"/g)).toHaveLength(8);
    for (const text of [...captions(locale).flat(), messages[locale].features.family.language]) {
      expect(html).toContain(text);
    }
  }
});

test("each English title has 3 to 6 words and each sentence at most 14", () => {
  for (const [title, body] of captions("en")) {
    const words = (text: string) => text.split(/\s+/).length;
    expect(words(title)).toBeGreaterThanOrEqual(3);
    expect(words(title)).toBeLessThanOrEqual(6);
    expect(words(body)).toBeLessThanOrEqual(14);
  }
});

test("every vignette is decoration that screen readers skip", () => {
  const html = renderToStaticMarkup(<Features locale="en" />);
  expect(html.match(/<svg [^>]*>/g)?.every((tag) => tag.includes('aria-hidden="true"'))).toBe(true);
});
