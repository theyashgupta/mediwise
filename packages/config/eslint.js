import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import importPlugin from "eslint-plugin-import";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import { configs as tseslintConfigs } from "typescript-eslint";

export default defineConfig(
  { ignores: ["**/dist/**", "**/routeTree.gen.ts"] },
  js.configs.recommended,
  tseslintConfigs.recommended,
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  {
    files: ["**/*.tsx"],
    extends: [react.configs.flat.recommended, react.configs.flat["jsx-runtime"]],
    settings: { react: { version: "detect" } },
  },
  reactHooks.configs.flat.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
    },
    settings: { "import/resolver": { typescript: true } },
    rules: {
      "no-console": "error",
      "import/no-unresolved": "off",
      "import/no-duplicates": "error",
      "import/first": "error",
      "import/newline-after-import": "error",
    },
  },
  {
    files: ["src/**"],
    ignores: ["src/routes/**", "src/components/ui/**"],
    rules: { "import/no-default-export": "error" },
  },
);
