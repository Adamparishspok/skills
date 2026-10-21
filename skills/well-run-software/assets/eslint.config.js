// Strictest TypeScript lint: type-aware rules, as errors. Needs: eslint @eslint/js typescript-eslint eslint-config-prettier
// Formatting stays with Prettier (format:check in CI); eslint-config-prettier turns off rules that fight it.
// Want formatting reported as lint errors instead? Swap eslintConfigPrettier for
// eslint-plugin-prettier/recommended (slower, and duplicates format:check).
import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default defineConfig(
  // Generated, vendored or copied-in code you do not maintain.
  { ignores: ["dist/", "build/", "coverage/", ".svelte-kit/", ".next/", ".astro/", "<vendored-dir>/"] },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      // Type-aware rules read the nearest tsconfig.json for each file.
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      eqeqeq: ["error", "smart"],
    },
  },
  {
    // Plain JS config files are not in a tsconfig, so type-aware rules cannot run on them.
    files: ["**/*.{js,mjs,cjs}"],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    // Tests assert on known fixtures, and framework templates (Svelte, Vue) do not carry
    // type narrowing from a template condition into the expression below it.
    files: ["**/*.test.*", "**/*.spec.*", "**/*.svelte", "**/*.vue"],
    rules: { "@typescript-eslint/no-non-null-assertion": "off" },
  },
  eslintConfigPrettier,
);
