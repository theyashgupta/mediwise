import { expect, test } from "vitest";
import { formatPlainDate } from "./date";

test("a plain date keeps its day whatever the local time zone", () => {
  expect(formatPlainDate("2026-03-12", { day: "numeric", month: "short" })).toBe("12 Mar");
});
