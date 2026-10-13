import { ESLint } from "eslint";
import { expect, test } from "vitest";
import config from "./eslint.js";

test("shared config lints TypeScript and flags unused variables", async () => {
  const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: config });
  const [result] = await eslint.lintText("const unused: number = 1;\n", { filePath: "x.ts" });
  expect(result?.messages.map((m) => m.ruleId)).toContain("@typescript-eslint/no-unused-vars");
}, 30_000);
