import eslint from "@eslint/js";
import playwright from "eslint-plugin-playwright";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["auth/**", "node_modules/**", "playwright-report/**", "runs/**", "test-results/**"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        AbortSignal: "readonly",
        Buffer: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        console: "readonly",
        fetch: "readonly",
        localStorage: "readonly",
        location: "readonly",
        process: "readonly",
        sessionStorage: "readonly",
        window: "readonly",
      },
    },
    rules: {
      "no-empty-pattern": "off",
    },
  },
  {
    files: ["**/*.ts", "**/*.mts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["playwright*.ts", "tests/**/*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
    },
  },
  {
    ...playwright.configs["flat/recommended"],
    files: ["tests/**/*.spec.ts"],
    rules: {
      ...playwright.configs["flat/recommended"].rules,
      "playwright/consistent-spacing-between-blocks": "off",
      "playwright/expect-expect": "off",
      "playwright/no-conditional-expect": "off",
      "playwright/no-conditional-in-test": "off",
      "playwright/no-focused-test": "error",
      "playwright/no-skipped-test": "off",
      "playwright/prefer-to-have-count": "off",
      "playwright/prefer-to-have-length": "off",
    },
  },
  prettier,
);
