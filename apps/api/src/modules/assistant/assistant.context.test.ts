import { describe, expect, test } from "vitest";
import repeat from "@mediwise/engine/fixtures/repeat-study.json" with { type: "json" };
import {
  buildContext,
  day,
  estimateTokens,
  maxContextTokens,
  type Snapshot,
  type SnapshotMarker,
} from "./assistant.context.js";

const earlierId = "a0000000-0000-4000-8000-000000000001";
const laterId = repeat.later.reportId;
const yearlyId = "a0000000-0000-4000-8000-000000000003";
const episodeId = "e0000000-0000-4000-8000-000000000001";
const [earlierStudy] = repeat.earlier.studies;
const [laterStudy] = repeat.later.studies;

function marker(
  reportId: string,
  markerKey: string,
  value: number,
  status: SnapshotMarker["status"],
) {
  return {
    reportId,
    markerKey,
    rawName: markerKey,
    value,
    valueText: null,
    unit: markerKey === "tsh" ? "µIU/mL" : "%",
    labRangeLow: 4,
    labRangeHigh: 5.6,
    status,
    calibratedLow: 4,
    calibratedHigh: 5.6,
  };
}

function snapshot(): Snapshot {
  return {
    person: { ageYears: 38, sex: "female", ancestry: "south_asian" },
    reports: [
      {
        id: yearlyId,
        date: "2025-08-04",
        createdAt: new Date("2025-08-05T00:00:00Z"),
        labName: "Sunrise Diagnostics",
        score: 81,
        tier: "gold",
        coverage: 100,
        verdict: "Two markers need attention.",
        patterns: [
          {
            key: "prediabetes",
            name: "Prediabetes range",
            description: "HbA1c in the prediabetes range.",
            severity: "watch",
            whatItSuggests: "Your blood sugar may run higher than optimal.",
            whatToDo: "Ask your doctor about a retest.",
            askDoctor: [],
            sources: [],
            matched: [],
          },
        ],
        episodeId: null,
      },
      {
        id: laterId,
        date: repeat.later.date,
        createdAt: new Date("2025-03-25T00:00:00Z"),
        labName: repeat.later.labName,
        score: 70,
        tier: "silver",
        coverage: 20,
        verdict: "One marker is optimal.",
        patterns: [],
        episodeId,
      },
      {
        id: earlierId,
        date: repeat.earlier.date,
        createdAt: new Date("2025-02-11T00:00:00Z"),
        labName: repeat.earlier.labName,
        score: 60,
        tier: "bronze",
        coverage: 20,
        verdict: null,
        patterns: [],
        episodeId,
      },
    ],
    markers: [
      marker(earlierId, "tsh", 6.1, "risk"),
      marker(laterId, "tsh", 2.1, "optimal"),
      marker(earlierId, "hba1c", 5.9, "watch"),
      marker(yearlyId, "hba1c", 6.1, "watch"),
      { ...marker(yearlyId, "hba1c", 6.1, "watch"), markerKey: null, rawName: "Unmapped" },
    ],
    studies: [
      {
        ...earlierStudy!,
        reportId: earlierId,
        pageIndex: 0,
        performedAt: repeat.earlier.date,
        labName: repeat.earlier.labName,
        findingsText: "x".repeat(2_000),
        measurements: [],
      },
      {
        ...laterStudy!,
        reportId: laterId,
        pageIndex: 0,
        performedAt: repeat.later.date,
        labName: repeat.later.labName,
        findingsText: null,
        measurements: [],
      },
    ],
    findings: [
      {
        id: "f0000000-0000-4000-8000-000000000001",
        reportId: earlierId,
        kind: "study_alert",
        severity: "risk",
        title: "The ultrasound shows a mass",
        body: "Ask your doctor about it.",
        citedKeys: [],
        citedStudyIds: [earlierStudy!.id],
        rank: 1,
      },
      {
        id: "f0000000-0000-4000-8000-000000000002",
        reportId: yearlyId,
        kind: "risk",
        severity: "watch",
        title: "HbA1c is above optimal",
        body: "HbA1c was 6.1% in Aug 2025.",
        citedKeys: ["hba1c"],
        citedStudyIds: [],
        rank: 1,
      },
    ],
    followUps: [
      {
        id: "u0000000-0000-4000-8000-000000000001",
        reportId: yearlyId,
        kind: "retest",
        markerKey: "hba1c",
        title: "Retest HbA1c",
        why: "It is above optimal.",
        nextAction: "Retest in 3 months.",
        rank: 1,
      },
      {
        id: "u0000000-0000-4000-8000-000000000002",
        reportId: yearlyId,
        kind: "measure",
        markerKey: "apob",
        title: "Measure ApoB",
        why: "It was not measured.",
        nextAction: "Add it next time.",
        rank: 2,
      },
    ],
    links: [
      {
        id: "l0000000-0000-4000-8000-000000000001",
        earlierReportId: earlierId,
        laterReportId: laterId,
        kind: "repeat",
        state: "confirmed",
      },
    ],
    episodes: [
      { id: episodeId, startedOn: "2025-02-01", endedOn: null, summary: ["Two reports."] },
    ],
  };
}

describe("buildContext", () => {
  test("reports are numbered oldest first and every reference kind maps to its source", () => {
    const { text, refs } = buildContext(snapshot());
    expect(text).toContain("R1: 10 Feb 2025, Lakeview Imaging.");
    expect(text).toContain("R3: 4 Aug 2025, Sunrise Diagnostics. Score 81 (gold), coverage 100%.");
    expect(refs.get("R3:hba1c")?.cite).toEqual({
      kind: "value",
      reportId: yearlyId,
      target: "hba1c",
    });
    expect(refs.get("R1:S1")?.cite).toEqual({
      kind: "study",
      reportId: earlierId,
      target: earlierStudy!.id,
    });
    expect(refs.get("F1")?.cite.kind).toBe("finding");
    expect(refs.get("P:prediabetes")?.names).toEqual(["Prediabetes range"]);
    expect(refs.get("U:1")?.cite).toEqual({
      kind: "follow_up",
      reportId: yearlyId,
      target: "u0000000-0000-4000-8000-000000000001",
    });
    expect(refs.get("L1")?.cite).toEqual({ kind: "link", reportId: earlierId, target: laterId });
    expect(refs.get("E1")?.cite).toEqual({ kind: "episode", reportId: null, target: episodeId });
    expect(refs.get("C:hba1c")?.cite).toEqual({
      kind: "catalog",
      reportId: null,
      target: "hba1c",
    });
    expect([...refs.keys()].some((ref) => ref.includes("Unmapped"))).toBe(false);
  });

  test("the engine block shows the newest report on the broadest score scale", () => {
    const { text } = buildContext(snapshot());
    expect(text).toContain("MediWise summary of R3 (4 Aug 2025):");
    expect(text).toContain("Verdict: Two markers need attention.");
    expect(text).toContain("U:1 Retest HbA1c.");
    expect(text).toMatch(/Not measured in R3: [^\n]+\./);
  });

  test("the same data gives the same bytes in any input order", () => {
    const first = buildContext(snapshot()).text;
    const shuffled = snapshot();
    shuffled.reports.reverse();
    shuffled.markers.reverse();
    shuffled.studies.reverse();
    shuffled.findings.reverse();
    expect(buildContext(shuffled).text).toBe(first);
    expect(buildContext(snapshot()).text).toBe(first);
  });

  test("values sit oldest first under their key with the absolute change and no percent", () => {
    const { text, refs } = buildContext(snapshot());
    expect(text).toMatch(/R1:hba1c 5\.9 % watch[^\n]*\n {2}R3:hba1c 6\.1 % watch/);
    expect(text).toContain("Change between the last two values: +0.2 %.");
    expect(text).toContain("Change between the last two values: -4 µIU/mL.");
    expect(text).not.toMatch(/\d %\)|percent/i);
    expect(refs.get("R3:hba1c")?.fact).toContain("change between the last two values 0.2");
    expect(refs.get("R1:hba1c")?.fact).not.toContain("change between");
  });

  test("dates read as day, short month and year", () => {
    expect(day("2026-08-04")).toBe("4 Aug 2026");
    expect(day("2025-12-31")).toBe("31 Dec 2025");
  });

  test("study findings text stops at 1,500 characters and the impression is quoted as printed", () => {
    const { text, refs } = buildContext(snapshot());
    expect(text).toContain(`"${"x".repeat(1_500)}"`);
    expect(text).not.toContain("x".repeat(1_501));
    expect(refs.get("R1:S1")?.quotes).toContain(
      "A 4.2 x 3.1 cm complex mass in the right adnexa. Suggest clinical correlation.",
    );
  });

  test("a settled alert leaves the findings and shows both printed lines and both dates", () => {
    const { text, refs, settled } = buildContext(snapshot());
    expect(text).not.toContain("The ultrasound shows a mass");
    const ref = refs.get("L2");
    expect(ref?.fact).toContain("the report of 24 Mar 2025");
    expect(ref?.fact).toContain('Later line as printed: "No adnexal mass is seen."');
    expect(ref?.dates).toEqual(["2025-02-10", "2025-03-24"]);
    expect(settled).toHaveLength(1);
  });

  test("a profile with no read report says so", () => {
    const { text, refs } = buildContext({
      ...snapshot(),
      reports: [],
      markers: [],
      studies: [],
      findings: [],
      followUps: [],
      links: [],
      episodes: [],
    });
    expect(text).toContain("This person has no read reports yet.");
    expect(refs.size).toBe(0);
  });

  /** Builds a 7,200-value history over the token cap on purpose, about 0.4 s alone and over 5 s on a loaded 8 GB Mac. */
  test("over the cap, old optimal values go first, then study text, then old reports", () => {
    const reports = Array.from({ length: 60 }, (_, index) => ({
      id: `r-${String(index).padStart(3, "0")}`,
      date: new Date(Date.UTC(2020, 0, 1 + index * 30)).toISOString().slice(0, 10),
      createdAt: new Date(Date.UTC(2020, 0, 1 + index * 30)),
      labName: "Lab",
      score: null,
      tier: null,
      coverage: null,
      verdict: null,
      patterns: null,
      episodeId: null,
    }));
    const markers = reports.flatMap(({ id }, index) =>
      Array.from({ length: 120 }, (_, key) =>
        marker(id, `marker_${key}`, index, index < 40 ? "optimal" : "watch"),
      ),
    );
    const big: Snapshot = {
      ...snapshot(),
      reports,
      markers,
      studies: reports.map(({ id }) => ({
        id: `s-${id}`,
        reportId: id,
        pageIndex: 0,
        kind: "ultrasound",
        bodyRegion: "Abdomen",
        performedAt: null,
        labName: null,
        impression: "Normal study.",
        findingsText: "y".repeat(1_500),
        result: null,
        measurements: [],
      })),
      findings: [],
      followUps: [],
      links: [],
      episodes: [],
    };
    const { text, cuts } = buildContext(big);
    expect(estimateTokens(text)).toBeLessThanOrEqual(maxContextTokens);
    expect(cuts).toEqual([
      expect.stringMatching(/^Older optimal values: \d+\.$/),
      "Study findings text (the impression stays).",
      expect.stringMatching(/^Older reports not included: \d+\.$/),
    ]);
    expect(
      Number(/Older reports not included: (\d+)\./.exec(cuts[2]!)?.[1]),
    ).toBeGreaterThanOrEqual(12);
    expect(text).toContain(`Left out to keep this short: ${cuts.join(" ")}`);
    expect(text).not.toContain("R49:");
  }, 15_000);

  test("two rows of one marker in one report give one value, the scored one", () => {
    const duplicated = snapshot();
    duplicated.markers.push({
      ...marker(yearlyId, "hba1c", 15, null),
    });
    const { text, refs } = buildContext(duplicated);
    expect(text.match(/R3:hba1c /g)).toHaveLength(1);
    expect(refs.get("R3:hba1c")?.fact).toContain("R3:hba1c 6.1 % watch");
    expect(refs.get("R3:hba1c")?.numbers).not.toContain(15);
  });

  test("a value reference allows its value, ranges and signed change, never the digits of its reference", () => {
    const { refs } = buildContext(snapshot());
    expect(refs.get("R3:hba1c")?.numbers).toEqual([6.1, 4, 5.6, 4, 5.6, 0.2]);
    expect(refs.get("R2:tsh")?.numbers).toContain(-4);
    expect(refs.get("R3")?.numbers).toEqual([81, 100, 3]);
  });

  test("a scored report with no coverage allows the 100 the block prints", () => {
    const open = snapshot();
    open.reports[0]!.coverage = null;
    expect(buildContext(open).refs.get("R3")?.numbers).toEqual([81, 100, 3]);
  });
});
