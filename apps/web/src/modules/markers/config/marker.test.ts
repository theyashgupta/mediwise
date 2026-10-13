import { expect, test } from "vitest";
import { formatDelta, statusSentence } from "./marker";

test("each status gets one sentence, with the side taken from the deviation", () => {
  expect(statusSentence("LDL", "optimal", 0, true)).toBe(
    "Your LDL is in the optimal range for your profile.",
  );
  expect(statusSentence("LDL", "watch", 0.2, true)).toMatch(/above the optimal range/);
  expect(statusSentence("Vitamin D", "risk", -0.5, true)).toMatch(/below the watch range/);
  expect(statusSentence("Vitamin D", "risk", -0.5, false)).toMatch(/below the lab range/);
  expect(statusSentence("Vitamin D", "risk", -0.5, false)).toMatch(
    /Speak with a doctor about this value\./,
  );
  expect(statusSentence("X", "unknown", null, false)).toMatch(/did not score/);
});

test("a delta carries its sign and the marker precision", () => {
  expect(formatDelta(140, 120, 0)).toBe("+20");
  expect(formatDelta(12.04, 13.5, 1)).toBe("−1.5");
  expect(formatDelta(5, 5, 1)).toBe("No change");
});
