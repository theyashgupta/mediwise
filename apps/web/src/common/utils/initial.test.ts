import { expect, test } from "vitest";
import { initial } from "./initial";

test("the initial is the first letter of the name", () => {
  expect(initial("Arjun Mehta")).toBe("A");
  expect(initial("李小龍")).toBe("李");
});

test("a Hindi name keeps its first letter whole, with the vowel sign", () => {
  expect(initial("दिव्या")).toBe("दि");
});

test("an emoji-first name takes the first letter after the emoji, never half an emoji", () => {
  expect(initial("🙂 Émile Ünal")).toBe("É");
  expect(initial("👩🏽‍⚕️ Meera")).toBe("M");
});

test("a name with no letter keeps its first grapheme whole", () => {
  expect(initial("🙂")).toBe("🙂");
  expect(initial("")).toBe("");
});
