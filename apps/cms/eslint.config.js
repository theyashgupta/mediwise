import base from "@mediwise/config/eslint";
import { defineConfig } from "eslint/config";

export default defineConfig(
  base,
  {
    ignores: [
      ".next/**",
      "next-env.d.ts",
      "src/payload-types.ts",
      "src/migrations/**",
      "src/app/(payload)/admin/importMap.js",
    ],
  },
  {
    files: [
      "src/app/**/page.tsx",
      "src/app/**/layout.tsx",
      "src/app/**/not-found.tsx",
      "src/payload.config.ts",
    ],
    rules: { "import/no-default-export": "off" },
  },
);
