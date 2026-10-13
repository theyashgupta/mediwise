import { describe, expect, test } from "vitest";
import { dateRange, ruleTitle } from "./reports.title.js";

const none = { markerCount: 0, markerDate: null, studies: [], uploadDate: "2025-03-01" };

describe("ruleTitle", () => {
  test("a one-day blood panel reads the day and the marker count", () => {
    expect(ruleTitle({ ...none, markerCount: 46, markerDate: "2025-02-01" })).toBe(
      "1 Feb 2025 · blood panel (46 markers)",
    );
  });

  test("a single marker reads in the singular", () => {
    expect(ruleTitle({ ...none, markerCount: 1, markerDate: "2025-02-01" })).toBe(
      "1 Feb 2025 · blood panel (1 marker)",
    );
  });

  test("a report of studies only lists each study type once, with a count when repeated", () => {
    const title = ruleTitle({
      ...none,
      studies: [
        { kind: "xray", performedAt: "2025-02-01" },
        { kind: "ultrasound", performedAt: "2025-02-01" },
        { kind: "ecg", performedAt: "2025-02-01" },
        { kind: "ultrasound", performedAt: "2025-02-01" },
      ],
    });
    expect(title).toBe("1 Feb 2025 · ultrasound x2, ECG, X-ray");
  });

  test("a blood panel with studies on other days reads the date range and no lab", () => {
    const title = ruleTitle({
      markerCount: 46,
      markerDate: "2025-02-01",
      studies: [
        { kind: "ultrasound", performedAt: "2025-02-01" },
        { kind: "ultrasound", performedAt: "2025-02-11" },
      ],
      uploadDate: "2025-03-01",
    });
    expect(title).toBe("1 to 11 Feb 2025 · blood panel (46 markers), ultrasound x2");
  });

  test("a study without a printed date takes the date of the blood panel", () => {
    const title = ruleTitle({
      markerCount: 3,
      markerDate: "2025-02-01",
      studies: [{ kind: "ecg", performedAt: null }],
      uploadDate: "2025-03-01",
    });
    expect(title).toBe("1 Feb 2025 · blood panel (3 markers), ECG");
  });

  test("a report with nothing dated reads the upload date only", () => {
    expect(ruleTitle(none)).toBe("1 Mar 2025");
  });

  test("a long title drops the marker count, then gives the last study types as a count", () => {
    const studies = (["ultrasound", "ecg", "xray", "ct", "mri", "pathology"] as const).map(
      (kind) => ({ kind, performedAt: "2025-02-11" }),
    );
    const short = ruleTitle({
      ...none,
      markerCount: 46,
      markerDate: "2025-02-01",
      studies: studies.slice(0, 3),
    });
    expect(short).toBe("1 to 11 Feb 2025 · blood panel, ultrasound, ECG, X-ray");
    const long = ruleTitle({ ...none, markerCount: 46, markerDate: "2025-02-01", studies });
    expect(long.length).toBeLessThanOrEqual(60);
    expect(long).toBe("1 to 11 Feb 2025 · blood panel, ultrasound, ECG, and 4 more");
  });
});

describe("dateRange", () => {
  test("a range across months names both months", () => {
    expect(dateRange("2025-01-28", "2025-02-03")).toBe("28 Jan to 3 Feb 2025");
  });

  test("a range across years names both years", () => {
    expect(dateRange("2024-12-30", "2025-01-02")).toBe("30 Dec 2024 to 2 Jan 2025");
  });
});
