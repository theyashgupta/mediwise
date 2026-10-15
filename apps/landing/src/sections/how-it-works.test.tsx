import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { messages } from "@/config/messages";
import { facts } from "@/lib/facts";
import { HowItWorks } from "./how-it-works";

test("the story shows six steps in the agreed order with an inline screen each, in both languages", () => {
  for (const locale of ["en", "hi"] as const) {
    const t = messages[locale];
    const html = renderToStaticMarkup(<HowItWorks locale={locale} />);
    const titles = [
      t.howItWorks.upload.title,
      t.story.moveFirst.title,
      t.howItWorks.understand.title,
      t.story.findings.title,
      t.story.alert.title,
      t.howItWorks.track.title,
    ];
    const positions = titles.map((title) => html.indexOf(`>${title}</h3>`));
    expect(positions.every((position) => position > 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(html.match(/data-story-step=/g)).toHaveLength(6);
    for (const screen of ["upload", "move-first", "marker", "findings", "alert", "trends"]) {
      expect(html).toContain(`/screens/${screen}-light.webp`);
    }
    expect(html).toContain(`alt="${t.howItWorks.upload.alt(facts.maxFiles)}"`);
    expect(html).toContain(`alt="${t.story.alert.alt}"`);
    expect(html).toContain(t.story.body);
    expect(html).toContain(`<p class="sr-only hidden js:lg:block">${t.story.alert.alt}</p>`);
  }
});

test("the server renders step 0 and one sticky phone with six decorative screens hidden from assistive technology", () => {
  const html = renderToStaticMarkup(<HowItWorks locale="en" />);
  expect(html).toContain('data-step="0"');
  expect(html.match(/data-screen=/g)).toHaveLength(6);
  expect(html.match(/<div aria-hidden="true"/g)).toHaveLength(1);
  expect(html.match(/alt=""/g)).toHaveLength(6);
  expect(html).toContain('id="how-it-works"');
});

test("the story title does not count the steps", () => {
  expect(messages.en.howItWorks.title).not.toMatch(/three|3/i);
  expect(messages.hi.howItWorks.title).not.toMatch(/तीन|3/);
});

test("the steps pin beside the phone only when JavaScript runs on a large screen", () => {
  const html = renderToStaticMarkup(<HowItWorks locale="en" />);
  expect(html).toMatch(/class="story js:lg:grid js:lg:grid-cols-2/);
  expect(html.match(/mx-auto mt-8 max-w-\[260px\] js:lg:hidden"/g)).toHaveLength(6);
  expect(html).toContain('class="hidden js:lg:order-first js:lg:block"');
});

test("the pinned phone stays inside the window: tall steps, half a window of space at each end, a sticky column under the nav", () => {
  const html = renderToStaticMarkup(<HowItWorks locale="en" />);
  expect(html).toContain('class="js:lg:pt-[calc(50vh-3.5rem)] js:lg:pb-[50vh]"');
  expect(html.match(/js:lg:min-h-\[75vh\]/g)).toHaveLength(6);
  expect(html).toContain(
    'class="sticky top-14 flex h-[calc(100vh-3.5rem)] items-center justify-center"',
  );
});
