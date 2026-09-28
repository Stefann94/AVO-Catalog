#!/usr/bin/env node
/**
 * Pasul 2 din 3: datele OpenCart extrase → produsele și categoriile copiei.
 *
 *   node transforma.mjs [date/opencart-AAAA-LL-ZZ.json]
 *
 * Fără argument ia cel mai nou export din date/. Scrie:
 *   date/transformat.json          intrarea pentru importa.php
 *   date/raport-transformare.md    ce s-a dedus, ce lipsește, ce trebuie corectat
 *
 * Corecțiile manuale stau în corectii.json, pe product_id OpenCart:
 *   { "1114": { "cale": "invertoare/on-grid", "brand": "Deye", "mpn": "SUN-60K-G" } }
 * Au prioritate peste orice regulă. Tot ce nu se poate deduce sigur ajunge în
 * raport, de unde se trece în corectii.json — nu se ghicește în cod.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import * as R from "./reguli.mjs";
import * as T from "./texte.mjs";
import { toateCategoriile } from "./categorii-noi.mjs";

const aici = dirname(fileURLToPath(import.meta.url));
const repo = join(aici, "..", "..");
const TVA = 1.21;

const sursa = process.argv[2]
  ?? join(aici, "date", readdirSync(join(aici, "date")).filter((f) => /^opencart-\d{4}-\d\d-\d\d\.json$/.test(f)).sort().at(-1));
const oc = JSON.parse(readFileSync(sursa, "utf8"));
const dataExport = oc.extrasLa.slice(0, 10);
const corectii = existsSync(join(aici, "corectii.json")) ? JSON.parse(readFileSync(join(aici, "corectii.json"), "utf8")) : {};

/* ─── Indexuri ─────────────────────────────────────────────────────────── */

const producatori = Object.fromEntries(oc.producatori.map((m) => [m.manufacturer_id, R.decodeaza(m.name)]));
const parinte = Object.fromEntries(oc.categorii.map((c) => [c.category_id, c.parent_id]));
const top = (id) => { while (parinte[id]) id = parinte[id]; return id; };
const categoriiProdus = {};
for (const r of oc.produsCategorie) (categoriiProdus[r.product_id] ??= []).push(r.category_id);
const imaginiExtra = {};
for (const i of [...oc.imagini].sort((a, b) => a.sort_order - b.sort_order)) (imaginiExtra[i.product_id] ??= []).push(i.image);
const azi = new Date().toISOString().slice(0, 10);
const activ = (r) => (!r.date_start || r.date_start === "0000-00-00" || r.date_start <= azi) && (!r.date_end || r.date_end === "0000-00-00" || r.date_end >= azi);
const oferte = {};
for (const s of oc.oferteSpeciale.filter((s) => s.customer_group_id === 1 && activ(s)).sort((a, b) => a.priority - b.priority)) oferte[s.product_id] ??= s.price;
const cantitati = {};
for (const d of oc.reduceriCantitate.filter((d) => d.customer_group_id === 1 && activ(d))) (cantitati[d.product_id] ??= []).push(d);

/** Pozele de rezervă din repo (poze-*), după cod. Se folosesc doar până vine arhiva. */
const pozeRepo = new Map();
for (const dir of readdirSync(repo).filter((d) => /^poze-/.test(d) && statSync(join(repo, d)).isDirectory())) {
  for (const f of readdirSync(join(repo, dir)).filter((f) => /\.(webp|jpe?g|png)$/i.test(f))) {
    const cheie = R.fara_diacritice(f.replace(/\.[^.]+$/, "")).toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!pozeRepo.has(cheie)) pozeRepo.set(cheie, relative(repo, join(repo, dir, f)).replace(/\\/g, "/"));
  }
}
function pozaRepo(mpn, model) {
  for (const c of [mpn, model].filter(Boolean)) {
    const n = R.fara_diacritice(c).toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (n.length < 5) continue;
    if (pozeRepo.has(n)) return pozeRepo.get(n);
    for (const [k, v] of pozeRepo) if (k.length >= 6 && (k.includes(n) || n.includes(k))) return v;
  }
  return null;
}

/* ─── Produse ──────────────────────────────────────────────────────────── */

const pret = (net) => (net > 0 ? R.rotunjit(net * TVA, 2) : null);
const produse = [];
const probleme = { faraCategorie: [], faraBrand: [], faraMpn: [], faraPret: [], faraImagine: [], atributeLipsa: [], statusStocNecunoscut: [] };

for (const s of oc.produse.filter((p) => p.status === 1)) {
  const cor = corectii[s.product_id] ?? {};
  const numeSursa = R.decodeaza(s.name).replace(/\s+/g, " ").trim();
  const spec = R.specificatii(s.description);
  const topuri = [...new Set((categoriiProdus[s.product_id] ?? []).map(top))];
  const cale = cor.cale ?? R.clasifica(numeSursa, topuri.find((t) => [287, 285, 292, 302, 303, 289, 284].includes(t)) ?? topuri[0]);
  const brand = cor.brand ?? R.brand(numeSursa, producatori[s.manufacturer_id]);
  const mpn = cor.mpn !== undefined ? cor.mpn : R.codProducator(s.model, numeSursa);

  const a = {};
  if (cale?.startsWith("invertoare/") || cale?.startsWith("sisteme-fotovoltaice/")) a.putere_kw = R.putereKw(numeSursa, s.model);
  if (cale?.startsWith("invertoare/") || cale?.startsWith("sisteme-fotovoltaice/") || cale === "statii-incarcare") a.faza = R.faza(numeSursa, s.model);
  if (cale?.startsWith("acumulatori/") || cale?.startsWith("sisteme-fotovoltaice/")) a.capacitate_kwh = R.capacitateKwh(numeSursa, spec);
  a.tensiune_baterie = R.tensiuneBaterie(cale, numeSursa, s.model, spec);
  if (cale === "panouri-fotovoltaice") {
    a.putere_w = R.putereW(numeSursa, s.model);
    a.tehnologie = R.tehnologiePanou(numeSursa, spec);
  }
  Object.assign(a, cor.atribute ?? {});
  for (const k of Object.keys(a)) if (a[k] == null) delete a[k];

  // OpenCart arată statusul de stoc doar când cantitatea e 0; altfel, „în stoc".
  const numeStatus = oc.statusuriStoc.find((x) => x.stock_status_id === s.stock_status_id)?.name;
  const stoc = s.quantity > 0 ? "instock" : /pre-order|days/i.test(numeStatus ?? "") ? "onbackorder" : "outofstock";
  if (s.quantity <= 0 && !numeStatus) probleme.statusStocNecunoscut.push(s.product_id);

  const p = {
    ocId: s.product_id,
    numeSursa,
    cale,
    brand,
    mpn,
    modelSursa: s.model?.trim() || null,
    a,
    spec,
    textSpec: spec.map((r) => r.valoare).join(" "),
    pret: pret(s.price),
    pretRedus: oferte[s.product_id] && oferte[s.product_id] < s.price ? pret(oferte[s.product_id]) : null,
    preturiCantitate: (cantitati[s.product_id] ?? []).map((d) => ({ cantitate: d.quantity, pret: pret(d.price) })).sort((x, y) => x.cantitate - y.cantitate),
    stoc,
    cantitate: Math.max(0, s.quantity),
    greutateKg: s.weight > 0 ? s.weight : null,
    imaginiOpenCart: [s.image, ...(imaginiExtra[s.product_id] ?? [])].filter(Boolean),
    pozaRepo: pozaRepo(mpn, s.model),
    ordine: s.sort_order,
  };

  if (!cale) probleme.faraCategorie.push(p);
  if (!brand) probleme.faraBrand.push(p);
  if (!mpn) probleme.faraMpn.push(p);
  if (!p.pret) probleme.faraPret.push(p);
  if (!p.pozaRepo) probleme.faraImagine.push(p);
  produse.push(p);
}

/* ─── Texte și slug-uri (a doua trecere: „locul în gamă" are nevoie de toate) ── */

const slugUri = new Set();
for (const p of produse.filter((p) => p.cale)) {
  const frati = produse.filter((f) => f.cale === p.cale && f.brand && f.brand === p.brand);
  p.titlu = T.titlu(p);
  p.titluSeo = T.titluSeo(p, p.titlu);
  p.descriereSeo = T.descriereSeo(p, p.titlu);
  p.descriere = T.descriere(p, p.titlu, frati);
  p.descriereScurta = T.rezumat(p).slice(0, 3).map(([e, v]) => `${e}: ${v}`).join(" · ") || null;

  let slug = R.slugifica(T.slugProdus(p, p.titlu));
  for (let i = 2; slugUri.has(slug); i++) slug = `${R.slugifica(T.slugProdus(p, p.titlu))}-${i}`;
  slugUri.add(slug);
  p.slug = slug;

  if (p.cale.startsWith("invertoare/") && !p.a.putere_kw) probleme.atributeLipsa.push([p, "putere"]);
  if (p.cale.startsWith("invertoare/") && !p.a.faza) probleme.atributeLipsa.push([p, "fază"]);
  if (p.cale === "invertoare/hibride-trifazate" && !p.a.tensiune_baterie) probleme.atributeLipsa.push([p, "tensiune baterie"]);
  if (/^acumulatori\/(low|high)/.test(p.cale) && !p.a.capacitate_kwh) probleme.atributeLipsa.push([p, "capacitate"]);
  if (p.cale === "panouri-fotovoltaice" && !p.a.putere_w) probleme.atributeLipsa.push([p, "putere panou"]);
}

/* ─── Categorii ────────────────────────────────────────────────────────── */

const categorii = toateCategoriile().map((c) => {
  const din = produse.filter((p) => p.cale && (p.cale === c.cale || p.cale.startsWith(`${c.cale}/`)));
  return {
    cale: c.cale,
    slug: c.slug,
    parinte: c.parinte,
    nume: c.nume,
    titluSeo: `${c.nume} – prețuri și stoc`,
    descriereSeo: T.introCategorie(c, din),
    intro: T.introCategorie(c, din),
    ghid: c.ghid ?? null,
    produse: din.length,
  };
});

/* ─── Ieșire ───────────────────────────────────────────────────────────── */

const deImportat = produse.filter((p) => p.cale);
writeFileSync(join(aici, "date", "transformat.json"), JSON.stringify({
  sursa: relative(aici, sursa).replace(/\\/g, "/"),
  dataExport,
  transformatLa: new Date().toISOString(),
  categorii,
  produse: deImportat.map(({ textSpec, numeSursa, ...rest }) => rest),
}, null, 1));

const linie = (p, extra = "") => `| ${p.ocId} | ${p.numeSursa.replace(/\|/g, "/").slice(0, 90)} | ${p.cale ?? "—"} | ${p.modelSursa ?? ""} ${extra}|`;
const sectiune = (titluS, lista, fn = linie) => lista.length ? [`\n### ${titluS} (${lista.length})\n`, "| OC id | Nume sursă | Categorie | Model |", "|---|---|---|---|", ...lista.map((x) => Array.isArray(x) ? fn(x[0], `— lipsește: ${x[1]} `) : fn(x))].join("\n") : "";

const raport = [
  `# Raport transformare — export ${dataExport}`,
  "",
  `Produse active: **${produse.length}** · de importat (cu categorie): **${deImportat.length}**`,
  "",
  "## Pe categorii",
  "",
  "| Categorie | Produse |",
  "|---|---|",
  ...categorii.map((c) => `| ${c.parinte ? "&nbsp;&nbsp;↳ " : ""}${c.nume} (\`/${c.cale}\`) | ${c.produse} |`),
  "",
  "## Acoperire",
  "",
  `- cu brand: ${produse.length - probleme.faraBrand.length}/${produse.length}`,
  `- cu cod de producător (MPN): ${produse.length - probleme.faraMpn.length}/${produse.length}`,
  `- cu preț: ${produse.length - probleme.faraPret.length}/${produse.length}; cu preț redus activ: ${produse.filter((p) => p.pretRedus).length}`,
  `- cu specificații în tabel: ${produse.filter((p) => p.spec.length).length}/${produse.length}`,
  `- cu poză de rezervă din repo: ${produse.length - probleme.faraImagine.length}/${produse.length} (restul așteaptă arhiva image/catalog)`,
  `- stoc: ${["instock", "onbackorder", "outofstock"].map((s) => `${s} ${produse.filter((p) => p.stoc === s).length}`).join(", ")}`,
  "",
  "## De corectat (corectii.json)",
  sectiune("Fără categorie — NU se importă", probleme.faraCategorie),
  sectiune("Atribute de filtrare nededuse", probleme.atributeLipsa),
  sectiune("Fără brand", probleme.faraBrand),
  sectiune("Fără preț (apar „preț la cerere”)", probleme.faraPret),
  sectiune("Fără cod de producător valid", probleme.faraMpn),
  "",
  "## Exemple de texte generate",
  "",
  ...deImportat.filter((p) => ["SUN-10K-SG05LP3-EU-SM2", "V5a", "CS6.2-48TD-460", "XPF_UR007_1KPM", "SUN2000-10KTL-M1", "SPF6000 ES PLUS"].includes(p.modelSursa)).flatMap((p) => [
    `### ${p.titlu}`, "", `- URL: \`/produs/${p.slug}\``, `- <title>: ${p.titluSeo}`, `- meta: ${p.descriereSeo}`, `- atribute: \`${JSON.stringify(p.a)}\``, "", p.descriere, "",
  ]),
].join("\n");
writeFileSync(join(aici, "date", "raport-transformare.md"), raport);

console.log(`produse active ${produse.length}, de importat ${deImportat.length}`);
for (const [k, v] of Object.entries(probleme)) console.log(`  ${k.padEnd(22)} ${v.length}`);
console.log(`\nscris: date/transformat.json, date/raport-transformare.md`);
