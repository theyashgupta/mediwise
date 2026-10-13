import { ESLint } from "eslint";
import { expect, test } from "vitest";

test("a service that imports app.ts and Hono fails the boundary rules", async () => {
  const eslint = new ESLint({ cwd: import.meta.dirname });
  const code =
    'import { Hono } from "hono";\nimport { app } from "../../app.js";\n\nexport const x = [Hono, app];\n';
  const [result] = await eslint.lintText(code, { filePath: "src/modules/health/x.service.ts" });
  expect(result?.messages.map((m) => m.ruleId)).toEqual(
    expect.arrayContaining(["import/no-restricted-paths", "no-restricted-imports"]),
  );
}, 30_000);
