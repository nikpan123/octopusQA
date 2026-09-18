// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['tests/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Projekt celowo nie używa test.describe (grupowanie przez tagi) —
      // patrz README/audyt. Nie wymuszamy tej reguły.
      'playwright/require-top-level-describe': 'off',
    },
  },
  {
    rules: {
      // TypeScript (tsc --noEmit) już sprawdza niezdefiniowane identyfikatory
      // i zna typy/generyki, których base ESLint no-undef nie rozumie —
      // stąd fałszywe alarmy. Oficjalna rekomendacja typescript-eslint.
      'no-undef': 'off',
      // Wzorzec Playwrighta `base.extend<{}, Fixtures>()` używa pustego obiektu
      // celowo (brak dodatkowych fixture'ów page-scoped) — to nie jest błąd.
      '@typescript-eslint/no-empty-object-type': ['error', { allowObjectTypes: 'always' }],
    },
  },
  {
    ignores: ['node_modules/**', 'playwright-report/**', 'test-results/**', 'runs/**', 'docs/**'],
  },
);
