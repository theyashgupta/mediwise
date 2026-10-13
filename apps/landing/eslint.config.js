import base from "@mediwise/config/eslint";
import { defineConfig } from "eslint/config";

export default defineConfig(
  base,
  { ignores: [".next/**", "out/**", "next-env.d.ts"] },
  {
    files: [
      "src/app/**/page.tsx",
      "src/app/**/layout.tsx",
      "src/app/sitemap.ts",
      "src/app/robots.ts",
    ],
    rules: { "import/no-default-export": "off" },
  },
);
