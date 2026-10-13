import { beforeEach, describe, expect, test, vi } from "vitest";
import { stepUsage } from "../extraction/index.js";
import { type HindiUsage, validateHindi, writeHindi } from "./narrative.hindi.js";

const edge = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("../../lib/anthropic.js", () => ({ anthropic: { messages: { create: edge.create } } }));

const english = [
  "LDL cholesterol is 162 mg/dL, which has risk status.",
  "Vitamin D may be low. Retest it in 8 to 12 weeks.",
];
const names = ["LDL cholesterol", "Vitamin D"];
const hindi = [
  { n: 1, text: "LDL cholesterol 162 mg/dL है, जो जोखिम स्थिति में है।" },
  { n: 2, text: "Vitamin D कम हो सकता है। 8 से 12 हफ़्ते में इसका दोबारा टेस्ट करें।" },
];
const long = `${Array.from({ length: 20 }, () => "शब्द").join(" ")} LDL cholesterol 162 mg/dL है।`;

function toolUse(items: { n: number; text: string }[]) {
  return {
    content: [{ type: "tool_use", id: "toolu_1", name: "write_hindi", input: { items } }],
    stop_reason: "tool_use",
    usage: { input_tokens: 800, output_tokens: 300 },
  };
}

describe("validateHindi", () => {
  test("a Hindi text that keeps names, numbers and hedges passes", () => {
    expect(validateHindi(english, hindi, names)).toEqual([]);
  });

  test("a sentence over 20 Devanagari words is rejected", () => {
    const problems = validateHindi(english, [{ n: 1, text: long }, hindi[1]!], names);
    expect(problems).toEqual([{ index: 0, message: expect.stringContaining("21 Hindi words") }]);
  });

  test("a semicolon, a translated marker name and an upgraded hedge are rejected", () => {
    const problems = validateHindi(
      english,
      [
        { n: 1, text: "एलडीएल कोलेस्ट्रॉल 162 mg/dL है; यह जोखिम है।" },
        { n: 2, text: "Vitamin D कम है। 8 से 12 हफ़्ते में दोबारा टेस्ट करें।" },
      ],
      names,
    );
    expect(problems.map(({ index, message }) => `${index} ${message}`)).toEqual([
      "0 It has a semicolon.",
      '0 It drops "LDL".',
      '0 It drops "LDL cholesterol".',
      "1 It drops a hedge.",
    ]);
  });

  test("a missing item and a diagnosis word are rejected", () => {
    expect(validateHindi(english, [hindi[0]!], names)).toEqual([
      { index: 1, message: "Write item 2 exactly once." },
    ]);
    const diagnosis = { n: 1, text: "LDL cholesterol 162 mg/dL है, यह एक बीमारी है।" };
    expect(validateHindi(english, [diagnosis, hindi[1]!], names)).toEqual([
      { index: 0, message: "It uses a diagnosis word." },
    ]);
  });
});

describe("writeHindi", () => {
  beforeEach(() => edge.create.mockReset());

  test("a passing call returns each English text with its Hindi text and counts the tokens", async () => {
    edge.create.mockResolvedValueOnce(toolUse(hindi));
    const usage = stepUsage("claude-haiku-5-5");
    const result = await writeHindi(english, names, usage);
    expect(result).toEqual(new Map([[english[0], hindi[0]!.text], [english[1], hindi[1]!.text]]));
    expect(usage).toMatchObject({ inputTokens: 800, outputTokens: 300 });
  });

  test("a rejected item is sent back alone, and the fix takes its place", async () => {
    edge.create
      .mockResolvedValueOnce(toolUse([{ n: 1, text: long }, hindi[1]!]))
      .mockResolvedValueOnce(toolUse([hindi[0]!]));
    const result = await writeHindi(english, names, stepUsage("claude-haiku-5-5"));
    expect(result?.get(english[0]!)).toBe(hindi[0]!.text);
    expect(edge.create).toHaveBeenCalledTimes(2);
    const retry = edge.create.mock.calls[1]![0] as { messages: { content: { text: string }[] }[] };
    expect(retry.messages[0]!.content[1]!.text).toContain("exactly these numbers: 1.");
  });

  test("a third rejection returns null and records each rule, so the report stays in English", async () => {
    edge.create
      .mockResolvedValueOnce(toolUse([{ n: 1, text: long }, hindi[1]!]))
      .mockResolvedValueOnce(toolUse([{ n: 1, text: long }]))
      .mockResolvedValueOnce(toolUse([{ n: 1, text: long }]));
    const usage: HindiUsage = stepUsage("claude-haiku-5-5");
    expect(await writeHindi(english, names, usage)).toBeNull();
    expect(edge.create).toHaveBeenCalledTimes(3);
    expect(usage.rejections).toEqual(Array(3).fill("It has a sentence of 21 Hindi words"));
  });
});
