import { describe, expect, test } from "vitest";
import fixture from "../fixtures/dense-history.json";
import { type AttentionVisit, buildAttention } from "./attention.js";
import { runEngine } from "./index.js";
import type { EngineProfile, EngineValue, VisitMarker } from "./types.js";

const profile = fixture.profile as EngineProfile;
const dense: AttentionVisit[] = fixture.reports.map(({ collectedAt, values }, index) => ({
  reportId: `report-${index}`,
  date: collectedAt,
  markers: runEngine({ profile, values: values as EngineValue[] }).markers.map((result) => ({
    markerKey: result.markerKey,
    value: typeof result.value === "number" ? result.value : null,
    valueText: typeof result.value === "number" ? null : result.value,
    unit: result.unit,
    status: result.status === "unknown" ? null : result.status,
    calibratedLow: result.calibrated?.optimalLow ?? null,
    calibratedHigh: result.calibrated?.optimalHigh ?? null,
  })),
}));

function row(
  markerKey: string,
  value: number,
  status: VisitMarker["status"],
  [calibratedLow, calibratedHigh]: [number | null, number | null] = [10, 20],
  unit = "x",
): VisitMarker {
  return { markerKey, value, valueText: null, unit, status, calibratedLow, calibratedHigh };
}

function visit(reportId: string, date: string, markers: VisitMarker[]): AttentionVisit {
  return { reportId, date, markers };
}

describe("buildAttention on the dense history", () => {
  const attention = buildAttention(dense);
  const keys = attention.flatMap((item) => (item.kind === "marker" ? [item.markerKey] : []));

  test("each marker comes once, and HbA1c at watch on the full panel drops out when the last report has it optimal", () => {
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).not.toContain("hba1c");
  });

  test("a TSH-only report after the history puts a worsening TSH in the worsening group", () => {
    const tshOnly = visit("tsh-only", "2026-10-20", [
      row("tsh", 4.6, "watch", [0.45, 4.12], "µIU/mL"),
    ]);
    expect(
      buildAttention([...dense, tshOnly]).find(
        (item) => item.kind === "marker" && item.markerKey === "tsh",
      ),
    ).toMatchObject({
      group: "worsening",
      reportId: "tsh-only",
      previous: { reportId: "report-6", date: "2026-09-15", value: 4.1 },
    });
  });

  test("vitamin B12 at risk on the second full panel is listed, though narrow reports came after it", () => {
    expect(
      attention.find((item) => item.kind === "marker" && item.markerKey === "vitamin_b12"),
    ).toMatchObject({ group: "risk", reportId: "report-6", date: "2026-09-15", value: 186 });
  });

  test("risk comes first, then worsening, then watch", () => {
    const groups = attention.map(({ group }) => group);
    expect(groups).toEqual(groups.toSorted((a, b) => order(a) - order(b)));
    expect(groups).toContain("risk");
  });
});

function order(group: string) {
  return ["risk", "worsening", "watch"].indexOf(group);
}

describe("buildAttention on two reports", () => {
  const older = visit("older", "2026-08-04", [
    row("vitamin_b12", 450, "optimal", [300, null]),
    row("tsh", 4.6, "watch", [0.45, 4.12]),
    row("vitamin_d", 4, "risk"),
    row("ldl", 12, "optimal"),
  ]);
  const latest = visit("latest", "2026-09-15", [
    row("vitamin_b12", 280, "watch", [300, null]),
    row("tsh", 5.8, "watch", [0.45, 4.12]),
    row("ldl", 15, "optimal"),
    row("ferritin", 22, "watch"),
    row("hba1c", 40, "risk"),
  ]);

  test("a worsening watch marker comes before a stable watch marker, and an older risk marker is kept", () => {
    expect(buildAttention([older, latest]).map((item) => [item.group, item.reportId])).toEqual([
      ["risk", "latest"],
      ["risk", "older"],
      ["worsening", "latest"],
      ["worsening", "latest"],
      ["watch", "latest"],
    ]);
  });

  test("a worsening row names the previous value and its date", () => {
    const b12 = buildAttention([older, latest]).find(
      (item) => item.kind === "marker" && item.markerKey === "vitamin_b12",
    );
    expect(b12).toMatchObject({
      status: "watch",
      direction: "worsening",
      precision: 0,
      previous: { reportId: "older", date: "2026-08-04", value: 450 },
    });
  });

  test("an optimal marker that moves inside its range is not listed", () => {
    const keys = buildAttention([older, latest]).map(
      (item) => item.kind === "marker" && item.markerKey,
    );
    expect(keys).not.toContain("ldl");
  });

  test("an improving watch marker stays in the watch group", () => {
    const better = visit("better", "2026-10-01", [row("tsh", 4.3, "watch", [0.45, 4.12])]);
    expect(
      buildAttention([older, latest, better]).find((item) => item.reportId === "better"),
    ).toMatchObject({ group: "watch", direction: "improving", previous: { value: 5.8 } });
  });

  test("a later report of the same date replaces the value, and a value in another unit is not compared", () => {
    const sameDay = visit("same-day", "2026-09-15", [row("ferritin", 18, "optimal")]);
    const otherUnit = visit("other-unit", "2026-10-01", [
      row("tsh", 9, "watch", [0.45, 4.12], "mIU/L"),
    ]);
    const items = buildAttention([older, latest, sameDay, otherUnit]);
    expect(items.some((item) => item.kind === "marker" && item.markerKey === "ferritin")).toBe(
      false,
    );
    expect(items.find((item) => item.reportId === "other-unit")).toMatchObject({ previous: null });
  });
});

describe("buildAttention with study alerts", () => {
  const line = 'Your ultrasound report says: "Grade II fatty liver."';

  test("an open alert leads the risk group", () => {
    const items = buildAttention(
      [visit("r", "2026-09-01", [row("hba1c", 40, "risk")])],
      [{ reportId: "r", date: "2026-09-01", title: line }],
    );
    expect(items.map((item) => item.kind)).toEqual(["alert", "marker"]);
  });

  test("a settled alert is not listed", () => {
    const items = buildAttention(
      [],
      [
        {
          reportId: "a",
          date: "2026-08-01",
          title: line,
          settlement: { state: "settled", reportId: "b" },
        },
      ],
    );
    expect(items).toEqual([]);
  });

  test("a confirmed alert is listed once, from the report that prints it again", () => {
    const items = buildAttention(
      [],
      [
        {
          reportId: "a",
          date: "2026-08-01",
          title: line,
          settlement: { state: "confirmed", reportId: "b" },
        },
        {
          reportId: "b",
          date: "2026-09-01",
          title: 'Your ultrasound report says: "Grade II fatty changes."',
        },
      ],
    );
    expect(items.map(({ reportId }) => reportId)).toEqual(["b"]);
  });

  test("the same line in two reports is listed once, from the newer report", () => {
    const items = buildAttention(
      [],
      [
        { reportId: "a", date: "2026-08-01", title: line },
        { reportId: "b", date: "2026-09-01", title: line },
      ],
    );
    expect(items.map(({ reportId }) => reportId)).toEqual(["b"]);
  });
});
