import { afterEach, expect, test, vi } from "vitest";
import { formatCount, intlTag } from "./locales";

const date = new Date("2026-03-12T00:00:00Z");
const dateOptions: Intl.DateTimeFormatOptions = { dateStyle: "long", timeZone: "UTC" };

afterEach(() => {
  vi.unstubAllGlobals();
});

test("English on an en-US browser writes US dates and numbers", () => {
  vi.stubGlobal("navigator", { language: "en-US" });
  expect(intlTag("en")).toBe("en-US");
  expect(date.toLocaleDateString(intlTag("en"), dateOptions)).toBe("March 12, 2026");
  expect(formatCount("en", 123640)).toBe("123,640");
  expect((1234.5).toLocaleString(intlTag("en"))).toBe("1,234.5");
});

test("English on an en-GB browser writes British dates and numbers", () => {
  vi.stubGlobal("navigator", { language: "en-GB" });
  expect(intlTag("en")).toBe("en-GB");
  expect(date.toLocaleDateString(intlTag("en"), dateOptions)).toBe("12 March 2026");
  expect(formatCount("en", 123640)).toBe("123,640");
});

test("English on an en-IN browser keeps the Indian grouping", () => {
  vi.stubGlobal("navigator", { language: "en-IN" });
  expect(formatCount("en", 123640)).toBe("1,23,640");
});

test("English on a browser in another language falls back to en-US", () => {
  vi.stubGlobal("navigator", { language: "fr-FR" });
  expect(intlTag("en")).toBe("en-US");
  vi.stubGlobal("navigator", undefined);
  expect(intlTag("en")).toBe("en-US");
});

test("Hindi keeps Latin digits whatever the browser language", () => {
  vi.stubGlobal("navigator", { language: "en-US" });
  expect(intlTag("hi")).toBe("hi-IN-u-nu-latn");
  expect(formatCount("hi", 123640)).toBe("1,23,640");
});
