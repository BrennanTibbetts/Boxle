import js from "@eslint/js"
import reactPlugin from "eslint-plugin-react"
import reactHooksPlugin from "eslint-plugin-react-hooks"

export default [
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
          tsx: true
        },
      },
      globals: {
        document: "readonly",
        window: "readonly",
        navigator: "readonly",
        process: "readonly",
        console: "readonly",
        module: "readonly",
        require: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly"
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // React rules
      "react/jsx-uses-react": "error",
      "react/jsx-uses-vars": "error",
      "react/jsx-key": "error",
      "react/jsx-no-undef": "error",
      
      // React Hooks rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      
      // General JavaScript rules
      "no-unused-vars": "warn",
      // "no-console": "warn",
      "prefer-const": "error",
      
      // Enforce no semicolons
      "semi": ["error", "never"],
      "semi-spacing": ["error", { "before": false, "after": true }],
      "no-extra-semi": "error"
    }
  }
]