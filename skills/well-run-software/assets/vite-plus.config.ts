// Strictest Vite+ setup: Oxlint (type-aware, every finding an error), Oxfmt, staged-file fixes.
// Merge these blocks into the project's vite.config.ts. Needs: vite-plus (Node 22.18+ or 24.11+).
// Add 'react', 'jsx-a11y' (React) or 'vue' to plugins for UI code.
import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: {
    plugins: ["oxc", "typescript", "unicorn", "import"],
    categories: {
      correctness: "error",
      suspicious: "error",
      perf: "error",
    },
    options: {
      // Type-aware rules (no-floating-promises and friends) plus a full type check, so
      // `vp check` replaces `tsc --noEmit`.
      typeAware: true,
      typeCheck: true,
    },
    // Generated, vendored or copied-in code you do not maintain.
    ignorePatterns: ["dist/**", "build/**", "coverage/**", ".output/**", "<vendored-dir>/**"],
    rules: {
      "typescript/no-explicit-any": "error",
      "typescript/no-non-null-assertion": "error",
      "typescript/switch-exhaustiveness-check": "error",
      "typescript/consistent-type-imports": "error",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      eqeqeq: ["error", "smart"],
    },
    overrides: [
      {
        // Tests assert on known fixtures.
        files: ["**/*.test.*", "**/*.spec.*"],
        rules: { "typescript/no-non-null-assertion": "off" },
      },
    ],
  },
  // Oxfmt defaults match Prettier's. Set options here only if the codebase already has a style.
  fmt: {
    ignorePatterns: ["dist/**", "coverage/**", "<vendored-dir>/**"],
  },
  // Pre-commit: fix and format staged files. Fails the commit only on what cannot be auto-fixed.
  staged: {
    "*": "vp check --fix",
  },
});
