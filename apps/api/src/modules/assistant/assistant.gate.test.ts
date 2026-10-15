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
    "I can’t breathe",
    "I want to  kill  myself",
    "I want to die",
    "I overdosed on my pills",
    "There is pain in my chest",
    "I have trouble breathing",
    "I can\u200Bnot breathe",
  ])("%s is an emergency", (question) => {
    expect(gateQuestion(question)).toBe("emergency");
  });

  test.each([
    "What dose of vitamin D should I take?",
    "What is the right dosage for my thyroid tablet?",
    "How much vitamin B12 should I take?",
    "How many iron tablets can I take a day?",
    "Is 1000 mg of vitamin C okay?",
    "How many mg?",
    "How much mcg of B12 is right for me?",
    "How many ug of folate?",
    "How much ml of syrup for my son?",
    "How many IU of vitamin D?",
    "How many units of insulin?",
    "How many tablets a day?",
    "How many capsules of fish oil?",
    "How much drops for the eyes?",
    "Is 60000 IU of vitamin D okay?",
    "Is 1500 mcg of B12 okay?",
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
    "My glucose was 110 mg/dL, is that in range?",
    "How much is my glucose in mg/dL?",
    "How many reports show my TSH in mIU/L?",
    "There is a faint line on my test strip",
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

  test("the emergency copy names the local emergency number first, then 112 and Tele-MANAS for India", () => {
    expect(refusalCopy.emergency).toBe(
      "MediWise cannot help with symptoms. If you feel very unwell or think about harming yourself, call your local emergency number now. In India, call 112. For mental health help in India, call Tele-MANAS on 14416.",
    );
  });
});
