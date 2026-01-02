import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import globals from "globals";

export default [
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      "indent": ["error", 2],
      "quotes": ["error", "single"],
      "semi": ["error", "always"],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          "argsIgnorePattern": "^_" // 언더바(_)로 시작하는 인자는 검사에서 제외
        }
      ],
      "camelcase": ["error", { "properties": "always" }]
    },
  },
];