import { describe, expect, test } from "vitest";
import fixture from "../fixtures/findings.json";
import { coreMarkerKeys, markers } from "./catalog/index.js";
import { buildFindings } from "./findings.js";
import type { PatternMatch, Visit, VisitMarker } from "./types.js";

const previous = fixture.previous as Visit;
const current = fixture.current as Visit;
const ultrasound = current.studies.find((study) => study.kind === "ultrasound")!;

function marker(
  markerKey: string,
  value: number,
  unit: string,
  status: VisitMarker["status"],
  [calibratedLow, calibratedHigh]: [number | null, number | null] = [null, null],
): VisitMarker {
  return { markerKey, value, valueText: null, unit, status, calibratedLow, calibratedHigh };
}

function visit(date: string, markers: VisitMarker[], labName = "Lakeview Lab"): Visit {
  return { date, labName, markers, studies: [] };
}

function statusOf(visitRows: Visit, key: string) {
  return visitRows.markers.find((row) => row.markerKey === key && row.status)?.status ?? null;
}

describe("buildFindings on the 2024 and 2025 visits", () => {
  const { findings } = buildFindings(current, previous, []);

  test("every core marker that moved status has a change finding", () => {
    const moved = coreMarkerKeys.filter((key) => {
      const [was, is] = [statusOf(previous, key), statusOf(current, key)];
      return was && is && was !== is;
    });
    const changed = findings
      .filter(({ kind }) => kind === "change")
      .flatMap(({ citedKeys }) => citedKeys);
    expect(moved.length).toBeGreaterThan(0);
    expect(changed).toEqual(expect.arrayContaining(moved));
  });

  test("TSH is compared after the unit conversion and states the lab change", () => {
    expect(findings.find(({ citedKeys }) => citedKeys[0] === "tsh")).toMatchObject({
      kind: "change",
      severity: "watch",
      direction: "worsening",
      title:
        "Thyroid stimulating hormone worsening: 5.55 µIU/mL in Mar 2024, 10.23 µIU/mL in Mar 2025",
      note: "Different labs measured these values, so the method may differ. Compare them with care.",
    });
  });

  test("the fatty liver on the ultrasound links with the liver and sugar markers of the visit", () => {
    expect(findings[0]).toMatchObject({
      kind: "link",
      title: "Fatty liver on the scan",
      citedKeys: ["alt", "ast", "triglycerides", "hba1c", "glucose_fasting"],
      citedStudyIds: [ultrasound.id],
    });
  });

  test("no finding cites a marker or a study that is not in either visit", () => {
    const keys = new Set([...previous.markers, ...current.markers].map((row) => row.markerKey));
    const studyIds = new Set(current.studies.map(({ id }) => id));
    for (const finding of findings) {
      expect(finding.citedKeys.length + finding.citedStudyIds.length).toBeGreaterThan(0);
      expect(finding.citedKeys.filter((key) => !keys.has(key))).toEqual([]);
      expect(finding.citedStudyIds.filter((id) => !studyIds.has(id))).toEqual([]);
    }
  });

  test("the same visits give the same findings", () => {
    expect(buildFindings(current, previous, [])).toEqual(buildFindings(current, previous, []));
  });

  test("findings are ranked by severity, then worsening before improving", () => {
    expect(findings.map(({ rank }) => rank)).toEqual(findings.map((_, index) => index));
    const changes = findings.filter(
      ({ kind, severity }) => kind === "change" && severity === "watch",
    );
    expect(changes.map(({ direction }) => direction)).toEqual([
      "worsening",
      "worsening",
      "improving",
      "improving",
      "improving",
    ]);
  });
});

describe("buildFindings rules", () => {
  test("a value in a unit the catalog cannot convert gives no change finding", () => {
    const { findings } = buildFindings(
      visit("2025-02-01", [marker("alt", 80, "mg/dL", null)]),
      visit("2024-01-13", [marker("alt", 23, "U/L", "optimal")]),
      [],
    );
    expect(findings.filter(({ kind }) => kind === "change")).toEqual([]);
  });

  test("a change between visits of the same lab has no method note", () => {
    const { findings } = buildFindings(
      visit(
        "2025-02-01",
        [marker("vitamin_d", 40, "ng/mL", "optimal", [30, 100])],
        "LAKEVIEW Lab (Test performed at X)",
      ),
      visit("2024-01-13", [marker("vitamin_d", 11, "ng/mL", "risk", [30, 100])], "Lakeview Lab"),
      [],
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      kind: "change",
      severity: "optimal",
      direction: "improving",
    });
    expect(findings[0]).not.toHaveProperty("note");
  });

  test("a value that stays optimal while it moves gives no change finding", () => {
    const { findings } = buildFindings(
      visit("2025-02-01", [marker("hba1c", 5.0, "%", "optimal")]),
      visit("2024-01-13", [marker("hba1c", 5.3, "%", "optimal")]),
      [],
    );
    expect(findings).toEqual([]);
  });

  test("a negated impression gives no link finding", () => {
    const current = {
      ...visit("2025-02-01", [marker("alt", 30, "U/L", "optimal")]),
      studies: [{ ...ultrasound, impression: "No fatty liver.\nNo renal calculus." }],
    };
    expect(buildFindings(current, undefined, []).findings).toEqual([]);
  });

  test("a kidney stone on the scan links with the kidney markers of the visit", () => {
    const current = {
      ...visit("2025-02-01", [marker("creatinine", 1.0, "mg/dL", "optimal")]),
      studies: [{ ...ultrasound, impression: "Right renal calculus of 5 mm." }],
    };
    expect(buildFindings(current, undefined, []).findings).toMatchObject([
      { kind: "study_alert" },
      { kind: "link", title: "Kidney stone on the scan", citedKeys: ["creatinine"] },
    ]);
  });

  test("without a previous visit, risk markers and optimal core markers still give findings", () => {
    const { findings } = buildFindings(
      visit("2025-02-01", [
        marker("ldl_cholesterol", 170, "mg/dL", "risk"),
        marker("hba1c", 5.0, "%", "optimal"),
        marker("hemoglobin", 15, "g/dL", "optimal"),
        marker("tsh", 2, "µIU/mL", "optimal"),
      ]),
      undefined,
      [],
    );
    expect(findings.map(({ kind, title }) => [kind, title])).toEqual([
      ["risk", "LDL cholesterol 170 mg/dL has risk status"],
      ["good_news", "3 core markers are optimal"],
    ]);
  });

  test("a core marker change past the 12th finding is still kept", () => {
    const risky = markers
      .filter((entry) => !entry.core && entry.category !== "vitals" && entry.unit !== "text")
      .slice(0, 12)
      .map((entry) => marker(entry.key, 1, entry.unit, "risk"));
    const { findings } = buildFindings(
      visit("2025-02-01", [
        ...risky,
        marker("hdl_cholesterol", 55, "mg/dL", "optimal", [50, null]),
      ]),
      visit("2024-01-13", [marker("hdl_cholesterol", 41, "mg/dL", "risk", [50, null])]),
      [],
    );
    expect(findings).toHaveLength(13);
    expect(findings.at(-1)).toMatchObject({ kind: "change", citedKeys: ["hdl_cholesterol"] });
  });

  test("doctor questions put findings first, drop repeats and stop at 6", () => {
    const patterns = [
      { askDoctor: ["Question A?", "Question B?", "Question C?"] },
      { askDoctor: ["Question A?", "Question D?", "Question E?", "Question F?"] },
    ] as PatternMatch[];
    const { doctorQuestions } = buildFindings(current, previous, patterns);
    expect(doctorQuestions).toEqual([
      "My scan shows a fatty liver. Which tests should I repeat, and when?",
      "My Thyroid stimulating hormone went from 5.55 µIU/mL to 10.23 µIU/mL. What could explain this change?",
      "My Vitamin B12 went from 402.3 pg/mL to 258 pg/mL. What could explain this change?",
      "Question A?",
      "Question B?",
      "Question C?",
    ]);
  });
});

describe("study alerts", () => {
  const massImpression = [
    "Grade I fatty liver.",
    "Heterogenous, solid, round to oval mass lesion in left adnexa. On color doppler, it shows vascularity. No calcification seen within. Findings are suggestive of left ovarian mass…??needs to be ruled out.",
    "Left ovary could not be seen separate from it.",
    "Mild fluid in POD.",
  ].join("\n");
  const withStudy = (study: Partial<Visit["studies"][number]>) => ({
    ...visit("2025-02-01", [marker("alt", 30, "U/L", "optimal")]),
    studies: [{ ...ultrasound, ...study }],
  });

  test("the adnexal mass on a pelvic ultrasound is the first finding, with a doctor question that quotes it", () => {
    const line = "Heterogenous, solid, round to oval mass lesion in left adnexa.";
    const { findings, doctorQuestions, headline } = buildFindings(
      withStudy({ impression: massImpression }),
      undefined,
      [],
    );
    expect(findings[0]).toMatchObject({
      kind: "study_alert",
      severity: "risk",
      rank: 0,
      title: `Your ultrasound report says: "${line}"`,
      citedStudyIds: [ultrasound.id],
      note: "Ask your doctor about this line of the report.",
      fallback: "Your ultrasound report prints this line.",
    });
    expect(findings.filter(({ kind }) => kind === "study_alert")).toHaveLength(1);
    expect(doctorQuestions[0]).toBe(
      `My ultrasound report says: "${line}" What does this line mean for me?`,
    );
    expect(headline).toBe("Ask your doctor about a line in your ultrasound report.");
  });

  test.each([
    ["a fatty liver ultrasound", "Grade I fatty liver."],
    ["a negated mass", "No evidence of focal mass lesion."],
    [
      "a negative PAP smear",
      "Negative for Intraepithelial Lesion or Malignancy\nAtrophy with inflammation",
    ],
    ["a small cyst", "Simple cyst of 18 mm in the right ovary."],
    ["a nonspecific ST line", "Nonspecific ST abnormality (elevation)"],
  ])("%s gives no study alert and no headline", (_, impression) => {
    const { findings, headline } = buildFindings(withStudy({ impression }), undefined, []);
    expect(findings.some(({ kind }) => kind === "study_alert")).toBe(false);
    expect(headline).toBeUndefined();
  });

  test.each([
    ["a cyst over 3 cm", "Left ovarian cyst measuring 4.2 x 3.1 cm."],
    ["a phrase that holds its own negation", "Left ovary could not be seen separate from it."],
    [
      "a positive phrase after a negated one",
      "No hydronephrosis but a 12 mm calculus in the left kidney.",
    ],
    ["a pathology result", "Atypical squamous cells of undetermined significance (ASC-US)"],
  ])("%s gives a study alert", (_, impression) => {
    const { findings } = buildFindings(withStudy({ impression }), undefined, []);
    expect(findings[0]?.kind).toBe("study_alert");
  });

  test("a pathology result line is checked with its impression", () => {
    const { findings } = buildFindings(
      withStudy({
        kind: "pathology",
        result: "Positive for malignancy",
        impression: "See comment",
      }),
      undefined,
      [],
    );
    expect(findings[0]).toMatchObject({
      kind: "study_alert",
      title: 'Your pathology report says: "Positive for malignancy"',
    });
  });

  test("an examination form verdict never gives a study alert", () => {
    const { findings } = buildFindings(
      withStudy({ kind: "examination", impression: "Fit. Old healed lesion on left leg." }),
      undefined,
      [],
    );
    expect(findings).toEqual([]);
  });
});
