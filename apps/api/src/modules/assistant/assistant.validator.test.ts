import type { Settlement } from "@mediwise/engine";
import { describe, expect, test } from "vitest";
import type { ContextRef } from "./assistant.context.js";
import { validateAnswer } from "./assistant.validator.js";

const refs = new Map<string, ContextRef>([
  [
    "R6:hba1c",
    {
      cite: { kind: "value", reportId: "r6", target: "hba1c" },
      fact: "hba1c: HbA1c, unit %, optimal 4 to 5.6. R6:hba1c 5.9 % watch, lab range 4 to 5.6, 4 Aug 2026, Sunrise Diagnostics, retest due 4 Nov 2026",
      dates: ["2026-08-04", "2026-11-04"],
    },
  ],
  [
    "R2:hba1c",
    {
      cite: { kind: "value", reportId: "r2", target: "hba1c" },
      fact: "hba1c: HbA1c, unit %. R2:hba1c 5.6 % optimal, 3 Feb 2025, Lakeview Imaging",
      dates: ["2025-02-03"],
    },
  ],
  [
    "R6",
    {
      cite: { kind: "report", reportId: "r6", target: null },
      fact: "R6: 4 Aug 2026, Sunrise Diagnostics. Score 81 (gold), coverage 100%. One of 6 reports.",
      dates: ["2026-08-04"],
    },
  ],
  [
    "P:prediabetes",
    {
      cite: { kind: "pattern", reportId: "r6", target: "prediabetes" },
      fact: "P:prediabetes Prediabetes range. Your blood sugar may run higher than optimal.",
      dates: ["2026-08-04"],
      names: ["Prediabetes range"],
      text: "Your blood sugar may run higher than optimal. Ask your doctor about a retest.",
    },
  ],
  [
    "U:1",
    {
      cite: { kind: "follow_up", reportId: "r6", target: "u1" },
      fact: "U:1 Ask your doctor about a supplement for low Vitamin D. Ask your doctor whether a supplement suits you and what dose to take.",
      dates: ["2026-08-04"],
      names: ["Ask your doctor about a supplement for low Vitamin D"],
      text: "Ask your doctor whether a supplement suits you and what dose to take.",
    },
  ],
  [
    "C:hba1c",
    {
      cite: { kind: "catalog", reportId: null, target: "hba1c" },
      fact: "C:hba1c HbA1c. What it is: it reflects average sugar because red cells live about three months.",
      dates: [],
      text: "What it is: it reflects average sugar because red cells live about three months.",
    },
  ],
  [
    "R1:S1",
    {
      cite: { kind: "study", reportId: "r1", target: "s1" },
      fact: 'R1:S1 ultrasound, Pelvis, 10 Feb 2025, Lakeview Imaging. Impression as printed: "A 4.2 x 3.1 cm complex mass in the right adnexa."',
      dates: ["2025-02-10"],
      names: ["ultrasound", "Pelvis", "Lakeview Imaging"],
      quotes: ["A 4.2 x 3.1 cm complex mass in the right adnexa.", "Uterus is normal in size."],
    },
  ],
]);
const settled: Settlement[] = [
  {
    state: "settled",
    reportId: "r2",
    date: "2025-03-24",
    earlierDate: "2025-02-10",
    earlierLabName: null,
    labName: null,
    earlier: "A 4.2 x 3.1 cm complex mass in the right adnexa.",
    later: "No adnexal mass is seen.",
    subject: "adnexal mass",
    alertKeys: ["mass"],
  },
];
refs.set("L2", {
  cite: { kind: "link", reportId: "r1", target: "r2" },
  fact: 'L2: the report of 24 Mar 2025 settles a result of R1 (10 Feb 2025). Later line as printed: "No adnexal mass is seen."',
  dates: ["2025-02-10", "2025-03-24"],
  quotes: [settled[0]!.earlier, settled[0]!.later],
  settlement: settled[0],
});
const context = { refs, settled };

function rules(text: string, cites: string[], kind: "answer" | "refuse" = "answer", open = false) {
  const input = {
    kind,
    refuseKind: kind === "refuse" ? "worry" : undefined,
    sentences: [{ text, cites }],
  };
  return validateAnswer(input, { refs, settled: open ? [] : settled }).problems.map(
    ({ rule }) => rule,
  );
}

describe("validateAnswer", () => {
  test("a cited value with its date passes every rule", () => {
    expect(rules("Your HbA1c was 5.9% on 4 Aug 2026.", ["R6:hba1c"])).toEqual([]);
  });

  test("invalid_call: input that misses the schema, a refusal with no kind, or an empty answer", () => {
    expect(validateAnswer({ kind: "maybe", sentences: [] }, context).problems[0]?.rule).toBe(
      "invalid_call",
    );
    expect(validateAnswer({ kind: "refuse", sentences: [] }, context).problems[0]?.rule).toBe(
      "invalid_call",
    );
    expect(validateAnswer({ kind: "answer", sentences: [] }, context).problems[0]?.rule).toBe(
      "invalid_call",
    );
  });

  test("a refusal that is not worry or treatment shows no sentence, so its sentences are not checked", () => {
    const input = {
      kind: "refuse",
      refuseKind: "diagnosis",
      sentences: [{ text: "You have diabetes.", cites: [] }],
    };
    expect(validateAnswer(input, context).problems).toEqual([]);
  });

  test("too_many_sentences: 6 sentences fail", () => {
    const text = "Your HbA1c is in your reports. ".repeat(6).trim();
    expect(rules(text, ["R6:hba1c"])).toContain("too_many_sentences");
  });

  test("long_sentence: 21 words fail and a quoted printed line counts as one word", () => {
    expect(rules(`${"word ".repeat(20)}end.`, ["R6"])).toContain("long_sentence");
    expect(
      rules(
        'The ultrasound of 10 Feb 2025 reads "A 4.2 x 3.1 cm complex mass in the right adnexa."',
        ["R1:S1"],
        "answer",
        true,
      ),
    ).toEqual([]);
  });

  test("a quote of two printed sentences stays one sentence", () => {
    expect(
      rules(
        'Your pelvis ultrasound of 10 Feb 2025 reads "Uterus is normal in size. Uterus is normal in size."',
        ["R1:S1"],
      ),
    ).toEqual([]);
  });

  test("a quote opened straight and closed curly still counts as a quote", () => {
    expect(
      rules('Your pelvis ultrasound of 10 Feb 2025 reads "Uterus is normal in size.\u201d', [
        "R1:S1",
      ]),
    ).toEqual([]);
  });

  test("semicolon: a semicolon fails", () => {
    expect(rules("Your HbA1c was 5.9% on 4 Aug 2026; it is watch.", ["R6:hba1c"])).toContain(
      "semicolon",
    );
  });

  test("uncited_number: a number with no citation fails", () => {
    expect(rules("Your HbA1c was 5.9%.", [])).toContain("uncited_number");
  });

  test("unknown_ref: a reference that is not in the map fails", () => {
    expect(rules("Your HbA1c was 5.9% on 4 Aug 2026.", ["R9:hba1c"])).toContain("unknown_ref");
    expect(rules("Report R6 holds your HbA1c.", ["R6"])).toContain("unknown_ref");
  });

  test("number_not_in_fact: a number the facts do not hold fails, also a number the user typed", () => {
    expect(rules("Your HbA1c was 6.1% on 4 Aug 2026.", ["R6:hba1c"])).toEqual([
      "number_not_in_fact",
    ]);
    expect(
      rules("Your HbA1c rose by 5.4% between the reports.", ["R6:hba1c", "R2:hba1c"]),
    ).toContain("number_not_in_fact");
  });

  test("wrong_date: a date of no cited report fails, and a retest date of the cited value passes", () => {
    expect(rules("Your HbA1c was 5.9% on 5 Aug 2026.", ["R6:hba1c"])).toContain("wrong_date");
    expect(rules("Your HbA1c was 5.9% in March 2024.", ["R6:hba1c"])).toContain("wrong_date");
    expect(rules("MediWise suggests a retest of HbA1c on 4 Nov 2026.", ["R6:hba1c"])).toEqual([]);
  });

  test("unknown_marker: a catalog marker that is not in these reports fails", () => {
    expect(rules("Your ApoB is not in report R6.", ["R6"])).toContain("unknown_marker");
  });

  test("diagnosis_word: a lab name with Diagnostics passes", () => {
    expect(
      rules("Your HbA1c was 5.9% on 4 Aug 2026 at Sunrise Diagnostics.", ["R6:hba1c"]),
    ).toEqual([]);
  });

  test("diagnosis_word: a diagnosis word fails, a cited pattern name with its hedge passes", () => {
    expect(rules("Your HbA1c of 5.9% shows prediabetes.", ["R6:hba1c"])).toContain(
      "diagnosis_word",
    );
    expect(
      rules("Your HbA1c matches the Prediabetes range pattern, which may mean higher sugar.", [
        "P:prediabetes",
        "R6:hba1c",
      ]),
    ).toEqual([]);
  });

  test("diagnosis_word: a quoted printed study line keeps its words", () => {
    const sentence =
      'The ultrasound of 10 Feb 2025 reads "A 4.2 x 3.1 cm complex mass in the right adnexa."';
    expect(rules(sentence.replace("mass", "tumour"), ["R1:S1"], "answer", true)).toContain(
      "diagnosis_word",
    );
    expect(rules(sentence, ["R1:S1"], "answer", true)).toEqual([]);
  });

  test("treatment_word: a medicine or dose word fails, a cited supplement follow-up passes", () => {
    expect(rules("Your HbA1c may improve with metformin.", ["R6:hba1c"])).toContain(
      "treatment_word",
    );
    expect(
      rules("MediWise says: Ask your doctor about a supplement for low Vitamin D.", ["U:1"]),
    ).toEqual([]);
    expect(rules("Ask your doctor what dose to take.", ["U:1"])).toEqual([]);
  });

  test("status_word: a status the engine does not use fails", () => {
    expect(rules("Your HbA1c of 5.9% on 4 Aug 2026 is normal.", ["R6:hba1c"])).toContain(
      "status_word",
    );
  });

  test("certainty_word: a certainty word fails, and a cited pattern needs its hedge", () => {
    expect(rules("Your HbA1c is definitely watch.", ["R6:hba1c"])).toContain("certainty_word");
    expect(rules("Your HbA1c matches the Prediabetes range pattern.", ["P:prediabetes"])).toContain(
      "certainty_word",
    );
  });

  test("cause_word: a cause fails, cited catalog text that states it passes", () => {
    expect(
      rules("Your HbA1c fell because you started walking.", ["R6:hba1c", "R2:hba1c"]),
    ).toContain("cause_word");
    expect(
      rules("HbA1c reflects average sugar because red cells live about three months.", ["C:hba1c"]),
    ).toEqual([]);
  });

  test("settled_as_current: a settled alert stated as current fails, one the later report settles passes", () => {
    expect(rules("Your scan shows an adnexal mass.", ["R1:S1"])).toContain("settled_as_current");
    expect(rules("The report of 24 Mar 2025 settles the earlier result.", ["L2"])).not.toContain(
      "settled_as_current",
    );
  });

  test("settled_as_current: the earlier printed line quoted with its settling L reference passes", () => {
    expect(
      rules('The scan of 10 Feb 2025 read "A 4.2 x 3.1 cm complex mass in the right adnexa."', [
        "L2",
      ]),
    ).toEqual([]);
  });

  test("settled_as_current: settles with no cited settled result fails", () => {
    expect(rules("The report of 4 Aug 2026 settles the earlier result.", ["R6:hba1c"])).toContain(
      "settled_as_current",
    );
  });

  test("paraphrased_study: a retold or misquoted printed line fails", () => {
    expect(
      rules("The ultrasound of 10 Feb 2025 shows a complex mass near the adnexa.", ["R1:S1"]),
    ).toContain("paraphrased_study");
    expect(rules('The ultrasound of 10 Feb 2025 reads "A small cyst."', ["R1:S1"])).toContain(
      "paraphrased_study",
    );
    expect(rules("Your pelvis ultrasound is from 10 Feb 2025.", ["R1:S1"])).toEqual([]);
  });

  test("a worry refusal checks its fact sentences", () => {
    expect(rules("Your HbA1c was 6.1% on 4 Aug 2026.", ["R6:hba1c"], "refuse")).toContain(
      "number_not_in_fact",
    );
  });
});
