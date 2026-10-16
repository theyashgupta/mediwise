import { defineConfig } from "vitest/config";
import unit from "./vitest.config.ts";
import { testDatabaseUrl } from "./vitest.db.setup.ts";

export default defineConfig({
  test: {
    name: "db",
    include: ["src/**/*.db.test.ts"],
    globalSetup: "./vitest.db.setup.ts",
    fileParallelism: false,
    sequence: { groupOrder: 1 },
    env: {
      ...unit.test?.env,
      DATABASE_URL: testDatabaseUrl,
      CLAUDE_STUB: "true",
      ANTHROPIC_API_KEY: "",
      CLAUDE_MONTHLY_CAP_CENTS: "100",
    },
  },
});
