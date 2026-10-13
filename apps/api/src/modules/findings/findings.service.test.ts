import type { FindingDraft, Visit } from "@mediwise/engine";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { stepUsage } from "../extraction/index.js";
import {
  findingExamples,
  type FindingsUsage,
  validateFindingBody,
  writeFindings,
} from "./findings.service.js";

const edge = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("../../lib/anthropic.js", () => ({ anthropic: { messages: { create: edge.create } } }));

const studyId = "0e1d07e4-9ec8-4911-bc9b-4c6cedd86675";
const allowed = new Set(["tsh", "vitamin_d", "triglycerides", "hba1c", "alt"]);
const visit: Visit = {
  date: "2025-02-01",
  labName: null,
  markers: [...allowed].map((markerKey) => ({
    markerKey,
    value: 1,
    valueText: null,
    unit: null,
    status: null,
    calibratedLow: null,
    calibratedHigh: null,
  })),
  studies: [],
};

const tsh: FindingDraft = {
  kind: "change",
  severity: "watch",
  direction: "worsening",
  title: "Thyroid stimulating hormone worsening: 5.41 µIU/mL in Jan 2024, 9.98 µIU/mL in Feb 2025",
  citedKeys: ["tsh"],
  citedStudyIds: [],
  rank: 0,
  facts: ["Direction: worsening."],
  note: "Different labs measured these values, so the method may differ. Compare them with care.",
};
const liver: FindingDraft = {
  kind: "link",
  severity: "watch",
  title: "Fatty liver on the scan",
  citedKeys: ["triglycerides", "hba1c"],
  citedStudyIds: [studyId],
  rank: 1,
  facts: ["The ultrasound impression reads: Grade I fatty liver."],
};

type Body = { number: number; body: string; citedKeys: string[] };
type Request = {
  system: { text: string; cache_control?: unknown }[];
  messages: { content: { text: string; cache_control?: unknown }[] }[];
};

function toolUse(findings: Body[]) {
  return {
    content: [{ type: "tool_use", id: "toolu_1", name: "write_findings", input: { findings } }],
    stop_reason: "tool_use",
    usage: { input_tokens: 400, output_tokens: 80 },
  };
}

function request(call: number) {
  return edge.create.mock.calls[call]?.[0] as Request;
}

const tshBody = { number: 1, body: "TSH almost doubled since Jan 2024.", citedKeys: ["tsh"] };
const liverBody = {
  number: 2,
  body: "The ultrasound shows grade I fatty liver. Triglycerides and HbA1c are optimal.",
  citedKeys: ["study_1", "triglycerides", "hba1c"],
};

beforeEach(() => edge.create.mockReset());

describe("validateFindingBody", () => {
  test("a short body that cites keys in either visit passes", () => {
    expect(validateFindingBody(tshBody, allowed)).toEqual([]);
  });

  test("each broken rule is named", () => {
    const rules = (body: string, citedKeys = ["tsh"]) =>
      validateFindingBody({ body, citedKeys }, allowed).map(({ rule }) => rule);
    expect(rules(Array.from({ length: 21 }, () => "word").join(" "))).toEqual(["long_sentence"]);
    expect(rules("One. Two. Three. Four.")).toEqual(["too_many_sentences"]);
    expect(rules("TSH is high; retest it.")).toEqual(["semicolon"]);
    expect(rules("You have a thyroid disease.")).toEqual(["diagnosis_word"]);
    expect(rules("TSH rose.", [])).toEqual(["uncited"]);
    expect(rules("TSH rose.", ["ldl_cholesterol"])).toEqual(["unknown_key"]);
  });

  test("a body that names a marker not in either visit is rejected", () => {
    expect(
      validateFindingBody(
        { body: "TSH rose while free T4 stayed optimal.", citedKeys: ["tsh"] },
        allowed,
      ),
    ).toEqual([
      { rule: "unknown_marker", message: 'It names "free t4", which is not in this report.' },
    ]);
  });

  test("a present marker name that holds an absent one is not a match", () => {
    const fasting = new Set(["glucose_fasting"]);
    expect(
      validateFindingBody(
        { body: "Fasting glucose is optimal.", citedKeys: ["glucose_fasting"] },
        fasting,
      ),
    ).toEqual([]);
  });

  test("the example bodies in the prompt pass every rule", () => {
    const keys = new Set([...allowed, "study_1"]);
    for (const example of findingExamples) expect(validateFindingBody(example, keys)).toEqual([]);
  });
});

describe("writeFindings", () => {
  test("each finding gets its body, the method note and the engine title and keys", async () => {
    edge.create.mockResolvedValueOnce(toolUse([tshBody, liverBody]));
    const usage: FindingsUsage = stepUsage("claude-haiku-5-5");

    expect(await writeFindings([tsh, liver], [visit], usage)).toEqual([
      {
        kind: "change",
        severity: "watch",
        title: tsh.title,
        citedKeys: ["tsh"],
        citedStudyIds: [],
        rank: 0,
        body: `${tshBody.body} ${tsh.note}`,
      },
      {
        kind: "link",
        severity: "watch",
        title: liver.title,
        citedKeys: ["triglycerides", "hba1c"],
        citedStudyIds: [studyId],
        rank: 1,
        body: liverBody.body,
      },
    ]);
    expect(usage).toMatchObject({ inputTokens: 400, outputTokens: 80, dropped: 0 });
    expect(usage.rejections).toBeUndefined();
    expect(request(0).system[0]?.cache_control).toEqual({ type: "ephemeral" });
    const [facts] = request(0).messages[0]!.content;
    expect(facts?.text).toContain("Finding 2: Fatty liver on the scan");
    expect(facts?.text).toContain("Cite list: triglycerides, hba1c, study_1");
    expect(facts?.text).not.toContain(studyId);
  });

  test("a rejected body is sent back alone and its new version is kept", async () => {
    edge.create
      .mockResolvedValueOnce(toolUse([{ ...tshBody, body: "TSH is high; retest it." }, liverBody]))
      .mockResolvedValueOnce(toolUse([tshBody]));
    const usage: FindingsUsage = stepUsage("claude-haiku-5-5");

    const findings = await writeFindings([tsh, liver], [visit], usage);

    expect(findings.map(({ title }) => title)).toEqual([tsh.title, liver.title]);
    expect(usage.rejections).toEqual(["semicolon"]);
    expect(request(1).messages[0]!.content[1]?.text).toContain(
      "Call write_findings with only these findings: 1.",
    );
  });

  test("a body that fails twice drops its finding and keeps the others", async () => {
    const uncited = { ...tshBody, citedKeys: [] };
    edge.create
      .mockResolvedValueOnce(toolUse([uncited, liverBody]))
      .mockResolvedValueOnce(toolUse([uncited]));
    const usage: FindingsUsage = stepUsage("claude-haiku-5-5");

    const findings = await writeFindings([tsh, liver], [visit], usage);

    expect(findings.map(({ title }) => title)).toEqual([liver.title]);
    expect(usage).toMatchObject({ rejections: ["uncited", "uncited"], dropped: 1 });
  });

  test("a body Claude leaves out counts as missing and gets the retry", async () => {
    edge.create
      .mockResolvedValueOnce(toolUse([liverBody]))
      .mockResolvedValueOnce(toolUse([tshBody]));
    const usage: FindingsUsage = stepUsage("claude-haiku-5-5");

    expect(await writeFindings([tsh, liver], [visit], usage)).toHaveLength(2);
    expect(usage.rejections).toEqual(["missing"]);
  });

  test("no drafts make no call", async () => {
    expect(await writeFindings([], [visit], stepUsage("claude-haiku-5-5"))).toEqual([]);
    expect(edge.create).not.toHaveBeenCalled();
  });
});
