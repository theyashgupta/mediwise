import { describe, expect, test } from "vitest";
import { hindiCopyProblems } from "./catalog/index.js";
import { runEngine } from "./index.js";
import {
  categoryLabel,
  localizeAlertHeadline,
  localizeFollowUp,
  localizeVerdict,
} from "./localize.js";

const profile = { ageYears: 40, sex: "male" as const, ancestry: "south_asian" as const };

describe("verdict", () => {
  test("each verdict form has a Hindi form with the same numbers and the marker name as printed", () => {
    const verdicts = [
      "We could not check any marker on this report against a calibrated range.",
      "All 12 markers sit in your calibrated ranges. Nothing needs to move first.",
      "67 of 81 markers sit in your calibrated ranges. LDL cholesterol is the one to move first.",
    ];
    const hindi = verdicts.map((verdict) => localizeVerdict(verdict, "hi"));
    expect(hindi[2]).toBe(
      "81 में से 67 मार्कर आपकी कैलिब्रेटेड रेंज में हैं। सबसे पहले LDL cholesterol पर काम करें।",
    );
    verdicts.forEach((verdict, i) => {
      expect(hindiCopyProblems(hindi[i]!, verdict, ["LDL cholesterol"])).toEqual([]);
    });
  });

  test("an English verdict and an unknown text pass through unchanged", () => {
    const verdict = runEngine({
      profile,
      values: [{ rawName: "LDL", markerKey: "ldl_cholesterol", value: 180, unit: "mg/dL" }],
    }).verdict;
    expect(localizeVerdict(verdict, "en")).toBe(verdict);
    expect(localizeVerdict("Something else.", "hi")).toBe("Something else.");
  });
});

describe("follow-ups", () => {
  const { followUps } = runEngine({
    profile,
    values: [
      { rawName: "Vitamin D", markerKey: "vitamin_d", value: 8, unit: "ng/mL" },
      { rawName: "Anti HBs", markerKey: "anti_hbs", value: "<2.0", unit: "text" },
    ],
  });

  test("every follow-up kind and a text rule follow-up get Hindi copy that follows the copy rules", () => {
    expect(followUps.map(({ kind }) => kind)).toEqual(
      expect.arrayContaining(["supplement", "retest", "measure"]),
    );
    for (const followUp of followUps) {
      const hindi = localizeFollowUp(followUp, "hi");
      for (const part of ["title", "why", "next"] as const) {
        expect(hindi[part]).not.toBe(followUp[part]);
        expect(hindiCopyProblems(hindi[part], followUp[part])).toEqual([]);
      }
    }
  });

  test("an English follow-up is returned as stored", () => {
    for (const followUp of followUps) expect(localizeFollowUp(followUp, "en")).toBe(followUp);
  });
});

describe("labels and headline", () => {
  test("category labels are English for English and Devanagari for Hindi", () => {
    expect(categoryLabel("lipids", "en")).toBe("Cholesterol and lipids");
    expect(categoryLabel("lipids", "hi")).toMatch(/\p{Script=Devanagari}/u);
  });

  test("the alert headline names each study kind in Hindi", () => {
    const english = "Ask your doctor about a line in your X-ray and ultrasound reports.";
    expect(localizeAlertHeadline(english, "hi")).toBe(
      "अपनी X-ray और अल्ट्रासाउंड रिपोर्ट की एक लाइन के बारे में डॉक्टर से पूछें।",
    );
    expect(localizeAlertHeadline(english, "en")).toBe(english);
  });
});
