import fs from "node:fs";
import path from "node:path";

/** Adună tot codul sursă într-un singur șir, ca să căutăm referințe în el. */
function aduna(dir, filtru) {
  let s = "";
  const mers = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) mers(p);
      else if (filtru.test(e.name)) s += fs.readFileSync(p, "utf8");
    }
  };
  mers(dir);
  return s;
}

function listeaza(dir) {
  const out = [];
  const mers = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) mers(p);
      else out.push(p.split(path.sep).join("/"));
    }
  };
  mers(dir);
  return out;
}

let sursa = aduna("src", /\.(tsx?|mjs|css|json)$/);
sursa += fs.readFileSync("next.config.ts", "utf8");
for (const d of ["tools", "scripts", ".github"]) {
  if (fs.existsSync(d)) sursa += aduna(d, /\.(mjs|js|ts|php|yml|yaml)$/);
}

const kb = (f) => (fs.statSync(f).size / 1024).toFixed(0);

// ── 1. Fișiere din public/ pe care nu le pomenește nimeni ──
const fisiere = listeaza("public");
const orfane = fisiere.filter((f) => {
  const nume = path.basename(f);
  const faraExt = nume.replace(/\.[^.]+$/, "");
  return !sursa.includes(nume) && !sursa.includes(faraExt);
});
let total = 0;
console.log(`\n═══ public/: ${orfane.length} nereferite din ${fisiere.length} ═══`);
for (const f of orfane) {
  total += Number(kb(f));
  console.log(`  ${kb(f).padStart(6)} KB  ${f}`);
}
console.log(`  ${String(total).padStart(6)} KB  TOTAL`);

// ── 2. Clase proprii din globals.css pe care nu le folosește nimeni ──
const css = fs.readFileSync("src/app/globals.css", "utf8");
const codTsx = aduna("src", /\.tsx?$/);
const clase = new Set();
for (const m of css.matchAll(/^\.([a-z][a-z0-9-]*)/gim)) clase.add(m[1]);
for (const m of css.matchAll(/^@utility\s+([a-z][a-z0-9-]*)/gim)) clase.add(m[1]);
const claseMoarte = [...clase].filter((c) => !codTsx.includes(c) && !css.includes(`"${c}"`));
console.log(`\n═══ clase CSS proprii, nefolosite în .tsx: ${claseMoarte.length} ═══`);
for (const c of claseMoarte) console.log(`  .${c}`);

// ── 3. Variabile CSS declarate și niciodată citite ──
const declarate = new Set([...css.matchAll(/^\s*(--[a-z][a-z0-9-]*)\s*:/gim)].map((m) => m[1]));
const totCod = css + codTsx;
const varMoarte = [...declarate].filter((v) => {
  const utilizari = totCod.split(`var(${v})`).length - 1;
  // `--color-*` din @theme devin utilitare Tailwind (bg-fg, text-muted…), deci
  // nu se citesc prin var(); se caută după sufix.
  if (v.startsWith("--color-")) return !codTsx.includes(v.replace("--color-", ""));
  return utilizari === 0 && !codTsx.includes(v);
});
console.log(`\n═══ variabile CSS declarate și necitite: ${varMoarte.length} ═══`);
for (const v of varMoarte) console.log(`  ${v}`);

// ── 4. Exporturi din src/lib pe care nu le importă nimeni ──
console.log(`\n═══ exporturi din src/lib nefolosite ═══`);
for (const f of listeaza("src/lib")) {
  const s = fs.readFileSync(f, "utf8");
  const altele = listeaza("src")
    .filter((x) => x !== f && /\.tsx?$/.test(x))
    .map((x) => fs.readFileSync(x, "utf8"))
    .join("");
  const nume = [...s.matchAll(/^export (?:const|function|type|async function) ([A-Za-z_][A-Za-z0-9_]*)/gm)].map(
    (m) => m[1],
  );
  const moarte = nume.filter((n) => !altele.includes(n));
  if (moarte.length) console.log(`  ${f}: ${moarte.join(", ")}`);
}
