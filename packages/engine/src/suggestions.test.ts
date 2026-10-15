import { describe, expect, test } from "vitest";
import type { AttentionAlert, AttentionVisit } from "./attention.js";
import { buildSuggestions } from "./suggestions.js";
import type { VisitMarker } from "./types.js";

const disclaimer = "MediWise is for information. Ask your doctor before you act on this.";
const headline = "Ask your doctor about a line in your ultrasound report.";
const stored = 'Your ultrasound report says: "Suspicious mass, malignancy not excluded."';

function row(
  markerKey: string,
  value: number,
  status: VisitMarker["status"],
  [calibratedLow, calibratedHigh]: [number | null, number | null],
  unit: string,
): VisitMarker {
  return { markerKey, value, valueText: null, unit, status, calibratedLow, calibratedHigh };
}

function visit(date: string, markers: VisitMarker[], reportId = `report-${date}`): AttentionVisit {
  return { reportId, date, markers };
}

const kinds = (visits: AttentionVisit[], alerts: AttentionAlert[] = []) =>
  buildSuggestions(visits, alerts).map(({ kind, markerKeys }) => [kind, ...markerKeys].join(":"));

describe("doctor-now", () => {
  test("an open study alert line gives doctor-now with its report, its headline and no marker", () => {
    const [suggestion] = buildSuggestions(
      [],
      [{ reportId: "usg", date: "2026-03-01", title: stored }],
    );
    expect(suggestion).toMatchObject({
      kind: "doctor_now",
      markerKeys: [],
      reportId: "usg",
      date: "2026-03-01",
      title: headline,
      next: "Book a visit with your doctor. Do not wait for your next test. Take this report with you.",
    });
  });

  test("the printed report line never reaches the text, and a title of an unknown shape reads as a test", () => {
    const [known, unknown] = buildSuggestions(
      [],
      [
        { reportId: "usg", date: "2026-03-02", title: stored },
        { reportId: "odd", date: "2026-03-01", title: "Something else: cancer" },
      ],
    );
    expect(known?.title).toBe(headline);
    expect(unknown?.title).toBe("Ask your doctor about a line in your test report.");
    expect(JSON.stringify([known, unknown])).not.toMatch(/malignancy|mass|cancer/i);
  });

  test("two alerted lines of one report give one doctor-now", () => {
    const second = 'Your ultrasound report says: "Lesion in segment IV."';
    expect(
      kinds(
        [],
        [
          { reportId: "usg", date: "2026-03-01", title: stored },
          { reportId: "usg", date: "2026-03-01", title: second },
        ],
      ),
    ).toEqual(["doctor_now"]);
  });

  test("a settled alert line gives no suggestion", () => {
    const settled: AttentionAlert = {
      reportId: "usg",
      date: "2026-03-01",
      title: stored,
      settlement: { state: "settled", reportId: "usg-2" },
    };
    expect(buildSuggestions([], [settled])).toEqual([]);
  });

  test("a value past the high or low urgent limit gives only doctor-now for that marker", () => {
    const suggestions = buildSuggestions([
      visit("2026-03-01", [
        row("potassium", 6.8, "risk", [3.5, 5], "mmol/L"),
        row("glucose_fasting", 40, "risk", [70, 99], "mg/dL"),
      ]),
    ]);
    expect(suggestions.map(({ kind, markerKeys }) => [kind, markerKeys])).toEqual([
      ["doctor_now", ["potassium"]],
      ["doctor_now", ["glucose_fasting"]],
    ]);
    expect(suggestions[0]).toMatchObject({
      title: "See a doctor today about your Potassium",
      why: "Your latest Potassium is far outside the usual range.",
      next: "See a doctor today and take this report with you. If you feel unwell, go to an emergency department now.",
      sources: [expect.objectContaining({ id: "kost1990" })],
    });
    expect(suggestions[1]?.sources).toEqual([expect.objectContaining({ id: "ada2025" })]);
  });

  test("a high glucose past the urgent limit gives no habit next to doctor-now", () => {
    expect(
      kinds([visit("2026-03-01", [row("glucose_random", 520, "risk", [70, 139], "mg/dL")])]),
    ).toEqual(["doctor_now:glucose_random"]);
  });

  test("a marker past its urgent limit stops habit lines for every marker of its block", () => {
    expect(
      kinds([
        visit("2026-03-01", [
          row("glucose_fasting", 520, "risk", [70, 99], "mg/dL"),
          row("hba1c", 6, "watch", [null, 5.6], "%"),
        ]),
      ]),
    ).toEqual(["doctor_now:glucose_fasting", "retest:hba1c"]);
  });

  test("a risk value inside the urgent limit gives doctor-soon, not doctor-now", () => {
    expect(
      kinds([visit("2026-03-01", [row("potassium", 5.8, "risk", [3.5, 5], "mmol/L")])]),
    ).toEqual(["doctor_soon:potassium"]);
  });

  test("a value in a unit that is not the catalog unit never gives doctor-now", () => {
    expect(
      kinds([visit("2026-03-01", [row("potassium", 6.8, "risk", [3.5, 5], "mEq/L")])]),
    ).toEqual(["doctor_soon:potassium"]);
  });

  test("a watch value past a limit gives no doctor-now, because the limit needs a risk status", () => {
    expect(
      kinds([visit("2026-03-01", [row("systolic_bp", 185, "watch", [null, 119], "mmHg")])]),
    ).not.toContain("doctor_now:systolic_bp");
  });
});

describe("doctor-soon", () => {
  test("every risk marker goes into one suggestion, furthest from optimal first", () => {
    const [soon] = buildSuggestions([
      visit("2026-03-01", [
        row("uric_acid", 9, "risk", [null, 6.8], "mg/dL"),
        row("ldl_cholesterol", 200, "risk", [null, 99], "mg/dL"),
      ]),
    ]);
    expect(soon).toMatchObject({
      kind: "doctor_soon",
      markerKeys: ["ldl_cholesterol", "uric_acid"],
      title: "Show 2 results to your doctor",
      why: "These 2 results are well outside your calibrated range.",
    });
  });

  test("a watch marker alone gives no doctor-soon", () => {
    expect(
      kinds([visit("2026-03-01", [row("ldl_cholesterol", 140, "watch", [null, 99], "mg/dL")])]),
    ).not.toContain("doctor_soon:ldl_cholesterol");
  });
});

describe("supplement-ask", () => {
  test("a low supplementable marker gives supplement-ask with no dose", () => {
    const suggestion = buildSuggestions([
      visit("2026-03-01", [row("vitamin_d", 18, "risk", [30, 100], "ng/mL")]),
    ]).find(({ kind }) => kind === "supplement_ask");
    expect(suggestion).toMatchObject({
      markerKeys: ["vitamin_d"],
      title: "Ask your doctor about a supplement for low Vitamin D (25-OH)",
      next: "Ask your doctor if a supplement is right for you. Do not start one on your own.",
    });
  });

  test("a high supplementable marker gives no supplement-ask", () => {
    expect(
      kinds([visit("2026-03-01", [row("ferritin", 600, "risk", [45, 300], "ng/mL")])]),
    ).toEqual(["doctor_soon:ferritin"]);
  });
});

describe("retest", () => {
  test("a watch HbA1c gets a retest due 52 weeks after it was measured, with its source", () => {
    const retest = buildSuggestions([
      visit("2026-01-01", [row("hba1c", 6, "watch", [null, 5.6], "%")]),
    ]).find(({ kind }) => kind === "retest");
    expect(retest).toMatchObject({
      markerKeys: ["hba1c"],
      dueOn: "2026-12-31",
      why: "Your latest HbA1c is outside your calibrated range.",
      next: "Book a retest of HbA1c about 52 weeks after your last test. Take both reports to your doctor.",
      sources: [expect.objectContaining({ id: "aafpAda2018" })],
    });
  });

  test("a marker with no sourced interval gets no retest", () => {
    expect(
      kinds([visit("2026-01-01", [row("ldl_cholesterol", 140, "watch", [null, 99], "mg/dL")])]),
    ).not.toContain("retest:ldl_cholesterol");
  });
});

describe("habit", () => {
  test("a high LDL gets its habits, what raises and lowers it, and the source", () => {
    const [habit] = buildSuggestions([
      visit("2026-03-01", [row("ldl_cholesterol", 140, "watch", [null, 99], "mg/dL")]),
    ]);
    expect(habit).toMatchObject({
      kind: "habit",
      title: "Habits that can help your LDL cholesterol",
      why: "Your latest LDL cholesterol is above your calibrated range.",
      habits: expect.arrayContaining([expect.stringContaining("fibre")]),
      raises: expect.arrayContaining(["Weight gain"]),
      lowers: expect.arrayContaining(["Regular activity"]),
      sources: [expect.objectContaining({ id: "ahaAcc2018" })],
    });
    expect(habit?.next).toBe(habit?.habits?.join(" "));
  });

  test("markers that share habit lines get one habit suggestion that names them all", () => {
    const habits = buildSuggestions([
      visit("2026-03-01", [
        row("total_cholesterol", 220, "watch", [null, 199], "mg/dL"),
        row("ldl_cholesterol", 140, "watch", [null, 99], "mg/dL"),
      ]),
    ]).filter(({ kind }) => kind === "habit");
    expect(habits).toHaveLength(1);
    expect(habits[0]).toMatchObject({
      markerKeys: ["ldl_cholesterol", "total_cholesterol"],
      title: "Habits that can help your LDL cholesterol and Total cholesterol",
      why: "These 2 results are above your calibrated range.",
    });
  });

  test("a low vitamin D gets habits on its low side", () => {
    expect(
      kinds([visit("2026-03-01", [row("vitamin_d", 25, "watch", [30, 100], "ng/mL")])]),
    ).toEqual(["supplement_ask:vitamin_d", "habit:vitamin_d"]);
  });

  test("a low BMI gets no habit, because the habits address a high BMI", () => {
    expect(
      kinds([visit("2026-03-01", [row("bmi", 17.5, "watch", [18.5, 24.9], "kg/m²")])]),
    ).toEqual([]);
  });

  test("a marker with no lifestyle lines gets no habit", () => {
    expect(kinds([visit("2026-03-01", [row("basophils_pct", 2, "watch", [0, 1], "%")])])).toEqual(
      [],
    );
  });
});

describe("text edges", () => {
  test("a habit block of more than two markers names two and counts the rest", () => {
    const [habit] = buildSuggestions([
      visit("2026-03-01", [
        row("glucose_fasting", 110, "watch", [70, 99], "mg/dL"),
        row("hba1c", 6, "watch", [null, 5.6], "%"),
        row("insulin_fasting", 15, "watch", [2, 12], "µIU/mL"),
      ]),
    ]).filter(({ kind }) => kind === "habit");
    expect(habit?.markerKeys).toHaveLength(3);
    expect(habit?.title).toMatch(/^Habits that can help your [^,]+, [^,]+ and 1 more$/);
    expect(habit?.why).toBe("These 3 results are above your calibrated range.");
  });

  test("a risk HbA1c retest says well outside and uses the 13-week risk interval", () => {
    const retest = buildSuggestions([
      visit("2026-01-01", [row("hba1c", 7.5, "risk", [null, 5.6], "%")]),
    ]).find(({ kind }) => kind === "retest");
    expect(retest).toMatchObject({
      why: "Your latest HbA1c is well outside your calibrated range.",
      dueOn: "2026-04-02",
    });
  });

  test("a row whose marker is not in the catalog gives no suggestion", () => {
    expect(kinds([visit("2026-03-01", [row("not_a_marker", 99, "risk", [1, 2], "x")])])).toEqual(
      [],
    );
  });
});

describe("what gives nothing", () => {
  test("optimal markers, and a worsening marker that is still optimal, give no suggestion", () => {
    expect(
      buildSuggestions([
        visit("2026-01-01", [row("ldl_cholesterol", 70, "optimal", [null, 99], "mg/dL")]),
        visit("2026-03-01", [row("ldl_cholesterol", 95, "optimal", [null, 99], "mg/dL")]),
      ]),
    ).toEqual([]);
  });

  test("an earlier risk value that a later optimal value replaced gives no suggestion", () => {
    expect(
      buildSuggestions([
        visit("2026-01-01", [row("ldl_cholesterol", 200, "risk", [null, 99], "mg/dL")]),
        visit("2026-03-01", [row("ldl_cholesterol", 90, "optimal", [null, 99], "mg/dL")]),
      ]),
    ).toEqual([]);
  });
});

describe("order, rank and text", () => {
  const visits = [
    visit("2026-01-01", [
      row("hba1c", 6, "watch", [null, 5.6], "%"),
      row("vitamin_d", 18, "risk", [30, 100], "ng/mL"),
      row("ldl_cholesterol", 140, "watch", [null, 99], "mg/dL"),
      row("sodium", 115, "risk", [136, 145], "mmol/L"),
    ]),
  ];
  const alerts = [{ reportId: "usg", date: "2026-02-01", title: stored }];

  test("kinds come doctor-now, doctor-soon, supplement-ask, retest, habit, ranked from 1", () => {
    const suggestions = buildSuggestions(visits, alerts);
    expect(suggestions.map(({ kind, markerKeys }) => [kind, ...markerKeys].join(":"))).toEqual([
      "doctor_now",
      "doctor_now:sodium",
      "doctor_soon:vitamin_d",
      "supplement_ask:vitamin_d",
      "retest:hba1c",
      "habit:vitamin_d",
      "habit:ldl_cholesterol",
      "habit:hba1c",
    ]);
    expect(suggestions.map(({ rank }) => rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  test("every suggestion carries the disclaimer word for word", () => {
    for (const suggestion of buildSuggestions(visits, alerts)) {
      expect(suggestion.disclaimer).toBe(disclaimer);
    }
  });

  test("Hindi gives Hindi text, Hindi habit lines and the Hindi disclaimer", () => {
    const suggestions = buildSuggestions(visits, alerts, "hi");
    expect(suggestions[0]?.title).toBe(
      "अपनी अल्ट्रासाउंड रिपोर्ट की एक लाइन के बारे में डॉक्टर से पूछें।",
    );
    expect(suggestions.find(({ kind }) => kind === "supplement_ask")?.title).toBe(
      "कम Vitamin D (25-OH) के लिए सप्लीमेंट के बारे में डॉक्टर से पूछें",
    );
    expect(suggestions.find(({ kind }) => kind === "habit")?.habits?.[0]).toMatch(
      /\p{Script=Devanagari}/u,
    );
    for (const { disclaimer: text } of suggestions) {
      expect(text).toBe(
        "MediWise सिर्फ़ जानकारी के लिए है। इस पर कुछ भी करने से पहले अपने डॉक्टर से पूछें।",
      );
    }
  });
});
