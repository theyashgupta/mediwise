import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const headers = read("../../public/_headers");
const csp = headers.match(/Content-Security-Policy: (.+)/)?.[1] ?? "";

test("the CSP allows each inline script of index.html by its hash", () => {
  const inline = [...read("../../index.html").matchAll(/<script>([\s\S]*?)<\/script>/g)];
  expect(inline.length).toBeGreaterThan(0);
  for (const [, body] of inline) {
    const hash = createHash("sha256")
      .update(body ?? "")
      .digest("base64");
    expect(csp).toContain(`'sha256-${hash}'`);
  }
});

test("the CSP loads no font from Google and blocks framing", () => {
  expect(csp).not.toMatch(/googleapis|gstatic/);
  expect(csp).toContain("font-src 'self'");
  expect(csp).toContain("frame-ancestors 'none'");
});
