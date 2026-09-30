#!/usr/bin/env node
/**
 * Pasul 1 din 3, VARIANTA A DOUA: exporturile Excel → același JSON pe care îl
 * scrie `extrage.mjs`.
 *
 *   node din-xlsx.mjs [--din="C:/Users/Sony/Downloads"] [--data=2026-09-25]
 *
 * Scrie `date/opencart-AAAA-LL-ZZ.json`, în exact forma pe care o citește
 * `transforma.mjs`. După el, restul conductei merge neschimbat:
 *
 *   node din-xlsx.mjs  &&  node transforma.mjs  &&  ...importa.php
 *
 * ─── DE CE EXISTĂ, PE LÂNGĂ extrage.mjs ──────────────────────────────────
 *
 * `extrage.mjs` citește direct baza OpenCart dintr-un container local. Când
 * containerul acela nu e pornit, nu e la zi, sau pur și simplu nu e ce vrem,
 * singurele date pe care le avem sunt exporturile făcute din panoul OpenCart:
 * trei fișiere .xlsx. Fișierul ăsta le aduce la aceeași formă, ca restul
 * conductei să nu știe de unde vin datele.
 *
 * ─── CE FIȘIERE AȘTEAPTĂ ─────────────────────────────────────────────────
 *
 *   products-AAAA-LL-ZZ.xlsx ..... foile Products, AdditionalImages,
 *                                  Specials, Discounts, ProductSEOKeywords
 *   categories-AAAA-LL-ZZ.xlsx ... foile Categories, CategorySEOKeywords
 *
 * Al treilea export din dosar, cel cu labelurile Journal3, NU se folosește:
 * labelurile sunt o funcție a temei OpenCart, nu date de produs, iar în
 * WooCommerce n-au corespondent. Ce era util în el — „Stoc Epuizat" — se
 * deduce oricum din `quantity`.
 *
 * ─── CE SE DEDUCE, FIINDCĂ EXCELUL NU ARE ────────────────────────────────
 *
 * Exportul din panou dă NUME acolo unde baza are chei numerice. Trei tabele
 * se reconstruiesc:
 *
 *   producatori ....... numele distincte primesc id-uri, în ordine
 *                       alfabetică, ca două rulări să dea aceleași id-uri.
 *                       Contează doar ca `produse.manufacturer_id` să arate
 *                       spre `producatori.manufacturer_id`, iar asta se
 *                       respectă prin construcție.
 *   grupuri de clienți  „Clienti Solar One" → 1, „B2B (…)" → 3. NU sunt
 *                       ghicite: numărul de rânduri din fiecare grup se
 *                       potrivește exact cu exportul SQL din 22.09 —
 *                       oferte 77/1 și reduceri 101/241 acolo, 77/1 și
 *                       100/240 aici. `transforma.mjs` păstrează doar
 *                       grupul 1, deci maparea greșită ar schimba TOATE
 *                       prețurile promoționale.
 *   statusuriStoc ..... numele nu sunt în export. Sunt luate din exportul
 *                       SQL al aceluiași magazin: 5 Out Of Stock, 6 2-3
 *                       Days, 7 In Stock, 8 Pre-Order. Id-ul 10, care apare
 *                       pe 27 de produse în Excel și nu exista în SQL,
 *                       rămâne fără nume — `transforma.mjs` îl raportează la
 *                       `statusStocNecunoscut`, și e bine să se vadă.
 *
 * ─── CITITORUL DE .xlsx ──────────────────────────────────────────────────
 *
 * Scris aici, fără nicio dependență: un .xlsx e o arhivă ZIP cu XML înăuntru,
 * iar Node are `zlib`. O bibliotecă în plus pentru trei fișiere citite o dată
 * pe lună ar fi fost mai mult de întreținut decât cele șaizeci de rânduri de
 * mai jos.
 */

import { writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { citesteRegistru } from "./xlsx.mjs";

const aici = dirname(fileURLToPath(import.meta.url));
const opt = Object.fromEntries(
  process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")),
);
const DIN = opt.din ?? join(process.env.USERPROFILE ?? process.env.HOME ?? ".", "Downloads");

/* ══════════════════════ CONVERSIA ══════════════════════ */

const nr = (v) => {
  const x = Number(String(v).trim());
  return Number.isFinite(x) ? x : 0;
};
const intreg = (v) => Math.trunc(nr(v));
const bool01 = (v) => (String(v).trim().toLowerCase() === "true" ? 1 : 0);

/** Grupurile de clienți, după nume. Vezi explicația din capul fișierului. */
const GRUPURI = new Map([
  ["Clienti Solar One", 1],
  ["B2B (Necesita aprobare in 24h)", 3],
]);

/** Numele stărilor de stoc, din exportul SQL al aceluiași magazin. */
const STARI_STOC = [
  { stock_status_id: 7, name: "In Stock" },
  { stock_status_id: 8, name: "Pre-Order" },
  { stock_status_id: 5, name: "Out Of Stock" },
  { stock_status_id: 6, name: "2-3 Days" },
];

function gasesteFisier(prefix) {
  const potriviri = readdirSync(DIN)
    .filter((f) => f.toLowerCase().startsWith(prefix) && f.toLowerCase().endsWith(".xlsx"))
    .sort();
  if (!potriviri.length) throw new Error(`nu găsesc ${prefix}*.xlsx în ${DIN}`);
  return join(DIN, potriviri[potriviri.length - 1]); // cel mai recent, alfabetic = cronologic
}

const caleProduse = gasesteFisier("products-");
const caleCategorii = gasesteFisier("categories-");
console.error("Citesc:\n  " + caleProduse + "\n  " + caleCategorii);

const P = citesteRegistru(caleProduse);
const C = citesteRegistru(caleCategorii);

const foaie = (reg, nume) => {
  const f = reg.get(nume);
  if (!f) throw new Error(`lipsește foaia „${nume}"`);
  return f;
};

const produseXlsx = foaie(P, "Products");

/* ── Producători: nume distincte → id-uri stabile ── */
const numeProducatori = [...new Set(produseXlsx.map((p) => p.manufacturer?.trim()).filter(Boolean))].sort();
const idProducator = new Map(numeProducatori.map((n, i) => [n, i + 1]));
const producatori = numeProducatori.map((n) => ({ manufacturer_id: idProducator.get(n), name: n }));

/* ── Produse ── */
const produse = produseXlsx.map((p) => ({
  product_id: intreg(p.product_id),
  model: p.model ?? "",
  sku: p.sku ?? "",
  upc: p.upc ?? "",
  ean: p.ean ?? "",
  jan: p.jan ?? "",
  mpn: p.mpn ?? "",
  quantity: intreg(p.quantity),
  stock_status_id: intreg(p.stock_status_id),
  image: p.image_name ?? "",
  manufacturer_id: idProducator.get(p.manufacturer?.trim()) ?? 0,
  price: nr(p.price),
  status: bool01(p.status),
  weight: nr(p.weight),
  length: nr(p.length),
  width: nr(p.width),
  height: nr(p.height),
  date_added: p.date_added ?? "",
  date_modified: p.date_modified ?? "",
  sort_order: intreg(p.sort_order),
  minimum: intreg(p.minimum) || 1,
  name: p["name(ro-ro)"] ?? "",
  description: p["description(ro-ro)"] ?? "",
  meta_title: p["meta_title(ro-ro)"] ?? "",
  meta_description: p["meta_description(ro-ro)"] ?? "",
  tag: p["tags(ro-ro)"] ?? "",
}));

/* ── Legătura produs–categorie: coloana `categories`, id-uri despărțite prin virgulă ── */
const produsCategorie = [];
for (const p of produseXlsx) {
  for (const id of String(p.categories ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)) {
    produsCategorie.push({ product_id: intreg(p.product_id), category_id: intreg(id) });
  }
}

/* ── Categorii ── */
const categorii = foaie(C, "Categories").map((c) => ({
  category_id: intreg(c.category_id),
  parent_id: intreg(c.parent_id),
  status: bool01(c.status),
  sort_order: intreg(c.sort_order),
  name: c["name(ro-ro)"] ?? "",
  description: c["description(ro-ro)"] ?? "",
  meta_title: c["meta_title(ro-ro)"] ?? "",
}));

/* ── Imagini suplimentare ── */
const imagini = foaie(P, "AdditionalImages").map((i) => ({
  product_id: intreg(i.product_id),
  image: i.image ?? "",
  sort_order: intreg(i.sort_order),
}));

/* ── Prețuri speciale și reduceri pe cantitate ── */
const grupId = (nume) => GRUPURI.get(String(nume).trim()) ?? 0;

const oferteSpeciale = foaie(P, "Specials").map((s) => ({
  product_id: intreg(s.product_id),
  customer_group_id: grupId(s.customer_group),
  price: nr(s.price),
  date_start: s.date_start ?? "0000-00-00",
  date_end: s.date_end ?? "0000-00-00",
  priority: intreg(s.priority),
}));

const reduceriCantitate = foaie(P, "Discounts").map((d) => ({
  product_id: intreg(d.product_id),
  customer_group_id: grupId(d.customer_group),
  quantity: intreg(d.quantity),
  price: nr(d.price),
  date_start: d.date_start ?? "0000-00-00",
  date_end: d.date_end ?? "0000-00-00",
}));

/* ── Adresele SEO: produse și categorii, în același tabel, ca în OpenCart ── */
const seoUrl = [
  ...foaie(P, "ProductSEOKeywords").map((s) => ({
    query: `product_id=${intreg(s.product_id)}`,
    keyword: s["keyword(ro-ro)"] ?? "",
  })),
  ...foaie(C, "CategorySEOKeywords").map((s) => ({
    query: `category_id=${intreg(s.category_id)}`,
    keyword: s["keyword(ro-ro)"] ?? "",
  })),
].filter((s) => s.keyword);

/* ══════════════════════ SCRIEREA ══════════════════════ */

const azi = opt.data ?? new Date().toISOString().slice(0, 10);
const iesire = {
  extrasLa: new Date().toISOString(),
  sursa: `exporturi Excel din panoul OpenCart: ${caleProduse.split(/[\\/]/).pop()}, ${caleCategorii.split(/[\\/]/).pop()}`,
  produse,
  produsCategorie,
  categorii,
  producatori,
  imagini,
  oferteSpeciale,
  reduceriCantitate,
  seoUrl,
  statusuriStoc: STARI_STOC,
};

mkdirSync(join(aici, "date"), { recursive: true });
const fisier = join(aici, "date", `opencart-${azi}.json`);
writeFileSync(fisier, JSON.stringify(iesire));

const grupe = (a) => {
  const m = {};
  for (const x of a) m[x.customer_group_id] = (m[x.customer_group_id] ?? 0) + 1;
  return JSON.stringify(m);
};

console.error(`
Scris ${fisier}

  produse ................ ${produse.length}   (active: ${produse.filter((p) => p.status === 1).length})
  produs–categorie ....... ${produsCategorie.length}
  categorii .............. ${categorii.length}
  producatori ............ ${producatori.length}
  imagini suplimentare ... ${imagini.length}
  oferte speciale ........ ${oferteSpeciale.length}   pe grupuri: ${grupe(oferteSpeciale)}
  reduceri pe cantitate .. ${reduceriCantitate.length}   pe grupuri: ${grupe(reduceriCantitate)}
  adrese SEO ............. ${seoUrl.length}

Urmează:  node transforma.mjs`);
