/**
 * PREȚURILE ÎN LEI, LUATE DE PE solarone.ro
 * ═════════════════════════════════════════════════════════════════════════
 * Pentru produsele din catalogul lunar care nu au corespondent în exportul
 * OpenCart, deci n-au preț în lei. Le caută pe site-ul public și citește
 * prețul din pagină.
 *
 *   node tools/import-opencart/preturi-solarone.mjs [--luna 2026-10] [--pauza 4000]
 *
 * ─── DE CE ÎNCET, ȘI DE CE RELUABIL ──────────────────────────────────────
 *
 * solarone.ro e magazinul care funcționează, cu clienți pe el acum. O rafală
 * de cereri l-ar încetini sau l-ar face să pară un atac. Găzduirea AVO a fost
 * deja tăiată o dată de Imunify360 exact așa, iar IP-ul biroului e și acum
 * pe lista neagră.
 *
 * Deci: o cerere pe rând, cu pauză între ele, și starea scrisă pe disc după
 * FIECARE produs. Dacă se oprește — din orice motiv — se pornește din nou și
 * continuă de unde a rămas, fără să ceară a doua oară ce are deja.
 *
 * Se oprește singur la primul semn că serverul suferă: 429, 5xx, sau trei
 * erori la rând. Mai bine jumătate de listă decât un magazin căzut.
 *
 * ─── DE CE DIN HARTA SITE-ULUI, ȘI NU DIN CĂUTARE ────────────────────────
 *
 * `robots.txt` de pe solarone.ro interzice explicit
 * `/index.php?route=product/search`. Harta, în schimb, e publicată chiar de
 * ei: 588 de adrese, luate dintr-o singură cerere. Toate paginile de produs
 * de care avem nevoie sunt acolo.
 *
 * ─── POTRIVIREA SE CONFIRMĂ DIN PAGINĂ, NU SE GHICEȘTE ───────────────────
 *
 * Adresa e aleasă după asemănarea dintre codul de model și slug — o
 * aproximație. Dar pagina de produs conține ea însăși codul, în câmpul
 * „Cod produs" / „Model". Se citește de acolo și se compară. Dacă nu se
 * potrivește, se încearcă următorul candidat; dacă niciunul nu confirmă,
 * produsul rămâne fără preț și intră în raport.
 *
 * Un preț pus pe produsul greșit e mai rău decât un preț lipsă: lipsa se
 * vede, greșeala nu.
 * ═════════════════════════════════════════════════════════════════════════
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const aici = dirname(fileURLToPath(import.meta.url));
const opt = {};
for (let i = 2; i < process.argv.length; i += 2) opt[process.argv[i].replace(/^--/, "")] = process.argv[i + 1];

const LUNA = opt.luna ?? "2026-10";
const PAUZA = Number(opt.pauza ?? 4000);
const MAX_CANDIDATI = Number(opt.candidati ?? 3);
const AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const caleStare = join(aici, "date", `preturi-solarone-${LUNA}.json`);
const stare = existsSync(caleStare) ? JSON.parse(readFileSync(caleStare, "utf8")) : { gasite: {}, incercate: {} };
const salveaza = () => writeFileSync(caleStare, JSON.stringify(stare, null, 1));

const asteapta = (ms) => new Promise((r) => setTimeout(r, ms));

async function ia(url) {
  const r = await fetch(url, { headers: { "User-Agent": AGENT, "Accept-Language": "ro-RO,ro;q=0.9" } });
  if (r.status === 429 || r.status >= 500) throw new Error(`OPRIRE: serverul a raspuns ${r.status}`);
  return r;
}

/* ─── 1. Harta site-ului ──────────────────────────────────────────────── */
const caleHarta = join(aici, "date", "solarone-harta.xml");
let harta;
if (existsSync(caleHarta)) {
  harta = readFileSync(caleHarta, "utf8");
  console.error("Harta: din memorie.");
} else {
  console.error("Harta: o cer de pe solarone.ro...");
  harta = await (await ia("https://www.solarone.ro/sitemap2.xml")).text();
  mkdirSync(join(aici, "date"), { recursive: true });
  writeFileSync(caleHarta, harta);
  await asteapta(PAUZA);
}
const adrese = [...harta.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
console.error(`Harta: ${adrese.length} adrese.`);

/* ─── 2. Cine n-are preț ──────────────────────────────────────────────── */
const unificat = JSON.parse(readFileSync(join(aici, "date", `unificat-${LUNA}.json`), "utf8"));
const faraPret = unificat.produse.filter((p) => !(p.opencart && p.opencart.publicRon));
console.error(`Produse fără preț în lei: ${faraPret.length}\n`);

/* ─── 3. Candidații, după cod de model ────────────────────────────────── */
/** Litere și cifre, fără diacritice și fără separatori: „PB-068.1" → „pb0681". */
const lipit = (s) =>
  (s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

const adreseLipite = adrese.map((a) => [a, lipit(a.replace(/^https?:\/\/[^/]+\//, ""))]);

function candidati(p) {
  // Bucățile din SKU, de la cea mai lungă la cea mai scurtă. Codul de model e
  // aproape întotdeauna cea mai lungă bucată alfanumerică — „SG03LP1", „48100R".
  const bucati = [...new Set([...(p.sku ?? "").split(/[^A-Za-z0-9.]+/), ...(p.nume ?? "").split(/[^A-Za-z0-9.]+/)])]
    .map(lipit)
    .filter((x) => x.length >= 2)
    .sort((a, b) => b.length - a.length);

  const scor = adreseLipite.map(([url, s]) => {
    let n = 0;
    for (const b of bucati) if (s.includes(b)) n += b.length * b.length; // bucățile lungi cântăresc mult mai mult
    return [n, url];
  });
  return scor.sort((a, b) => b[0] - a[0]).slice(0, MAX_CANDIDATI).filter(([n]) => n > 0).map(([, u]) => u);
}

/* ─── 4. Citirea paginii ──────────────────────────────────────────────── */
const fara = (s) => s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

/**
 * Blocul de date structurate al PRODUSULUI, nu oricare.
 *
 * AICI A FOST UN DEFECT, prins la prima verificare. Prima variantă căuta
 * `"price"` în tot HTML-ul și lua prima potrivire. Pe pagina PB-098 asta
 * scotea 730,58 lei — prețul unui produs din caruselul „clienții au mai
 * cumpărat", aflat mai sus în fișier. Prețul adevărat era 309,92, iar
 * verificarea a fost simplă: catalogul zice 54,76 €, iar 54,76 × 5,66 ≈ 310.
 *
 * O pagină de produs are cinci blocuri ld+json — WebPage, Product,
 * BreadcrumbList, Organization, LocalBusiness — plus prețurile produselor
 * recomandate. Singurul de încredere e cel cu `@type: "Product"`, și doar
 * dacă numele lui se potrivește cu titlul paginii.
 */
function produsulPaginii(html) {
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    let d;
    try { d = JSON.parse(m[1]); } catch { continue; }
    const drum = [];
    const plimba = (x) => {
      if (!x || typeof x !== "object") return;
      if (Array.isArray(x)) { x.forEach(plimba); return; }
      if (x["@type"] === "Product") drum.push(x);
      if (x["@graph"]) plimba(x["@graph"]);
    };
    plimba(d);
    if (drum.length) return drum[0];
  }
  return null;
}

/** Prețul în lei din oferta produsului. Alte monede se refuză. */
function citestePret(produs) {
  const oferte = produs?.offers;
  if (!oferte) return null;
  for (const o of Array.isArray(oferte) ? oferte : [oferte]) {
    const moneda = o.priceCurrency ?? o.priceSpecification?.priceCurrency;
    const brut = o.price ?? o.lowPrice ?? o.priceSpecification?.price;
    if (brut == null) continue;
    if (moneda && moneda !== "RON") continue; // un preț în altă monedă n-are ce căuta aici
    const v = typeof brut === "number" ? brut : parseFloat(String(brut).replace(/\.(?=\d{3}\b)/g, "").replace(",", "."));
    if (v > 0) return v;
  }
  return null;
}

function titlu(html) {
  const m = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html) ?? /<title>([\s\S]*?)<\/title>/.exec(html);
  return m ? fara(m[1]) : null;
}

/* ─── 5. Parcurgerea ──────────────────────────────────────────────────── */
let cereri = 0;
let esecuriLaRand = 0;

for (const p of faraPret) {
  if (stare.gasite[p.sku] || stare.incercate[p.sku]) continue;

  const lista = candidati(p);
  if (!lista.length) {
    stare.incercate[p.sku] = { motiv: "niciun candidat in harta" };
    salveaza();
    continue;
  }

  const codCerut = lipit(p.sku);
  let rezolvat = false;
  const incercari = [];

  for (const url of lista) {
    try {
      const r = await ia(url);
      cereri++;
      if (!r.ok) { incercari.push({ url, http: r.status }); await asteapta(PAUZA); continue; }
      const html = await r.text();
      const produs = produsulPaginii(html);
      const pret = citestePret(produs);
      const model = produs?.sku ?? produs?.mpn ?? null;
      const nume = produs?.name ?? titlu(html);
      esecuriLaRand = 0;

      // Confirmarea, în două trepte.
      //
      // Întâi codul: cel din pagină trebuie să se regăsească în SKU-ul
      // catalogului sau invers — „XFS_PB098" conține „pb098". E dovada tare.
      //
      // Dar jumătate din SKU-urile catalogului sunt inventate de parser din
      // denumire, fiindcă produsul n-are cod tipărit („CLEMA-DE-CAPAT"). Pe
      // ele codul nu se potrivește niciodată, deși pagina e cea bună. Pentru
      // astea se compară denumirile, și se notează că dovada e mai slabă:
      // raportul trebuie să arate diferența, ca omul să știe ce să verifice.
      const codPagina = lipit(model);
      const prinCod =
        codPagina.length >= 4 && codCerut.length >= 4 && (codPagina.includes(codCerut) || codCerut.includes(codPagina));

      const cuvinteCatalog = [...new Set((p.nume ?? "").split(/[^A-Za-z0-9.]+/).map(lipit).filter((x) => x.length >= 3))];
      const numePagina = lipit(nume);
      const potriviteInNume = cuvinteCatalog.filter((x) => numePagina.includes(x)).length;
      const prinNume =
        cuvinteCatalog.length >= 2 && potriviteInNume / cuvinteCatalog.length >= 0.7;

      const confirmat = prinCod ? "cod" : prinNume ? "nume" : null;
      incercari.push({ url, model, nume, pret, confirmat, potriviteInNume, dinCuvinte: cuvinteCatalog.length });

      // Fotografiile se iau în ACEEAȘI trecere. Sunt în același bloc de date
      // structurate, deci nu costă nicio cerere în plus — iar produsele care
      // n-au preț sunt, aproape fără excepție, aceleași care n-au nici poză.
      // A doua parcurgere a site-ului pentru ele ar fi fost cereri degeaba.
      const poze = (() => {
        const im = produs?.image;
        if (!im) return [];
        const lista = (Array.isArray(im) ? im : [im]).map((x) => (typeof x === "string" ? x : x?.url ?? x?.contentUrl)).filter(Boolean);
        return [...new Set(lista)];
      })();

      if (confirmat && pret) {
        stare.gasite[p.sku] = { url, model, nume, pretRon: pret, poze, confirmat, luatLa: new Date().toISOString() };
        console.error(`  ${p.sku.padEnd(32).slice(0, 32)} ${String(pret).padStart(10)} lei  [${confirmat}]  ${url.replace("https://www.solarone.ro/", "")}`);
        rezolvat = true;
        await asteapta(PAUZA);
        break;
      }
      await asteapta(PAUZA);
    } catch (e) {
      esecuriLaRand++;
      incercari.push({ url, eroare: e.message });
      console.error(`  ! ${p.sku}: ${e.message}`);
      if (String(e.message).startsWith("OPRIRE") || esecuriLaRand >= 3) {
        stare.incercate[p.sku] = { incercari };
        salveaza();
        console.error(`\nM-am oprit: ${e.message}. Starea e salvată; pornește din nou mai târziu.`);
        process.exit(2);
      }
      await asteapta(PAUZA * 2);
    }
  }

  if (!rezolvat) {
    stare.incercate[p.sku] = { incercari };
    console.error(`  ? ${p.sku.padEnd(34).slice(0, 34)} neconfirmat`);
  }
  salveaza();
}

salveaza();
const g = Object.keys(stare.gasite).length;
console.error(`
Cereri făcute ......... ${cereri}
Preturi confirmate .... ${g}
Neconfirmate .......... ${faraPret.length - g}
Stare ................. ${caleStare}
`);
