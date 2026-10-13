import { derived, type EngineProfile, markers, runEngine } from "@mediwise/engine";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { stepUsage } from "../extraction/index.js";
import {
  narrativeExamples,
  type NarrativeUsage,
  validateNarrative,
  writeNarrative,
} from "./narrative.service.js";

const edge = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("../../lib/anthropic.js", () => ({ anthropic: { messages: { create: edge.create } } }));

const profile: EngineProfile = { ageYears: 38, sex: "male", ancestry: "south_asian" };
const output = runEngine({
  profile,
  values: [
    { rawName: "TSH", markerKey: "tsh", value: 5.41, unit: "µIU/mL" },
    { rawName: "Free T4", markerKey: "free_t4", value: 1.49, unit: "ng/dL" },
    { rawName: "HbA1c", markerKey: "hba1c", value: 5.2, unit: "%" },
  ],
});
const allowed = new Set(["tsh", "free_t4", "hba1c", "subclinical_hypothyroidism"]);

type Sentence = { section: string; text: string; citedKeys: string[] };

const headline = { section: "The headline", text: "Most markers sit in range.", citedKeys: [] };
const stands = {
  section: "What stands out",
  text: "Your TSH is above range while free T4 is optimal.",
  citedKeys: ["subclinical_hypothyroidism", "tsh"],
};
const good = { section: "What looks good", text: "Your HbA1c is optimal.", citedKeys: ["hba1c"] };
const next = {
  section: "What to do next",
  text: "Retest TSH and free T4 in 8 to 12 weeks.",
  citedKeys: ["tsh", "free_t4"],
};
const valid = [headline, stands, good, next];
const long = { ...stands, text: Array.from({ length: 21 }, () => "word").join(" ") };

function draft(sentences: Sentence[]) {
  return sentences as Parameters<typeof validateNarrative>[0];
}

function toolUse(sentences: Sentence[]) {
  return {
    content: [{ type: "tool_use", id: "toolu_1", name: "write_narrative", input: { sentences } }],
    stop_reason: "tool_use",
    usage: { input_tokens: 500, output_tokens: 100 },
  };
}

type Request = {
  model: string;
  tools: { input_schema: unknown }[];
  messages: { content: { text: string; cache_control?: unknown }[] }[];
};

function request(call: number) {
  return edge.create.mock.calls[call]?.[0] as Request;
}

beforeEach(() => edge.create.mockReset());

describe("validateNarrative", () => {
  test("a draft that cites only keys in the report passes", () => {
    expect(validateNarrative(draft(valid), allowed)).toEqual([]);
  });

  test("each broken sentence is rejected with its index and rule", () => {
    const broken = [
      headline,
      long,
      { ...stands, text: "TSH is high; retest it." },
      { ...stands, text: "You have a thyroid disease." },
      { ...good, citedKeys: [] },
      { ...good, citedKeys: ["ldl_cholesterol"] },
    ];
    expect(
      validateNarrative(draft(broken), allowed).map(({ rule, index }) => [rule, index]),
    ).toEqual([
      ["long_sentence", 1],
      ["semicolon", 2],
      ["diagnosis_word", 3],
      ["uncited", 4],
      ["unknown_key", 5],
    ]);
  });

  test("a draft with no headline or more than 12 sentences is rejected as a whole", () => {
    const crowded = Array.from({ length: 13 }, () => good);
    expect(validateNarrative(draft(crowded), allowed)).toEqual([
      { rule: "sections", message: "Write a headline sentence." },
      { rule: "too_many_sentences", message: "Write 12 sentences or fewer. You wrote 13." },
    ]);
  });

  test("the example narratives in the prompt pass every rule", () => {
    const catalog = new Set([
      ...[...markers, ...derived].map((entry) => entry.key),
      "metabolic_lipid_triad",
    ]);
    for (const example of narrativeExamples) {
      expect(validateNarrative(example, catalog)).toEqual([]);
    }
  });
});

describe("writeNarrative", () => {
  test("Claude gets the report key list, cached, and the sentences come back grouped by section", async () => {
    edge.create.mockResolvedValueOnce(toolUse([headline, good, stands, next]));
    const usage: NarrativeUsage = stepUsage("claude-haiku-5-5");

    expect(await writeNarrative(output, profile, usage)).toEqual({
      sections: [
        { heading: "The headline", sentences: [{ text: headline.text, markerKeys: [] }] },
        {
          heading: "What stands out",
          sentences: [{ text: stands.text, markerKeys: stands.citedKeys }],
        },
        { heading: "What looks good", sentences: [{ text: good.text, markerKeys: ["hba1c"] }] },
        {
          heading: "What to do next",
          sentences: [{ text: next.text, markerKeys: next.citedKeys }],
        },
      ],
    });
    expect(usage).toMatchObject({ inputTokens: 500, outputTokens: 100 });
    expect(usage.rejections).toBeUndefined();
    const [facts] = request(0).messages[0]!.content;
    expect(facts?.cache_control).toEqual({ type: "ephemeral" });
    expect(facts?.text).toContain(
      "tsh | Thyroid stimulating hormone | 5.41 µIU/mL | watch | 0.45 to 4.12",
    );
    expect(facts?.text).toContain("subclinical_hypothyroidism | Subclinical hypothyroidism");
    expect(JSON.stringify(request(0).tools[0]?.input_schema)).toContain(
      '"enum":["tsh","free_t4","hba1c","estimated_average_glucose","subclinical_hypothyroidism"]',
    );
    expect(request(0).model).toBe("claude-haiku-5-5");
  });

  test("a retry sends back only the failed sentence and puts the new version in its place", async () => {
    const fix = {
      section: "What stands out",
      text: "Your TSH is above range.",
      citedKeys: ["tsh"],
    };
    edge.create
      .mockResolvedValueOnce(toolUse([headline, long, good, next]))
      .mockResolvedValueOnce(toolUse([fix]));
    const usage: NarrativeUsage = stepUsage("claude-haiku-5-5");

    const narrative = await writeNarrative(output, profile, usage);

    expect(narrative?.sections[1]?.sentences).toEqual([{ text: fix.text, markerKeys: ["tsh"] }]);
    expect(usage.rejections).toEqual(["long_sentence"]);
    const retry = request(1).messages[0]!.content;
    expect(retry[0]).toEqual(request(0).messages[0]!.content[0]);
    expect(retry[1]?.text).toContain(`1. [What stands out] "${long.text}"`);
    expect(retry[1]?.text).not.toContain(good.text);
    expect(retry[1]?.text).toContain("exactly 1 sentences");
  });

  test("a draft over the sentence cap is written again in full", async () => {
    edge.create
      .mockResolvedValueOnce(toolUse([headline, ...Array.from({ length: 12 }, () => good)]))
      .mockResolvedValueOnce(toolUse(valid));
    const usage: NarrativeUsage = stepUsage("claude-haiku-5-5");

    expect(await writeNarrative(output, profile, usage)).not.toBeNull();
    expect(usage.rejections).toEqual(["too_many_sentences"]);
    expect(request(1).messages[0]!.content[1]?.text).toContain("You wrote 13.");
  });

  test("a second rejection returns null and logs both reasons", async () => {
    const unknown = { ...good, citedKeys: ["ldl_cholesterol"] };
    edge.create
      .mockResolvedValueOnce(toolUse([headline, unknown]))
      .mockResolvedValueOnce(toolUse([unknown]));
    const usage: NarrativeUsage = stepUsage("claude-haiku-5-5");

    expect(await writeNarrative(output, profile, usage)).toBeNull();
    expect(edge.create).toHaveBeenCalledTimes(2);
    expect(usage.rejections).toEqual(["unknown_key", "unknown_key"]);
  });

  test("a fix with the wrong number of sentences returns null", async () => {
    edge.create
      .mockResolvedValueOnce(toolUse([headline, long, good]))
      .mockResolvedValueOnce(toolUse([stands, good]));
    const usage: NarrativeUsage = stepUsage("claude-haiku-5-5");

    expect(await writeNarrative(output, profile, usage)).toBeNull();
    expect(usage.rejections).toEqual(["long_sentence", "invalid_call"]);
  });
});
