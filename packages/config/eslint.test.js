import { ESLint } from "eslint";
import { expect, test } from "vitest";
import config from "./eslint.js";

/** Loads the real ESLint config and its plugins, about 1.5 s alone and over 20 s on a loaded 8 GB Mac. */
test("shared config lints TypeScript and flags unused variables", async () => {
  const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: config });
  const [result] = await eslint.lintText("const unused: number = 1;\n", { filePath: "x.ts" });
  expect(result?.messages.map((m) => m.ruleId)).toContain("@typescript-eslint/no-unused-vars");
}, 30_000);
