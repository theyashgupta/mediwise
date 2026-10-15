import { markers } from "@mediwise/engine";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { messages } from "@/config/messages";
import { heroMarkers } from "@/lib/facts";
import { Hero } from "./hero";

const html = renderToStaticMarkup(<Hero locale="en" />);

test("the hero motion layer is hidden from assistive technology", () => {
  expect(html.match(/<div aria-hidden="true" class="hero-motion /g)).toHaveLength(2);
});

test("the hero image, heading and paragraph carry no reveal and no animation class", () => {
  const content = html.slice(html.indexOf('<div class="mx-auto grid'), html.indexOf("<dl"));
  expect(content.replace(/<div aria-hidden="true" class="hero-motion[\s\S]*$/, "")).not.toMatch(
    /data-reveal|rise-in|hero-blob|hero-line/,
  );
  expect(content).toContain('fetchPriority="high"');
});

test("the trend line tags name catalog markers and show no values or dates", () => {
  const catalog = new Set(markers.map((marker) => marker.name));
  expect(heroMarkers).toEqual(["Vitamin B12", "LDL cholesterol", "Urine albumin"]);
  expect(heroMarkers.every((name) => catalog.has(name))).toBe(true);
  const motion = html.slice(
    html.lastIndexOf('<div aria-hidden="true" class="hero-motion'),
    html.indexOf("<dl"),
  );
  const text = motion
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  expect(text).toBe(heroMarkers.join(" "));
});

test("the hero copy renders unchanged in both languages", () => {
  for (const locale of ["en", "hi"] as const) {
    const t = messages[locale].hero;
    const page = renderToStaticMarkup(<Hero locale={locale} />);
    for (const text of [
      t.eyebrow,
      t.title,
      t.body,
      t.callouts.filesLabel,
      t.callouts.markersLabel,
    ]) {
      expect(page).toContain(text);
    }
  }
});
