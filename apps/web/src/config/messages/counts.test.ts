import { expect, test } from "vitest";
import { messages } from ".";

test("a count of one file or one marker reads in the singular", () => {
  expect(messages.en.dashboard.recent.files(1)).toBe("1 file");
  expect(messages.en.dashboard.recent.files(3)).toBe("3 files");
  expect(messages.en.report.markerCount(1)).toBe("1 marker");
  expect(messages.en.report.markerCount(81)).toBe("81 markers");
  expect(messages.hi.dashboard.recent.files(1)).toBe("1 फ़ाइल");
  expect(messages.hi.dashboard.recent.files(3)).toBe("3 फ़ाइलें");
});

test("a count of a thousand or more reads with the locale separator", () => {
  expect(messages.en.credits.left(1284)).toBe("1,284 reports left");
  expect(messages.hi.credits.left(1284)).toBe("1,284 रिपोर्ट बाकी");
  expect(messages.en.assistant.left(1284)).toBe("1,284 questions left");
  expect(messages.en.dashboard.recent.files(1284)).toBe("1,284 files");
  expect(messages.en.report.markerCount(1284)).toBe("1,284 markers");
  expect(messages.en.yearReview.card.moved(1284)).toBe("1,284 markers moved");
  expect(messages.hi.yearReview.card.stillAtRisk(1284)).toBe("1,284 अब भी जोखिम में");
  expect(messages.en.trends.summary.improved(123640)).toBe("1,23,640 improved");
});
