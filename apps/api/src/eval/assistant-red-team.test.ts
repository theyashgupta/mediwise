import { describe, expect, test } from "vitest";
import { buildContext } from "../modules/assistant/index.js";
import {
  checkOutcome,
  denseProfile,
  injectedLine,
  redTeam,
  workupProfile,
} from "./assistant-red-team.js";

describe("red-team profiles", () => {
  test("the dense profile has 12 reports, an HbA1c history and no ApoB", () => {
    const { text, refs } = buildContext(denseProfile());
    expect(text).toContain("Reports, oldest first (12 in total):");
    expect(refs.has("R12:hba1c")).toBe(true);
    expect([...refs.keys()].some((ref) => ref.endsWith(":apolipoprotein_b"))).toBe(false);
  });

  test("the workup profile has a settled scan, an episode, an HbA1c retest date and the injected line", () => {
    const { text, refs, settled } = buildContext(workupProfile());
    expect(settled).toHaveLength(1);
    expect(refs.get("E1")?.fact).toMatch(/^E1: 3 Feb 2025 to 17 Mar 2025\./);
    expect(text).toMatch(/HbA1c: \d+ \w{3} \d{4} \(R\d+:hba1c\)/);
    expect(text).toContain(injectedLine);
  });

  test("the list holds the 30 questions of the research doc in order", () => {
    expect(redTeam.map(({ number }) => number)).toEqual(
      Array.from({ length: 30 }, (_, index) => index + 1),
    );
  });
});

describe("checkOutcome", () => {
  const first = redTeam[0]!;

  test("an expected outcome with the cited marker and value passes", () => {
    expect(
      checkOutcome(first, {
        kind: "answer",
        sentences: [{ text: "Your HbA1c was 5.6 % on 13 Oct 2026.", cites: ["R12:hba1c"] }],
      }),
    ).toBeUndefined();
  });

  test("a wrong outcome, a missing cite, missing text or a banned phrase fails with the reason", () => {
    expect(checkOutcome(first, { kind: "fallback", sentences: [] })).toBe(
      "got fallback, expected answer",
    );
    expect(
      checkOutcome(first, {
        kind: "answer",
        sentences: [{ text: "Your HbA1c was 5.6 %.", cites: ["R12"] }],
      }),
    ).toMatch(/^no cite matches/);
    expect(
      checkOutcome(first, {
        kind: "answer",
        sentences: [{ text: "Your HbA1c is in the report.", cites: ["R12:hba1c"] }],
      }),
    ).toMatch(/^text misses/);
    const percent = redTeam.find(({ number }) => number === 23)!;
    expect(
      checkOutcome(percent, {
        kind: "answer",
        sentences: [{ text: "Your LDL fell by 19 %.", cites: ["R7:ldl_cholesterol"] }],
      }),
    ).toMatch(/^text has/);
  });

  test("a gate outcome is named by its kind", () => {
    const dose = redTeam.find(({ number }) => number === 6)!;
    expect(checkOutcome(dose, { kind: "gate", refuseKind: "treatment", sentences: [] })).toBe(
      undefined,
    );
  });
});
