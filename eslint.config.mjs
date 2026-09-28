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
    // Componente scoase din site, păstrate ca să poată fi recuperate. Nu
    // intră în nicio pagină și nu se compilează (sunt excluse și din
    // tsconfig). Verificate ca și cum ar fi în folosință, ar raporta erori
    // pentru importuri și variabile CSS care nu mai există — zgomot despre
    // cod pe care nimeni nu-l rulează. Vezi arhiva/README.md.
    "arhiva/**",
  ]),
]);

export default eslintConfig;
