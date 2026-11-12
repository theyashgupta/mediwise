import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

const css = readFileSync(join(import.meta.dirname, "globals.css"), "utf8");

/**
 * Returns the body of every keyframes block in the stylesheet, by name.
 */
function keyframes() {
  return Object.fromEntries(
    [...css.matchAll(/@keyframes ([\w-]+) \{([\s\S]*?)\n\}/g)].map((match) => [
      match[1],
      match[2] ?? "",
    ]),
  );
}

test("no keyframe animates a filter or a background position", () => {
  const bodies = Object.values(keyframes());
  expect(bodies.length).toBeGreaterThan(0);
  expect(bodies.join("\n")).not.toMatch(/filter|background-position/);
});

test("reveals use the observer, never a view() timeline", () => {
  expect(css).not.toMatch(/animation-timeline:\s*view\(\);/);
  expect(css).toMatch(/\[data-reveal="hidden"\]\s*\{\s*opacity: 0;\s*transform: translateY/);
});

test("paused motion, reduced motion and print show every hidden reveal", () => {
  expect(css).toMatch(/:root\[data-motion="paused"\] \[data-reveal="hidden"\] \{\s*opacity: 1;/);
  const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
  expect(reduced).toMatch(/\[data-reveal="hidden"\] \{\s*opacity: 1;/);
  expect(css).toMatch(/@media print \{\s*\[data-reveal="hidden"\] \{\s*opacity: 1;/);
});

test("the story has no pin or scroll timeline rules and skips rendering offscreen", () => {
  expect(css).not.toMatch(/view-timeline|timeline-scope|sticky/);
  expect(css).toMatch(
    /\.story-section \{\s*content-visibility: auto;\s*contain-intrinsic-size: auto \d+px/,
  );
});

test("only the hero blobs promise a long-running transform layer", () => {
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const owners = [...bare.matchAll(/([^{}]+)\{[^}]*will-change/g)].map((match) => match[1]?.trim());
  expect(owners).toEqual([".hero-blob"]);
});

test("the hero drift moves transform only and the line draw moves the dash offset only", () => {
  const bodies = keyframes();
  for (const name of ["drift-a", "drift-b", "drift-c"]) {
    expect(bodies[name]?.match(/[\w-]+(?=:)/g)).toEqual(["transform"]);
  }
  expect(bodies.draw?.match(/[\w-]+(?=:)/g)).toEqual(["stroke-dashoffset"]);
});

test("the hero drift pauses offscreen and on a hidden tab", () => {
  expect(css).toMatch(
    /#top\[data-offscreen="true"\] \.hero-blob,\s*:root\[data-tab="hidden"\] \.hero-blob \{\s*animation-play-state: paused;/,
  );
});

test("paused motion and reduced motion stop every animation and transition", () => {
  expect(css).toMatch(
    /:root\[data-motion="paused"\] :not\(\.marquee-track\),[\s\S]*?\{\s*animation: none !important;\s*transition: none !important;/,
  );
  const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
  expect(reduced).toMatch(
    /\*,\s*::before,\s*::after \{\s*animation: none !important;\s*transition: none !important;/,
  );
});

test("the feature vignettes move transform and opacity only", () => {
  const bodies = keyframes();
  for (const name of ["vignette-in", "vignette-swing"]) {
    const properties = new Set(bodies[name]?.match(/[\w-]+(?=:)/g));
    expect(properties.size).toBeGreaterThan(0);
    expect([...properties].filter((p) => p !== "opacity" && p !== "transform")).toEqual([]);
  }
});

test("the story phone turns on the Y axis only and the screen swaps at the half-way point", () => {
  const bodies = keyframes();
  for (const name of ["turn-a", "turn-b"]) {
    expect(bodies[name]?.match(/[\w-]+(?=:)/g)).toEqual(["transform", "transform"]);
    expect(bodies[name]).toMatch(/50% \{\s*transform: rotateY\(90deg\);/);
  }
  expect(css).toMatch(/\.story-phone\[data-turn="0"\] \{\s*animation: turn-a 700ms/);
  expect(css).toMatch(/\.story-phone\[data-turn="1"\] \{\s*animation: turn-b 700ms/);
  expect(css).toMatch(/\.story-screen \{\s*transition: opacity 0s 350ms;/);
});

test("the phone frame is drawn in CSS with no image", () => {
  const frame = css.slice(css.indexOf(".phone {"), css.indexOf(".phone-island"));
  expect(frame).toMatch(/linear-gradient/);
  expect(frame).not.toMatch(/url\(/);
});
