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
