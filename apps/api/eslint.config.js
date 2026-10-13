import base from "@mediwise/config/eslint";
import { readdirSync } from "node:fs";
import { defineConfig } from "eslint/config";

const modules = readdirSync(new URL("./src/modules", import.meta.url), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

export default defineConfig(
  base,
  {
    rules: {
      "import/no-restricted-paths": [
        "error",
        {
          basePath: import.meta.dirname,
          zones: [
            ...modules.map((name) => ({
              target: `./src/modules/${name}`,
              from: "./src/modules",
              except: [
                `./${name}`,
                ...modules.filter((other) => other !== name).map((other) => `./${other}/index.ts`),
              ],
              message: "Import another module only through its index.ts.",
            })),
            {
              target: "./src/modules",
              from: ["./src/app.ts", "./src/index.ts", "./src/jobs"],
              message: "Modules may not import app.ts, index.ts or jobs.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/**/*.routes.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["drizzle-orm", "drizzle-orm/*"],
              message: "Routes call services, not Drizzle.",
            },
            { group: ["*.repo.js"], message: "Routes call services, not repos." },
          ],
        },
      ],
    },
  },
  {
    files: ["src/**/*.service.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["hono", "hono/*", "@hono/*"],
              message: "Services may not use Hono. Throw AppError instead.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/middleware/logger.ts"],
    rules: { "no-console": "off" },
  },
);
