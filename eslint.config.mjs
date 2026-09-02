import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Scripturile de import rulează direct în Node, nu trec prin bundler-ul
    // Next. Sunt CommonJS și folosesc `require()` legitim; regulile pentru
    // codul TypeScript din `src` le raportau ca șase erori de lint care nu
    // aveau ce să repare acolo.
    "tools/**",
  ]),
]);

export default eslintConfig;
