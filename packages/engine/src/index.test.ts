import { describe, expect, test } from "vitest";
import fullPanel from "../fixtures/full-panel.json";
import lipidOnly from "../fixtures/lipid-only.json";
import thyroidOnly from "../fixtures/thyroid-only.json";
import unknownUnits from "../fixtures/unknown-units.json";
import {
  ancestrySchema,
  assessMeasurements,
  derived,
  markers,
  runEngine,
  type EngineInput,
} from "./index.js";

const fixtures = {
  "full-panel": fullPanel,
  "lipid-only": lipidOnly,
  "thyroid-only": thyroidOnly,
  "unknown-units": unknownUnits,
} as Record<string, EngineInput>;

const full = fixtures["full-panel"]!;

function withValue(input: EngineInput, rawName: string, value: number): EngineInput {
  return {
    ...input,
    values: input.values.map((item) => (item.rawName === rawName ? { ...item, value } : item)),
  };
}

describe("fixtures", () => {
  test.each(Object.keys(fixtures))("%s matches its expected output", async (name) => {
    const output = runEngine(fixtures[name]!);
    await expect(`${JSON.stringify(output, null, 2)}\n`).toMatchFileSnapshot(
      `../fixtures/${name}.expected.json`,
    );
  });

  test("the full panel gives a tier, 5 move-first entries, every follow-up kind and unmeasured markers", () => {
    const output = runEngine(full);
    expect(output.score.overall).toBeGreaterThan(0);
    expect(output.score.tier).toBeDefined();
    expect(output.moveFirst).toHaveLength(5);
    expect(new Set(output.followUps.map((item) => item.kind))).toEqual(
      new Set(["supplement", "retest", "measure"]),
    );
    expect(output.unmeasured.length).toBeGreaterThan(0);
  });

  test("the unknown-units panel marks unknown units and keeps unmapped names", () => {
    const output = runEngine(fixtures["unknown-units"]!);
    const unknown = output.markers.filter((item) => item.status === "unknown");
    expect(unknown.map((item) => item.markerKey).sort()).toEqual([
      "hba1c",
      "hemoglobin",
      "lipoprotein_a",
      "vitamin_d",
    ]);
    expect(output.unmapped.map((item) => item.rawName)).toEqual([
      "Serum Zonulin",
      "Lab Remark Index",
    ]);
  });
});

describe("runEngine", () => {
  test("moving one value from optimal to risk changes the score, verdict and ranking", () => {
    const before = runEngine(full);
    const after = runEngine(withValue(full, "S. Creatinine", 2.4));
    expect(before.markers.find((item) => item.markerKey === "creatinine")?.status).toBe("optimal");
    expect(after.markers.find((item) => item.markerKey === "creatinine")?.status).toBe("risk");
    expect(after.score.overall).toBeLessThan(before.score.overall);
    expect(after.verdict).not.toBe(before.verdict);
    expect(after.moveFirst).not.toEqual(before.moveFirst);
    expect(after.moveFirst[0]?.markerKey).toBe("creatinine");
  });

  test("a panel with no issues says nothing needs to move first", () => {
    const output = runEngine({
      profile: { ageYears: 30, sex: "female", ancestry: "european" },
      values: [{ rawName: "TSH", value: 2, unit: "µIU/mL" }],
    });
    expect(output.verdict).toBe(
      "All 1 markers sit in your calibrated ranges. Nothing needs to move first.",
    );
    expect(output.moveFirst).toEqual([]);
  });

  test("a panel of unknown units says nothing could be checked and scores 0", () => {
    const output = runEngine({
      profile: { ageYears: 30, sex: "female", ancestry: "european" },
      values: [{ rawName: "TSH", value: 2, unit: "bananas" }],
    });
    expect(output.verdict).toBe(
      "We could not check any marker on this report against a calibrated range.",
    );
    expect(output.score).toMatchObject({ overall: 0, tier: "bronze", capped: true });
  });

  test("a text result adds to the score only when a catalog rule gives it a status", () => {
    const profile = { ageYears: 30, sex: "female", ancestry: "european" } as const;
    const tsh = { rawName: "TSH", value: 2, unit: "µIU/mL" };
    const base = runEngine({ profile, values: [tsh] });
    const unruled = runEngine({
      profile,
      values: [
        tsh,
        { rawName: "Urine Colour", value: "Pale yellow" },
        { rawName: "Crystals", value: "Absent" },
      ],
    });
    const ruled = runEngine({ profile, values: [tsh, { rawName: "HBsAg", value: "Reactive" }] });
    expect(unruled.score).toEqual(base.score);
    expect(unruled.markers.map((item) => item.status)).toEqual(["optimal", "unknown", "unknown"]);
    expect(ruled.score.byCategory.other).toBe(20);
    expect(ruled.moveFirst).toEqual([
      {
        markerKey: "hbsag",
        severity: "critical",
        reason: "Hepatitis B surface antigen is Reactive.",
      },
    ]);
  });

  test("a reactive text result gets the follow-up written for its rule, not the numeric retest", () => {
    const profile = { ageYears: 30, sex: "female", ancestry: "european" } as const;
    const output = runEngine({
      profile,
      values: [
        { rawName: "HBsAg", value: "Reactive" },
        { rawName: "HCV, IgG", value: "REACTIVE" },
      ],
    });
    const followUps = output.followUps.filter((item) => item.kind === "retest");
    expect(followUps.map(({ markerKey, why, next }) => ({ markerKey, why, next }))).toEqual([
      {
        markerKey: "hbsag",
        why: "HBsAg is reactive. This result can mean that the hepatitis B virus is in your blood now.",
        next: "Ask your doctor about a confirmatory test. Do not start treatment before your doctor confirms the result.",
      },
      {
        markerKey: "hcv_antibody",
        why: "Anti-HCV is reactive. This result shows that you had the hepatitis C virus at some time.",
        next: "Ask your doctor about an HCV RNA test. This test shows if the virus is in your blood now.",
      },
    ]);
    for (const { title, why } of followUps) expect(`${title} ${why}`).not.toMatch(/calibrated/);
  });

  test("a low anti-HBs text result gets the follow-up written for its watch rule", () => {
    const profile = { ageYears: 30, sex: "female", ancestry: "european" } as const;
    const output = runEngine({ profile, values: [{ rawName: "Anti-HBs Titre", value: "<2.0" }] });
    expect(output.markers[0]?.status).toBe("watch");
    expect(output.followUps.filter((item) => item.markerKey === "anti_hbs")).toEqual([
      expect.objectContaining({
        kind: "retest",
        why: "Your hepatitis B antibody level is low. Anti-HBs below 10 mIU/mL can mean that you are not protected against hepatitis B.",
        next: "Ask your doctor about a booster dose.",
      }),
    ]);
  });

  test("a numeric watch result still gets no follow-up", () => {
    const profile = { ageYears: 30, sex: "female", ancestry: "european" } as const;
    const output = runEngine({
      profile,
      values: [{ rawName: "Anti-HBs Titre", value: 5, unit: "mIU/mL" }],
    });
    expect(output.markers[0]?.status).toBe("watch");
    expect(output.followUps.filter((item) => item.markerKey === "anti_hbs")).toEqual([]);
  });

  test("urine lines in a urine panel take urine markers, while the same names in blood panels keep blood markers", () => {
    const profile = { ageYears: 38, sex: "male", ancestry: "south_asian" } as const;
    const urine = "Urine Routine And Microscopy*";
    const output = runEngine({
      profile,
      values: [
        {
          rawName: "RBC Count",
          panel: "Complete Haemogram, Peripheral Smear and ESR,EDTA",
          value: 5.53,
          unit: "mill/µL",
        },
        {
          rawName: "Bilirubin (Total)",
          panel: "Liver Function Test (LFT)*, Serum",
          value: 0.913,
          unit: "mg/dL",
        },
        { rawName: "Bilirubin", panel: urine, value: "ABSENT" },
        { rawName: "Red Blood Cells (RBC)", panel: urine, value: "ABSENT" },
      ],
    });
    expect(output.markers.map((item) => item.markerKey)).toEqual([
      "rbc_count",
      "bilirubin_total",
      "urine_bilirubin",
      "urine_rbc",
    ]);
  });

  test("coverage below a quarter caps the score at 50", () => {
    const output = runEngine(fixtures["thyroid-only"]!);
    expect(output.score.coverage).toEqual({ measured: 1, core: 16, pct: 6 });
    expect(output.score.overall).toBeLessThanOrEqual(50);
    expect(output.score.capped).toBe(true);
  });
});

/** Mulberry32: a seeded generator, so the property test is itself repeatable. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("determinism", () => {
  test("running the engine twice on the same random input gives deep-equal output", () => {
    const random = seeded(7);
    const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)]!;
    const entries = [...markers, ...derived];
    for (let run = 0; run < 300; run += 1) {
      const input: EngineInput = {
        profile: {
          ageYears: Math.floor(random() * 90),
          sex: pick(["male", "female", "other"] as const),
          ancestry: pick([...ancestrySchema.options, "mixed", "unknown"] as const),
        },
        values: Array.from({ length: Math.floor(random() * 40) }, () => {
          const entry = pick(entries);
          const unit = pick([
            entry.unit,
            ...entry.conversions.map((c) => c.from),
            "bogus",
            undefined,
          ]);
          return {
            rawName: random() < 0.1 ? "Not a marker" : entry.name,
            value: Math.round(random() * 500) / 10,
            ...(unit !== undefined && { unit }),
            ...(random() < 0.5 && { labLow: 1, labHigh: 20 }),
          };
        }),
      };
      const snapshot: unknown = JSON.parse(JSON.stringify(input));
      expect(runEngine(input)).toEqual(runEngine(input));
      expect(input).toEqual(snapshot);
    }
  });
});

describe("vitals and study measurements", () => {
  const vitals = [
    { rawName: "Height", markerKey: "height", value: 166, unit: "cm" },
    { rawName: "Weight", markerKey: "weight", value: 73, unit: "kg" },
    { rawName: "B.P.", markerKey: "systolic_bp", value: 150, unit: "mmHg" },
    { rawName: "B.P.", markerKey: "diastolic_bp", value: 67, unit: "mmHg" },
  ];

  test("vitals get a status and a BMI, and never change the score, verdict, move first or follow-ups", () => {
    const labOnly = runEngine(full);
    const withVitals = runEngine({ ...full, values: [...full.values, ...vitals] });

    expect(withVitals.score).toEqual(labOnly.score);
    expect(withVitals.verdict).toBe(labOnly.verdict);
    expect(withVitals.moveFirst).toEqual(labOnly.moveFirst);
    expect(withVitals.followUps).toEqual(labOnly.followUps);
    const status = (key: string) =>
      withVitals.markers.find((item) => item.markerKey === key)?.status;
    expect(status("systolic_bp")).toBe("risk");
    expect(status("diastolic_bp")).toBe("optimal");
    expect(status("height")).toBe("unknown");
    const bmi = withVitals.derived.find((item) => item.markerKey === "bmi");
    expect(bmi).toMatchObject({ value: 26.5, unit: "kg/m²", inputs: ["weight", "height"] });
  });

  test("a BMI of 24 is optimal for most adults and watch for a South Asian profile", () => {
    const at24 = [
      { rawName: "Height", markerKey: "height", value: 170, unit: "cm" },
      { rawName: "Weight", markerKey: "weight", value: 69.4, unit: "kg" },
    ];
    const bmiFor = (ancestry: EngineInput["profile"]["ancestry"]) =>
      runEngine({ profile: { ...full.profile, ancestry }, values: at24 }).derived.find(
        (item) => item.markerKey === "bmi",
      );
    expect(bmiFor("european")).toMatchObject({ value: 24, status: "optimal" });
    expect(bmiFor("south_asian")).toMatchObject({ value: 24, status: "watch" });
  });

  test("study measurements take a status from the catalog by sex, in canonical units", () => {
    const profile = { ageYears: 25, sex: "male" as const, ancestry: "south_asian" as const };
    const [qtc, liver, kidney, pr, unknownKey] = assessMeasurements(
      [
        { rawName: "QTc", markerKey: "qtc_interval", value: 455, unit: "ms" },
        { rawName: "Liver", markerKey: "liver_length", value: 130, unit: "mm" },
        { rawName: "Right kidney", markerKey: "right_kidney_length", value: 90, unit: "mm" },
        { rawName: "PR", markerKey: "pr_interval", value: 130, unit: "ms" },
        { rawName: "Hemoglobin", markerKey: "made_up_key", value: 13, unit: "g/dL" },
      ],
      profile,
    );
    expect(qtc).toMatchObject({ value: 455, status: "watch" });
    expect(
      assessMeasurements([{ rawName: "QTc", markerKey: "qtc_interval", value: 455, unit: "ms" }], {
        ...profile,
        sex: "female",
      })[0]?.status,
    ).toBe("optimal");
    expect(liver).toMatchObject({ value: 13, unit: "cm", status: "optimal" });
    expect(kidney).toMatchObject({ value: 90, unit: "mm", status: "unknown" });
    expect(pr).toMatchObject({ value: 130, status: "unknown" });
    expect(unknownKey).toBeUndefined();
  });
});
