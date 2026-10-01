/**
 * FIȘIERELE DE IMPORT PENTRU WOOCOMMERCE
 * ═════════════════════════════════════════════════════════════════════════
 * Din `unificat-<luna>.json` scoate două CSV-uri pentru importatorul propriu
 * al WooCommerce (Produse → Import), plus un raport despre ce conțin.
 *
 *   node tools/import-opencart/catre-woocommerce.mjs [--luna 2026-10]
 *
 * ─── DE CE CSV, ȘI NU PRIN API ───────────────────────────────────────────
 *
 * Importatorul WooCommerce primește UN fișier și face restul pe server, local,
 * fără rețea. Prin REST ar fi 159 de cereri, plus încă 280 pentru fotografii.
 * Găzduirea a fost deja tăiată o dată de Imunify360 pentru rafale de cereri,
 * iar IP-ul biroului e și acum pe lista neagră. O încărcare de fișier nu seamănă
 * cu un atac; patru sute de cereri într-un minut, da.
 *
 * ─── CELE DOUĂ FIȘIERE ───────────────────────────────────────────────────
 *
 *   woocommerce-<luna>.csv .......... cele din catalog: se creează sau se
 *                                     actualizează, potrivite după SKU
 *   woocommerce-<luna>-ciorne.csv ... cele din magazin care NU mai sunt în
 *                                     catalog: trec pe ciornă
 *
 * Ciorna, nu ștergerea. Pe 1 noiembrie vine alt catalog și unele se întorc; un
 * produs pe ciornă își păstrează fotografiile, descrierea, slug-ul și
 * istoricul, și revine cu un clic.
 *
 * ─── PREȚURILE ───────────────────────────────────────────────────────────
 *
 * `Regular price` e prețul PUBLIC în lei, din exportul OpenCart. Catalogul PDF
 * decide care produse există; prețul de raft vine din magazin.
 *
 * Unde nu există preț public, câmpul rămâne GOL. WooCommerce afișează atunci
 * produsul fără preț, iar site-ul arată „preț la cerere". Alternativa ar fi
 * fost să convertesc prețul de partener din catalog cu un curs ales de mine —
 * adică să inventez o cifră. La un sistem de 24.000 €, o eroare de curs de 2%
 * înseamnă 2.400 de lei, iar cifra ar arăta la fel de sigură ca celelalte.
 *
 * PREȚUL DE PARTENER SE PĂSTREAZĂ SEPARAT, în `_pret_b2b_eur`. Nu se afișează
 * nicăieri acum. Când se face zona B2B cu autentificare, el e deja acolo, pe
 * fiecare produs, exact cum l-a tipărit catalogul — în euro, cum îl primesc
 * partenerii oricum.
 *
 * ─── PREȚUL LA VOLUM SE TRADUCE, NU SE COPIAZĂ ───────────────────────────
 *
 * Catalogul dă prețul la volum tot în euro („65 € bucata, 64 € de la 4 paleți").
 * Pus ca atare lângă un preț de raft în lei, site-ul ar calcula o economie
 * fără sens — el scade `_pret_volum` din preț.
 *
 * Ce e un fapt în catalog nu e suma, ci REDUCEREA: 64/65 = 1,54% mai ieftin la
 * volum. Procentul se aplică prețului în lei. Nu inventez un nivel de preț nou,
 * traduc unul publicat de ei.
 *
 * ─── FOTOGRAFIILE LIPSESC INTENȚIONAT ────────────────────────────────────
 *
 * Coloana `Images` rămâne goală. Produsele se identifică după SKU, deci
 * fotografiile se leagă oricând după aceea, fără să se șteargă sau să se
 * reimporte nimic. Vezi tools/wordpress/leaga-poze.js.
 *
 * Un CSV cu 280 de adrese de fotografii ar pune WooCommerce să le descarce una
 * câte una în timpul importului — același șir de cereri de care fugim, doar
 * pornit din interior.
 * ═════════════════════════════════════════════════════════════════════════
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const aici = dirname(fileURLToPath(import.meta.url));
const opt = {};
for (let i = 2; i < process.argv.length; i += 2) opt[process.argv[i].replace(/^--/, "")] = process.argv[i + 1];
const LUNA = opt.luna ?? "2026-10";

const u = JSON.parse(readFileSync(join(aici, "date", `unificat-${LUNA}.json`), "utf8"));
const inMagazin = JSON.parse(readFileSync(join(aici, "date", "woocommerce-acum.json"), "utf8"));

const [an, lunaNr] = LUNA.split("-");
const NUME_LUNI = ["", "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];
const zileLuna = new Date(Number(an), Number(lunaNr), 0).getDate();
const eticheta = `${NUME_LUNI[Number(lunaNr)]} ${an}`;
const valabilDe = `01.${lunaNr}.${an}`;
const valabilPana = `${zileLuna}.${lunaNr}.${an}`;

/* ─── CSV ─────────────────────────────────────────────────────────────── */
const ghil = (v) => {
  const s = v === null || v === undefined ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
};
const randCsv = (cap, obj) => cap.map((k) => ghil(obj[k] ?? "")).join(",");

const CAP = [
  "SKU", "Name", "Published", "Is featured?", "Visibility in catalog",
  "Description", "Short description",
  "Tax status", "In stock?", "Stock status", "Regular price",
  "Categories", "Images",
  "Meta: _pret_volum", "Meta: _prag_volum", "Meta: _unitate_pret", "Meta: _moneda",
  "Meta: _pret_container", "Meta: _capacitate_kwh",
  "Meta: _pret_b2b_eur", "Meta: _pret_volum_b2b_eur",
  "Meta: _sursa_pret", "Meta: _sursa_catalog", "Meta: _perioada_eticheta", "Meta: _valabil_de", "Meta: _valabil_pana",
];
for (let i = 1; i <= 6; i++) {
  CAP.push(`Attribute ${i} name`, `Attribute ${i} value(s)`, `Attribute ${i} visible`, `Attribute ${i} global`);
}

/* ─── Prețurile citite de pe solarone.ro, trecute prin două site ─────────
   Pentru produsele care nu-s în exportul OpenCart, prețul s-a citit de pe
   site-ul public. Potrivirea de acolo e aproximativă, deci rezultatul NU se
   ia pe încredere. Două verificări, amândouă ieftine, amândouă necesare:

   RAPORTUL FAȚĂ DE CATALOG. Prețul în lei împărțit la cel în euro trebuie să
   cadă între 4,8 și 7,0 — curs plauzibil plus adaos. „Deye BOS-B PRO-A3,
   16,08 kWh" (1.600 €) a primit 133.067 lei, de la pagina unui sistem de
   161 kWh: raport 83. Cele patru pachete de stocare, de 13.880 până la
   24.000 €, au primit toate același 35.746 — pagina unui pachet de 40 kWh.

   O PAGINĂ, UN PRODUS. „Deye BOS-G PRO" și „Deye SE-F5 PRO" au nimerit
   amândouă pe pagina lui SE-F5 PRO, iar raportul trece la amândouă fiindcă
   prețurile lor de catalog sunt apropiate. Două poziții din catalog nu pot fi
   același produs în magazin; ambele se resping.

   Din 16 preluate rămân 8. Restul intră „la cerere" — vizibil în raport. */
const RAPORT_MIN = 4.8;
const RAPORT_MAX = 7.0;
const caleSolarone = join(aici, "date", `preturi-solarone-${LUNA}.json`);
const pretSolarone = new Map();
const respinse = [];
if (existsSync(caleSolarone)) {
  const st = JSON.parse(readFileSync(caleSolarone, "utf8"));
  // La conflict pe aceeași pagină, codul bate denumirea.
  // „Deye SE-F5 PRO" a fost confirmat prin cod — codul din pagină se regăsea
  // în SKU. „Deye BOS-G PRO" a nimerit pe aceeași pagină doar prin asemănarea
  // denumirii. Respinse amândouă, am fi pierdut un preț corect ca să evităm
  // unul greșit. Dovada tare câștigă; cealaltă se respinge.
  const dupaUrl = new Map();
  for (const [sku, g] of Object.entries(st.gasite ?? {})) {
    if (!dupaUrl.has(g.url)) dupaUrl.set(g.url, []);
    dupaUrl.get(g.url).push(sku);
  }
  for (const [url, lista] of dupaUrl) {
    if (lista.length < 2) continue;
    const prinCod = lista.filter((s) => st.gasite[s].confirmat === "cod");
    if (prinCod.length === 1) dupaUrl.set(url, prinCod);
  }
  const catalogDupaSku = new Map(u.produse.map((p) => [p.sku, p]));
  for (const [sku, g] of Object.entries(st.gasite ?? {})) {
    const eur = catalogDupaSku.get(sku)?.pret.catalogEur;
    const raport = eur ? g.pretRon / eur : null;
    const peUrl = dupaUrl.get(g.url);
    const unic = peUrl.length === 1 && peUrl[0] === sku;
    const motiv = !eur
      ? "produsul n-are preț în catalog, raportul nu se poate verifica"
      : raport < RAPORT_MIN || raport > RAPORT_MAX
        ? `raport ${raport.toFixed(2)} față de catalog — în afara intervalului ${RAPORT_MIN}–${RAPORT_MAX}`
        : !unic
          ? `aceeași pagină ca ${Object.keys(st.gasite).filter((x) => x !== sku && st.gasite[x].url === g.url).join(", ")}, confirmare mai slabă`
          : null;
    if (motiv) respinse.push({ sku, ...g, raport, motiv });
    else pretSolarone.set(sku, g);
  }
}

/* ─── Produsele din catalog ───────────────────────────────────────────── */
const randuri = [];
const faraPret = [];
const faraDescriere = [];

for (const p of u.produse) {
  const o = p.opencart;
  const deLaSolarone = pretSolarone.get(p.sku);
  const pretRon = o?.publicRon ?? deLaSolarone?.pretRon ?? null;
  const sursaPret = o?.publicRon ? "OpenCart 25.09.2026" : deLaSolarone ? `solarone.ro ${deLaSolarone.luatLa.slice(0, 10)}` : "";

  // Reducerea la volum, luată ca procent din catalog și aplicată prețului în lei.
  let volumRon = "";
  if (pretRon && p.pret.catalogEur && p.pret.volumEur && p.pret.volumEur < p.pret.catalogEur) {
    volumRon = (pretRon * (p.pret.volumEur / p.pret.catalogEur)).toFixed(2);
  }

  if (!pretRon) faraPret.push(p);
  if (!o?.descriere || o.descriere.length < 200) faraDescriere.push(p);

  const r = {
    SKU: p.sku,
    Name: p.nume,
    Published: 1,
    "Is featured?": p.evidentiat ? 1 : 0,
    "Visibility in catalog": "visible",
    Description: o?.descriere ?? "",
    "Short description": "",
    "Tax status": "taxable",
    // Starea de stoc vine din magazin unde o știm, altfel din eticheta
    // catalogului. Un produs fără nicio informație se declară în stoc: așa a
    // fost listat în catalogul lunii, iar catalogul e litera de lege.
    "In stock?": o?.stoc === "Out Of Stock" ? 0 : 1,
    "Stock status": o?.stoc === "Out Of Stock" ? "outofstock" : o?.stoc === "Pre-Order" ? "onbackorder" : "instock",
    "Regular price": pretRon ? pretRon.toFixed(2) : "",
    Categories: p.subsectiune ? `${p.sectiune} > ${p.subsectiune}` : p.sectiune,
    Images: "",
    "Meta: _pret_volum": volumRon,
    "Meta: _prag_volum": volumRon ? (p.pret.pragVolum ?? "") : "",
    "Meta: _unitate_pret": p.pret.unitate ?? "",
    "Meta: _moneda": "RON",
    "Meta: _pret_container": p.pret.container ?? "",
    "Meta: _capacitate_kwh": p.capacitateKwh ?? "",
    "Meta: _pret_b2b_eur": p.pret.catalogEur ?? "",
    "Meta: _pret_volum_b2b_eur": p.pret.volumEur ?? "",
    "Meta: _sursa_pret": sursaPret,
    "Meta: _sursa_catalog": `Catalog Solar One ${lunaNr}.${an}`,
    "Meta: _perioada_eticheta": eticheta,
    "Meta: _valabil_de": valabilDe,
    "Meta: _valabil_pana": valabilPana,
  };

  const perechi = Object.entries(p.atribute ?? {}).slice(0, 6);
  perechi.forEach(([nume, val], i) => {
    r[`Attribute ${i + 1} name`] = nume;
    r[`Attribute ${i + 1} value(s)`] = val;
    r[`Attribute ${i + 1} visible`] = 1;
    r[`Attribute ${i + 1} global`] = 1;
  });

  randuri.push(r);
}

const caleCsv = join(aici, "date", `woocommerce-${LUNA}.csv`);
writeFileSync(caleCsv, [CAP.map(ghil).join(","), ...randuri.map((r) => randCsv(CAP, r))].join("\n") + "\n", "utf8");

/* ─── Produsele care nu există încă în magazin ─────────────────────────
   Importatorul WooCommerce nu poate face și una și alta într-o trecere.
   Scrie negru pe alb în ecranul lui: „Existing products that match by ID or
   SKU will be updated. Products that do not exist will be skipped."

   Deci cu bifa „Update existing products" pusă, cele 18 produse noi ar fi
   sărite în tăcere; fără ea, cele 141 existente ar da fiecare o eroare de
   SKU duplicat — 141 de rânduri roșii în care s-ar pierde o eroare adevărată.

   Două fișiere, două treceri, fiecare cu treaba ei. */
const skuInMagazin = new Set(inMagazin.map((w) => w.sku));
const noi = randuri.filter((r) => !skuInMagazin.has(r.SKU));
const caleNoi = join(aici, "date", `woocommerce-${LUNA}-noi.csv`);
writeFileSync(caleNoi, [CAP.map(ghil).join(","), ...noi.map((r) => randCsv(CAP, r))].join("\n") + "\n", "utf8");

/* ─── Cele care ies din catalog ───────────────────────────────────────── */
const inCatalog = new Set(u.produse.map((p) => p.sku));
const deCiornit = inMagazin.filter((w) => !inCatalog.has(w.sku));
const CAP2 = ["SKU", "Published"];
const caleCiorne = join(aici, "date", `woocommerce-${LUNA}-ciorne.csv`);
writeFileSync(
  caleCiorne,
  [CAP2.map(ghil).join(","), ...deCiornit.map((w) => [ghil(w.sku), ghil(-1)].join(","))].join("\n") + "\n",
  "utf8",
);

/* ─── Raportul ────────────────────────────────────────────────────────── */
const cuPret = randuri.filter((r) => r["Regular price"]).length;
const cuDescriere = randuri.filter((r) => r.Description.length > 200).length;
const cuVolum = randuri.filter((r) => r["Meta: _pret_volum"]).length;
const cuB2b = randuri.filter((r) => r["Meta: _pret_b2b_eur"]).length;

let md = `# Import WooCommerce — ${eticheta}\n\n`;
md += `Generat ${new Date().toISOString().slice(0, 16).replace("T", " ")} din \`unificat-${LUNA}.json\`.\n\n`;
md += `## Fișiere\n\n`;
md += `| Fișier | Rânduri | Ce face |\n|---|---:|---|\n`;
md += `| \`woocommerce-${LUNA}.csv\` | ${randuri.length} | creează sau actualizează, potrivite după SKU |\n`;
md += `| \`woocommerce-${LUNA}-ciorne.csv\` | ${deCiornit.length} | trece pe ciornă ce nu mai e în catalog |\n\n`;
md += `## Ce conține\n\n`;
md += `| | |\n|---|---:|\n`;
md += `| Produse | ${randuri.length} |\n`;
md += `| Cu preț în lei | ${cuPret} |\n`;
md += `| **Fără preț** (apar „la cerere") | **${randuri.length - cuPret}** |\n`;
md += `| Cu descriere din OpenCart | ${cuDescriere} |\n`;
md += `| Fără descriere | ${randuri.length - cuDescriere} |\n`;
md += `| Cu preț la volum | ${cuVolum} |\n`;
md += `| Cu preț de partener (B2B, €) | ${cuB2b} |\n`;
md += `| Cu fotografie | 0 — se leagă separat |\n\n`;

if (respinse.length) {
  md += `## Prețuri citite de pe solarone.ro și RESPINSE — ${respinse.length}\n\n`;
  md += `Potrivirea pe site-ul public e aproximativă, deci rezultatul trece prin două verificări: raportul față de prețul din catalog (între ${RAPORT_MIN} și ${RAPORT_MAX}) și regula „o pagină, un produs". Astea n-au trecut, deci produsele rămân „la cerere".\n\n`;
  md += `| SKU | Preț citit | Raport | Motivul respingerii |\n|---|---:|---:|---|\n`;
  for (const r of respinse) {
    md += `| \`${r.sku}\` | ${r.pretRon.toFixed(2)} | ${r.raport ? r.raport.toFixed(2) : "—"} | ${r.motiv} |\n`;
  }
  md += `\n`;
}

md += `## Produse fără preț — ${faraPret.length}\n\n`;
md += `Intră pe site cu „preț la cerere". Prețul de partener din catalog e salvat în \`_pret_b2b_eur\`, dar nu se afișează.\n\n`;
md += `| SKU | Produs | Secțiune | Catalog € |\n|---|---|---|---:|\n`;
for (const p of faraPret) md += `| \`${p.sku}\` | ${p.nume.replace(/\|/g, "/")} | ${p.sectiune} | ${p.pret.catalogEur ?? "la cerere"} |\n`;
md += `\n`;

md += `## Produse care ies de pe site — ${deCiornit.length}\n\n`;
md += `Sunt în magazin, nu mai sunt în catalogul lunii. Trec pe ciornă, nu se șterg.\n\n`;
md += `| SKU | Produs |\n|---|---|\n`;
for (const w of deCiornit) md += `| \`${w.sku}\` | ${(w.nume ?? "").replace(/\|/g, "/")} |\n`;
md += `\n`;

const caleMd = join(aici, "date", `import-${LUNA}.md`);
writeFileSync(caleMd, md, "utf8");

console.error(`
Scris:
  ${caleCsv}
  ${caleCiorne}
  ${caleMd}

  produse ................... ${randuri.length}
  cu pret in lei ............ ${cuPret}
  FARA pret ................. ${randuri.length - cuPret}
  cu descriere .............. ${cuDescriere}
  cu pret la volum .......... ${cuVolum}
  cu pret de partener (EUR) . ${cuB2b}
  de creat (fisier separat) . ${noi.length}
  de trecut pe ciorna ....... ${deCiornit.length}
`);
