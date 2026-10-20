import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

// Next 16 bundles react-hooks v6, whose React-Compiler-era rules
// (`set-state-in-effect`, etc.) flag pre-existing intentional patterns
// (client-only window reads, loading-state resets before fetches).
// Kept at "warn" to match `exhaustive-deps` rather than forcing a
// behavioral refactor at lint-setup time.
const config = [
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "warn",
      "@next/next/no-html-link-for-pages": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  { ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "**/*.test.cjs", "scripts/**"] },
]

export default config
