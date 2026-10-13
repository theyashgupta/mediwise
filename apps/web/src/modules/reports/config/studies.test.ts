import { expect, test } from "vitest";
import { printedLines, studyTitle } from "./studies";

test("a study title names the kind and the printed body region when there is one", () => {
  expect(studyTitle({ kind: "xray", bodyRegion: "Chest PA" })).toBe("X-ray, Chest PA");
  expect(studyTitle({ kind: "ecg", bodyRegion: null })).toBe("ECG");
  expect(studyTitle({ kind: "pathology", bodyRegion: null })).toBe("Pathology report");
  expect(studyTitle({ kind: "ecg", bodyRegion: "Resting ECG" })).toBe("Resting ECG");
  expect(studyTitle({ kind: "xray", bodyRegion: "X-RAY CHEST PA" })).toBe("X-RAY CHEST PA");
});

test("printed text splits into trimmed lines with blank lines dropped", () => {
  expect(printedLines("Sinus rhythm\n\n  Otherwise normal ECG ")).toEqual([
    "Sinus rhythm",
    "Otherwise normal ECG",
  ]);
  expect(printedLines(null)).toEqual([]);
});
