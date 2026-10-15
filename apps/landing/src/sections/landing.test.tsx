import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { messages } from "@/config/messages";
import { Landing } from "./landing";

const src = join(import.meta.dirname, "..");

/**
 * Reads every non-test source file under apps/landing/src.
 */
function sources(dir = src): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sources(path);
    return /\.tsx?$/.test(entry.name) && !/\.test\./.test(entry.name)
      ? [readFileSync(path, "utf8")]
      : [];
  });
}

test("no landing source listens for scroll or resize", () => {
  const code = sources().join("\n");
  expect(code).not.toMatch(/["'](scroll|resize)["']|onscroll|onresize/i);
});

test("no landing source reads layout, so no observer callback can force one", () => {
  const code = sources().join("\n");
  expect(code).not.toMatch(
    /getBoundingClientRect|getComputedStyle|offset(Top|Left|Width|Height)|scroll(Top|Y)\b/,
  );
});

/**
 * Renders a component and turns the HTML entities React writes back into plain text.
 */
function render(node: React.ReactElement) {
  return renderToStaticMarkup(node)
    .replaceAll("&#x27;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&");
}

/**
 * Lists every plain string leaf of a message tree with its path.
 */
function strings(tree: object, prefix = ""): [string, string][] {
  return Object.entries(tree).flatMap(([key, value]: [string, unknown]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") return [[path, value]];
    if (value && typeof value === "object") return strings(value, path);
    return [];
  });
}

const moved = ["hero", "howItWorks", "story", "history", "comparison", "bento", "numbers", "trust"];

test("every plain string of the content sections renders on the landing, in both languages", () => {
  for (const locale of ["en", "hi"] as const) {
    const html = render(<Landing locale={locale} />);
    const missing = moved
      .flatMap((name) => strings(messages[locale][name as keyof typeof messages.en], name))
      .filter(([, text]) => !html.includes(text))
      .map(([path]) => path);
    expect(missing).toEqual([]);
  }
});

test("the landing shows the sections in the map order", () => {
  const html = render(<Landing locale="en" />);
  const ids = [
    'id="hero-title"',
    'id="how-title"',
    'id="numbers-title"',
    'id="compare-title"',
    'id="features-title"',
    'id="markers-title"',
    'id="trust-title"',
    'id="pricing-title"',
    'id="faq-title"',
    'id="cta-title"',
  ].map((id) => html.indexOf(id));
  expect(ids.every((position) => position > 0)).toBe(true);
  expect(ids).toEqual([...ids].sort((a, b) => a - b));
});

test("the testimonials note stays in the landing source", () => {
  const source = readFileSync(join(import.meta.dirname, "landing.tsx"), "utf8");
  expect(source).toContain("Do not write invented ones.");
});
