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

test("the story has no scroll timeline rules and skips rendering offscreen", () => {
  expect(css).not.toMatch(/view-timeline|timeline-scope/);
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

test("each story step index shows only its own screen", () => {
  for (let step = 0; step < 6; step++) {
    expect(css).toContain(`.story[data-step="${step}"] [data-screen="${step}"]`);
  }
  expect(css).toMatch(/\.story-screen \{\s*opacity: 0;\s*transition: opacity/);
});

test("the pinned layout variant needs the JavaScript flag from the head script", () => {
  expect(css).toContain("@custom-variant js (&:where([data-js] *));");
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

test("the story phone height has a cap below the window height and the desktop size estimate follows the step layout", () => {
  expect(css).toMatch(
    /\.story-phone \{\s*width: min\(300px, calc\(\(100vh - 8rem\) \* 433 \/ 882\)\);/,
  );
  expect(css).toContain("contain-intrinsic-size: auto calc(550vh + 180px);");
});
