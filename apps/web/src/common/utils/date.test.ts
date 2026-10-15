import { afterEach, expect, test, vi } from "vitest";
import { formatPlainDate } from "./date";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("a plain date keeps its day whatever the local time zone", () => {
  vi.stubGlobal("navigator", { language: "en-GB" });
  expect(formatPlainDate("2026-03-12", { day: "numeric", month: "short" })).toBe("12 Mar");
});

test("a plain date follows the order of the browser's English variant", () => {
  vi.stubGlobal("navigator", { language: "en-US" });
  expect(formatPlainDate("2026-03-12", { day: "numeric", month: "short" })).toBe("Mar 12");
});
