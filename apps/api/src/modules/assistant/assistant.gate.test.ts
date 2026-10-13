import { assistantRefusalKinds } from "@mediwise/shared";
import { describe, expect, test } from "vitest";
import { refusalCopy, unavailableCopy } from "./assistant.copy.js";
import { gateQuestion } from "./assistant.gate.js";

describe("gateQuestion", () => {
  test.each([
    "I have chest pain. Is my ECG okay?",
    "I can't breathe properly since morning",
    "I cannot breathe",
    "I am short of breath after my report",
    "I fainted today",
    "I passed out at work",
    "There is heavy bleeding",
    "I am coughing up blood",
    "I feel like hurting myself.",
    "I want to harm myself",
    "I am thinking about suicide",
    "I want to end my life",
    "CHEST PAIN now",
  ])("%s is an emergency", (question) => {
    expect(gateQuestion(question)).toBe("emergency");
  });

  test.each([
    "What dose of vitamin D should I take?",
    "What is the right dosage for my thyroid tablet?",
    "How much vitamin B12 should I take?",
    "How many iron tablets can I take a day?",
  ])("%s is a dose question", (question) => {
    expect(gateQuestion(question)).toBe("treatment");
  });

  test.each([
    "What was my HbA1c in my last report?",
    "Is my LDL going up?",
    "Will I get a heart attack?",
    "What is my glucose in mmol/L?",
    "How many reports do I have this year?",
    "Should I worry about my vitamin D?",
    "Which reports are in my thyroid workup?",
  ])("%s passes the gate", (question) => {
    expect(gateQuestion(question)).toBeUndefined();
  });

  test("an emergency wins over a dose question", () => {
    expect(gateQuestion("I have chest pain, what dose of aspirin?")).toBe("emergency");
  });
});

describe("fixed copy", () => {
  test("every refusal kind has copy", () => {
    expect(Object.keys(refusalCopy).toSorted()).toEqual([...assistantRefusalKinds].toSorted());
  });

  test.each([...Object.values(refusalCopy), unavailableCopy])(
    "%s follows the copy rules: 20 words or fewer per sentence and no semicolon",
    (copy) => {
      expect(copy).not.toContain(";");
      for (const sentence of copy.split(/(?<=\.)\s+/)) {
        expect(sentence.split(/\s+/).length).toBeLessThanOrEqual(20);
      }
    },
  );

  test("the emergency copy names 112 and Tele-MANAS on 14416", () => {
    expect(refusalCopy.emergency).toBe(
      "MediWise cannot help with symptoms. If you feel very unwell, call 112 now. If you think about harming yourself, call Tele-MANAS on 14416.",
    );
  });
});
