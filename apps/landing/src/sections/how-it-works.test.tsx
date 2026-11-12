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
    for (const screen of ["upload", "move-first", "marker", "findings", "alert", "trends"]) {
      expect(html).toContain(`/screens/${screen}-light.webp`);
    }
    expect(html).toContain(`alt="${t.howItWorks.upload.alt(facts.maxFiles)}"`);
    expect(html).toContain(`alt="${t.story.alert.alt}"`);
    expect(html).toContain(t.story.body);
  }
});

test("the story title does not count the steps", () => {
  expect(messages.en.howItWorks.title).not.toMatch(/three|3/i);
  expect(messages.hi.howItWorks.title).not.toMatch(/तीन|3/);
});

test("each step is one revealed row with its own screen, sides alternating from 1024 px, and nothing pins", () => {
  const html = renderToStaticMarkup(<HowItWorks locale="en" />);
  expect(
    html.match(/<li data-reveal="" class="lg:grid lg:grid-cols-2 lg:items-center/g),
  ).toHaveLength(6);
  expect(html.match(/class="lg:order-last"/g)).toHaveLength(3);
  expect(html).not.toMatch(/sticky|data-step|data-screen|aria-hidden/);
  expect(html.match(/max-w-\[260px\] lg:mt-0 lg:max-w-\[300px\]/g)).toHaveLength(6);
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
