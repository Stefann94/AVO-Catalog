/**
 * FOTOGRAFIILE PRODUSELOR DIN CATALOG, URCATE ÎN WORDPRESS
 * ═════════════════════════════════════════════════════════════════════════
 * Pentru produsele din catalogul lunii care n-au imagine în WooCommerce.
 * Ia fișierul local, îl urcă în biblioteca media și îl leagă de produs.
 *
 *   node tools/wordpress/urca-poze-catalog.mjs [--luna 2026-10] [--pauza 2500]
 *   node tools/wordpress/urca-poze-catalog.mjs --test 3     (doar trei, de probă)
 *
 * ─── DE CE PRIN ADRESĂ, ȘI NU URCÂND FIȘIERUL ────────────────────────────
 *
 * Prima variantă urca fișierul local în biblioteca media, prin
 * `wp/v2/media`. A primit 503 la fiecare încercare. Diagnosticul, pe patru
 * cereri:
 *
 *     wp/v2/media    fără autentificare ........ 200
 *     wp/v2/media    cu cheile WooCommerce ..... 503
 *     wc/v3/products cu parola de aplicație .... 503
 *     wc/v3/products cu cheile WooCommerce ..... 200
 *
 * Deci merge doar `wc/v3` cu cheile WooCommerce. Orice autentificare pe care
 * o validează WordPress însuși e respinsă — parola de aplicație pare expirată,
 * iar un plugin de securitate transformă eșecurile în 503.
 *
 * Dar WooCommerce știe să ia singur o imagine de la o adresă: `images: [{src}]`
 * și o descarcă el, pe server. Iar fotografiile sunt publice pe solarone.ro,
 * la `/image/<calea din OpenCart>` — ORIGINALUL de 60–240 KB, nu versiunea de
 * 6 KB din cache, care e cea strivită de care ne plângeam.
 *
 * Așa că nu urcăm nimic: îi dăm adresa și descarcă el. Un singur canal, cel
 * care merge, și pe deasupra calitatea sursei, nu a copiei.
 *
 * ─── DE CE ÎNCET, ȘI DE CE RELUABIL ──────────────────────────────────────
 *
 * Fiecare fotografie înseamnă două cereri: una care urcă fișierul, una care
 * îl leagă de produs. Găzduirea a fost deja tăiată o dată de Imunify360
 * pentru rafale de cereri, iar IP-ul biroului e și acum pe lista neagră.
 *
 * Deci: o fotografie pe rând, cu pauză, și starea scrisă pe disc după
 * FIECARE. Dacă se oprește — din orice motiv — se pornește din nou și
 * continuă de unde a rămas, fără să urce a doua oară ce a urcat deja.
 *
 * ─── CE NU ATINGE ────────────────────────────────────────────────────────
 *
 * Produsele care au deja o fotografie. Nu le șterge, nu le înlocuiește, nici
 * măcar nu le citește. Dacă vrem într-o zi să le refacem pe alea, e altă
 * operațiune, cu altă decizie în spate: ar lăsa în urmă 114 fișiere orfane
 * în biblioteca media.
 * ═════════════════════════════════════════════════════════════════════════
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, statSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const aici = dirname(fileURLToPath(import.meta.url));
const radacina = join(aici, "..", "..");

const opt = {};
for (let i = 2; i < process.argv.length; i += 2) opt[process.argv[i].replace(/^--/, "")] = process.argv[i + 1];
const LUNA = opt.luna ?? "2026-10";
const PAUZA = Number(opt.pauza ?? 2500);
const TEST = opt.test ? Number(opt.test) : null;
const DIN_POZE = opt.poze ?? "C:/Users/Sony/Desktop/produse solarone/poze solarone";

/* ─── Acces ───────────────────────────────────────────────────────────── */
const env = Object.fromEntries(
  readFileSync(join(aici, ".env.local"), "utf8")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const BAZA = env.WP_URL.replace(/\/+$/, "");
const authWp = "Basic " + Buffer.from(`${env.WP_USER}:${env.WP_APP_PASSWORD}`).toString("base64");
const authWc = "Basic " + Buffer.from(`${env.WC_KEY}:${env.WC_SECRET}`).toString("base64");

const asteapta = (ms) => new Promise((r) => setTimeout(r, ms));

/* ─── Stare, ca să se poată relua ─────────────────────────────────────── */
const caleStare = join(radacina, "tools/import-opencart/date", `poze-urcate-${LUNA}.json`);
const stare = existsSync(caleStare) ? JSON.parse(readFileSync(caleStare, "utf8")) : { urcate: {}, esuate: {} };
const salveaza = () => writeFileSync(caleStare, JSON.stringify(stare, null, 1));

/* ─── Inventarul local ────────────────────────────────────────────────── */
const peDisc = new Map();
(function plimba(dir, prefix) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) plimba(join(dir, e.name), rel);
    else {
      peDisc.set(rel, join(dir, e.name));
      if (!peDisc.has(basename(rel))) peDisc.set(basename(rel), join(dir, e.name));
    }
  }
})(DIN_POZE, "");

/* ─── Cine are nevoie ─────────────────────────────────────────────────── */
const unificat = JSON.parse(readFileSync(join(radacina, "tools/import-opencart/date", `unificat-${LUNA}.json`), "utf8"));

console.error("Întreb magazinul ce produse n-au fotografie...");
const dinMagazin = new Map();
for (let p = 1; p <= 2; p++) {
  const r = await fetch(`${BAZA}/wp-json/wc/v3/products?per_page=100&status=publish&page=${p}`, {
    headers: { Authorization: authWc },
  });
  if (!r.ok) throw new Error(`nu pot citi produsele: HTTP ${r.status}`);
  const d = await r.json();
  for (const x of d) dinMagazin.set(x.sku, { id: x.id, poze: (x.images ?? []).filter((i) => !/placeholder/i.test(i.src)).length });
  if (d.length < 100) break;
  await asteapta(PAUZA);
}

const deFacut = [];
for (const p of unificat.produse) {
  const inMagazin = dinMagazin.get(p.sku);
  if (!inMagazin || inMagazin.poze > 0) continue;
  if (stare.urcate[p.sku]) continue;

  // Calea din OpenCart devine adresa publica: catalog/x.jpg ->
  // https://www.solarone.ro/image/catalog/x.jpg, originalul, nu cache-ul.
  const sursa = p.opencart?.poza;
  if (!sursa) continue;
  const adresa = "https://www.solarone.ro/image/" + sursa.split("/").map(encodeURIComponent).join("/");
  deFacut.push({ ...p, idProdus: inMagazin.id, adresa });
}

const lista = TEST ? deFacut.slice(0, TEST) : deFacut;
console.error(`Produse fără fotografie, cu sursă pe solarone.ro: ${deFacut.length}${TEST ? ` (de probă: ${lista.length})` : ""}\n`);
if (!lista.length) {
  console.error("Nimic de făcut.");
  process.exit(0);
}

/* ─── Urcarea ─────────────────────────────────────────────────────────── */
const TIPURI = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

let esecuriLaRand = 0;
for (const p of lista) {
  try {
    // Textul alternativ e denumirea produsului: e ce citește cineva care nu
    // vede imaginea, și singurul lucru pe care Google îl are despre ea.
    const legare = await fetch(`${BAZA}/wp-json/wc/v3/products/${p.idProdus}`, {
      method: "PUT",
      headers: { Authorization: authWc, "Content-Type": "application/json" },
      body: JSON.stringify({ images: [{ src: p.adresa, alt: p.nume, name: p.nume }] }),
    });
    if (!legare.ok) throw new Error(`HTTP ${legare.status}: ${(await legare.text()).slice(0, 200)}`);
    const dupa = await legare.json();
    const puse = (dupa.images ?? []).filter((i) => !/placeholder/i.test(i.src));
    if (!puse.length) throw new Error("WooCommerce a raspuns fara imagine — descarcarea a esuat");

    stare.urcate[p.sku] = { media: puse[0].id, produs: p.idProdus, adresa: p.adresa, la: new Date().toISOString() };
    delete stare.esuate[p.sku];
    salveaza();
    esecuriLaRand = 0;
    console.error(`  ${p.sku.padEnd(32).slice(0, 32)} media ${String(puse[0].id).padStart(6)}  ${p.adresa.split("/").pop().slice(0, 52)}`);
    await asteapta(PAUZA);
  } catch (e) {
    esecuriLaRand++;
    stare.esuate[p.sku] = { eroare: String(e.message).slice(0, 240), la: new Date().toISOString() };
    salveaza();
    console.error(`  ! ${p.sku}: ${e.message}`);
    if (esecuriLaRand >= 3) {
      console.error("\nTrei erori la rând. Mă opresc; starea e salvată, pornește din nou mai târziu.");
      process.exit(2);
    }
    await asteapta(PAUZA * 3);
  }
}

console.error(`
Urcate acum ......... ${lista.filter((p) => stare.urcate[p.sku]).length}
Total urcate ........ ${Object.keys(stare.urcate).length}
Esuate .............. ${Object.keys(stare.esuate).length}
Stare ............... ${caleStare}
`);
