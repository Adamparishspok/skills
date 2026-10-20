// Strict TypeScript lint. Needs: eslint @eslint/js typescript-eslint eslint-config-prettier
// Formatting stays with Prettier (format:check in CI); eslint-config-prettier turns off rules that fight it.
// Want formatting reported as lint errors instead? Swap eslintConfigPrettier for
// eslint-plugin-prettier/recommended (slower, and duplicates format:check).
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  // Generated, vendored or copied-in code you do not maintain.
  { ignores: ["dist/", "build/", "coverage/", ".svelte-kit/", ".next/", "<vendored-dir>/"] },
  js.configs.recommended,
  tseslint.configs.strict,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    // Tests assert on known fixtures, and framework templates (Svelte, Vue) do not carry
    // type narrowing from a template condition into the expression below it.
    files: ["**/*.test.*", "**/*.spec.*", "**/*.svelte", "**/*.vue"],
    rules: { "@typescript-eslint/no-non-null-assertion": "off" },
  },
  eslintConfigPrettier,
);
