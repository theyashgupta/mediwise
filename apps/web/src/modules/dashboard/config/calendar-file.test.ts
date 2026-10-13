import { expect, test } from "vitest";
import { buildRetestCalendarFile, isPastDue } from "./calendar-file";

const event = {
  profile: { id: "p-1", name: "Arjun Mehta" },
  marker: { markerKey: "hba1c", name: "HbA1c", dueOn: "2026-01-31" },
  reportDate: "2025-02-01",
};
const now = new Date("2026-10-13T08:30:05.123Z");

test("the file is one all-day event on the due date with CRLF lines", () => {
  const file = buildRetestCalendarFile(event, now);
  expect(file.endsWith("\r\n")).toBe(true);
  expect(file.replace(/\r\n/g, "")).not.toMatch(/\n|\r/);
  expect(file.split("\r\n")).toEqual(
    expect.arrayContaining([
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:retest-hba1c-20260131-p-1@mediwise",
      "DTSTAMP:20261013T083005Z",
      "DTSTART;VALUE=DATE:20260131",
      "DTEND;VALUE=DATE:20260201",
      "SUMMARY:Retest HbA1c for Arjun Mehta",
      "END:VEVENT",
      "END:VCALENDAR",
    ]),
  );
});

test("the description suggests the date and folds at 75 octets", () => {
  const lines = buildRetestCalendarFile(event, now).split("\r\n");
  expect(lines.every((line) => new TextEncoder().encode(line).length <= 75)).toBe(true);
  const unfolded = lines.join("\r\n").replace(/\r\n /g, "");
  expect(unfolded).toContain(
    "DESCRIPTION:MediWise suggests this date from your report of 1 Feb 2025. Ask your doctor before you book a retest.",
  );
});

test("backslashes, commas, semicolons and multi-byte names are escaped and folded whole", () => {
  const name = "अर्जुन मेहता, Jr; A\\B ".repeat(3);
  const lines = buildRetestCalendarFile({ ...event, profile: { id: "p-1", name } }, now).split(
    "\r\n",
  );
  expect(lines.every((line) => new TextEncoder().encode(line).length <= 75)).toBe(true);
  const unfolded = lines.join("\r\n").replace(/\r\n /g, "");
  expect(unfolded).toContain(`SUMMARY:Retest HbA1c for ${name.replace(/[\\,;]/g, "\\$&")}`);
});

test("a due date before today is past, today and later are not", () => {
  const today = new Date(2026, 0, 31);
  expect(isPastDue("2026-01-30", today)).toBe(true);
  expect(isPastDue("2026-01-31", today)).toBe(false);
  expect(isPastDue("2026-02-01", today)).toBe(false);
});
