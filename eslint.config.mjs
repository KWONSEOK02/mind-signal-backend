import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

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
      "prettier": prettierPlugin,
    },
    rules: {
      // 1. 코드 품질(Logic) 관련 규칙들
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { "argsIgnorePattern": "^_" }
      ],
      "camelcase": ["error", { "properties": "always" }],
      
      // 2. Prettier와 통합: 스타일 위반 시 에러 표시
      "prettier/prettier": "error", 
      
    },
  },
  // 3. 마지막에 추가하여 Prettier와 충돌할 수 있는 모든 ESLint 스타일 규칙을 비활성화
  prettierConfig, 
];