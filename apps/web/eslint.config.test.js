import { ESLint } from "eslint";
import { expect, test } from "vitest";

test("a route that imports a module's internals fails import/no-restricted-paths", async () => {
  const eslint = new ESLint({ cwd: import.meta.dirname });
  const code =
    'import { HealthStatus } from "@/modules/health/components/health-status";\n\nexport const x = HealthStatus;\n';
  const [result] = await eslint.lintText(code, { filePath: "src/routes/x.tsx" });
  expect(result?.messages.map((m) => m.ruleId)).toContain("import/no-restricted-paths");
}, 30_000);
