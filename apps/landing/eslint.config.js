import base from "@mediwise/config/eslint";
import { defineConfig } from "eslint/config";

const crossAppImports = {
  regex: "(^|/)(apps|\\.\\.)/(web|landing|api|cms)/src/",
  message: "Never import another app's source. Move the shared code to a package.",
};

export default defineConfig(
  base,
  { ignores: [".next/**", "out/**", "next-env.d.ts"] },
  { rules: { "no-restricted-imports": ["error", { patterns: [crossAppImports] }] } },
  {
    files: [
      "src/app/**/page.tsx",
      "src/app/**/layout.tsx",
      "src/app/**/not-found.tsx",
      "src/app/sitemap.ts",
      "src/app/robots.ts",
    ],
    rules: { "import/no-default-export": "off" },
  },
);
