import tseslint from "typescript-eslint";
import eslint from "@eslint/js";
import globals from "globals";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import importPlugin from "eslint-plugin-import";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**"] },

  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,

  prettierRecommended,

  {
    plugins: {
      "simple-import-sort": simpleImportSort
    }
  },

  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2020
      },
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname
      }
    },
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json"
        }
      }
    },
    rules: {
      "@typescript-eslint/array-type": "error",
      "@typescript-eslint/consistent-type-assertions": "error",
      "@typescript-eslint/consistent-type-definitions": "error",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-member-accessibility": ["error", { accessibility: "explicit" }],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-shadow": ["error", { hoist: "all" }],
      "@typescript-eslint/no-unused-expressions": "error",
      "@typescript-eslint/no-use-before-define": ["error", { functions: false }],
      "@typescript-eslint/prefer-for-of": "error",
      "@typescript-eslint/unified-signatures": "error",
      "arrow-parens": ["off", "as-needed"],
      camelcase: "error",
      complexity: "off",
      "dot-notation": "error",
      "eol-last": "off",
      eqeqeq: ["error", "smart"],
      "guard-for-in": "off",
      "id-denylist": ["error", "any", "Number", "number", "String", "string", "Boolean", "boolean", "Undefined"],
      "id-match": "error",
      "linebreak-style": "off",
      "max-classes-per-file": ["error", 1],
      "new-parens": "off",
      "newline-per-chained-call": "off",
      "no-bitwise": "error",
      "no-caller": "error",
      "no-cond-assign": "error",
      "no-console": "off",
      "no-eval": "error",
      "no-invalid-this": "off",
      "no-multiple-empty-lines": "off",
      "no-new-wrappers": "error",
      "no-shadow": "off",
      "no-throw-literal": "error",
      "no-trailing-spaces": "off",
      "no-undef-init": "error",
      "no-underscore-dangle": "warn",
      "no-var": "error",
      "object-shorthand": "error",
      "one-var": ["error", "never"],
      "quote-props": "off",
      radix: "error",
      "sort-imports": "off",
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "import/no-duplicates": ["error", { "prefer-inline": false }],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" }
      ],
      "spaced-comment": "error"
    }
  }
);
