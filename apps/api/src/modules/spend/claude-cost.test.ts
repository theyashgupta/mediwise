import { expect, test } from "vitest";
import { stepCostCents } from "./claude-cost.js";

const none = { inputTokens: 0, cachedInputTokens: 0, cacheWriteTokens: 0, outputTokens: 0 };
const million = 1_000_000;

test("a Haiku 5.5 cache read costs 0.1 times input, 1 cent per million tokens", () => {
  expect(stepCostCents({ ...none, model: "claude-haiku-5-5", cachedInputTokens: million })).toBe(1);
});

test("a Sonnet 5.5 cache read costs 0.05 times input, 10 cents per million tokens", () => {
  expect(stepCostCents({ ...none, model: "claude-sonnet-5-5", cachedInputTokens: million })).toBe(
    10,
  );
});

test("a cache write costs 1.25 times input", () => {
  expect(stepCostCents({ ...none, model: "claude-haiku-5-5", cacheWriteTokens: million })).toBe(
    12.5,
  );
});

test("input and output use the list price per million tokens", () => {
  expect(
    stepCostCents({
      ...none,
      model: "claude-sonnet-5-5",
      inputTokens: million,
      outputTokens: million,
    }),
  ).toBe(1200);
});

test("an unknown model never costs less than Sonnet 5.5 for the same tokens", () => {
  const tokens = {
    inputTokens: 1000,
    cachedInputTokens: million,
    cacheWriteTokens: 500,
    outputTokens: 300,
  };
  const unknown = stepCostCents({ ...tokens, model: "claude-unknown" });
  expect(unknown).toBeGreaterThanOrEqual(stepCostCents({ ...tokens, model: "claude-sonnet-5-5" }));
  expect(stepCostCents({ ...none, model: "claude-unknown", cachedInputTokens: million })).toBe(20);
});
