import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { messages } from "@/config/messages";
import { facts } from "@/lib/facts";
import { HowItWorks } from "./how-it-works";

const screens = ["upload", "move-first", "marker", "findings", "alert", "trends"];

test("the stepper lists six numbered steps in the agreed order with a screen each, in both languages", () => {
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
    const positions = titles.map((title) => html.indexOf(`>${title}</span>`));
    expect(positions.every((position) => position > 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    for (const [index, screen] of screens.entries()) {
      expect(html).toContain(`>${t.howItWorks.step(index + 1)}</span>`);
      expect(html).toContain(`/screens/${screen}-light.webp`);
    }
    expect(html).toContain(`alt="${t.howItWorks.upload.alt(facts.maxFiles)}"`);
    expect(html).toContain(`alt="${t.story.alert.alt}"`);
    expect(html.match(/<button type="button"/g)).toHaveLength(6);
  }
});

test("every step body is one short line in both languages", () => {
  for (const t of [messages.en, messages.hi]) {
    const bodies = [
      t.howItWorks.upload.body(facts.maxFiles),
      t.story.moveFirst.body,
      t.howItWorks.understand.body,
      t.story.findings.body,
      t.story.alert.body,
      t.howItWorks.track.body,
    ];
    for (const body of bodies) expect(body.length).toBeLessThanOrEqual(100);
  }
});

test("the story title does not count the steps", () => {
  expect(messages.en.howItWorks.title).not.toMatch(/three|3|six|6/i);
  expect(messages.hi.howItWorks.title).not.toMatch(/तीन|छह|3|6/);
});

test("without JavaScript step 1 is active, its screen is the only one shown and nothing moves", () => {
  const html = renderToStaticMarkup(<HowItWorks locale="en" />);
  expect(html.match(/aria-current="step"/g)).toHaveLength(1);
  expect(html.indexOf('aria-current="step"')).toBeLessThan(
    html.indexOf(`>${messages.en.howItWorks.upload.title}</span>`),
  );
  const images = [...html.matchAll(/<img [^>]*>/g)].map((match) => match[0]);
  expect(images.map((image) => image.includes("opacity-0"))).toEqual([
    false,
    true,
    true,
    true,
    true,
    true,
  ]);
  expect(html).not.toMatch(/data-turn|grow-x|sticky/);
});

test("the first screen loads at once and the other five load lazily, each with its alt text", () => {
  const html = renderToStaticMarkup(<HowItWorks locale="en" />);
  const images = [...html.matchAll(/<img [^>]*>/g)].map((match) => match[0]);
  expect(images).toHaveLength(6);
  expect(images.map((image) => /loading="(\w+)"/.exec(image)?.[1])).toEqual([
    "eager",
    "lazy",
    "lazy",
    "lazy",
    "lazy",
    "lazy",
  ]);
  expect(images.every((image) => /alt="[^"]+"/.test(image))).toBe(true);
  expect(html).not.toContain('fetchPriority="high"');
});
