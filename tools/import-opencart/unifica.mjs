/**
 * SURSA UNICĂ DE ADEVĂR PENTRU UN CATALOG LUNAR
 * ═════════════════════════════════════════════════════════════════════════
 * Adună într-un singur fișier tot ce știm despre produsele dintr-un catalog
 * Solar One, și scrie alături un raport de citit cu ochiul.
 *
 *   node tools/import-opencart/unifica.mjs --catalog "<cale PDF>" [--luna 2026-10]
 *
 * ─── CINE DECIDE CE ───────────────────────────────────────────────────────
 *
 * Catalogul PDF e litera de lege: el spune CARE produse există și la ce preț.
 * Nimic din altă parte nu adaugă un produs care nu e în el.
 *
 * Exportul OpenCart e ajutor: aduce fotografia, descrierea, categoria, slug-ul
 * SEO și starea de stoc pentru produsele pe care catalogul le-a numit deja.
 * Fișierul de labeluri aduce etichetele de pe site (Stoc Epuizat, Reduceri).
 *
 * Regula asta e întreaga miză a fișierului. Până acum, site-ul lua produsele
 * din WooCommerce, care le luase din OpenCart — unde sunt 400 de produse
 * active, față de 159 în catalog. Peste jumătate din ce se vedea pe site nu
 * mai era de vânzare.
 *
 * ─── DE CE SE PĂSTREAZĂ AMBELE PREȚURI ───────────────────────────────────
 *
 * Catalogul e „CATALOG PARTENERI", iar prețurile lui sunt în EUR fără TVA.
 * Prețul public din OpenCart, împărțit la cel din catalog, dă un raport cu
 * mediana 6,09 — imposibil ca schimb valutar. Prețul B2B din OpenCart dă 5,27,
 * adică exact un curs plauzibil.
 *
 * Deci cele două nu sunt același preț în monede diferite: catalogul e prețul
 * de partener, iar OpenCart-ul public e acela plus adaos.
 *
 * Fișierul le ține pe amândouă, una lângă alta, cu raportul calculat. Care
 * dintre ele ajunge pe site e o decizie de afacere, nu de program, și se ia
 * citind raportul — nu se îngroapă aici.
 *
 * ─── CE IESE ──────────────────────────────────────────────────────────────
 *
 *   date/unificat-<luna>.json .... sursa unică, pentru pașii următori
 *   date/unificat-<luna>.md ...... același lucru, de citit
 *
 * Niciunul nu atinge serverul. Importul propriu-zis e pasul următor.
 * ═════════════════════════════════════════════════════════════════════════
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { citesteRegistru } from "./xlsx.mjs";

const aici = dirname(fileURLToPath(import.meta.url));

const opt = {};
for (let i = 2; i < process.argv.length; i += 2) opt[process.argv[i].replace(/^--/, "")] = process.argv[i + 1];
if (!opt.catalog) {
  console.error('folosire: node unifica.mjs --catalog "<cale PDF>" [--opencart <json>] [--labeluri <xlsx>] [--luna 2026-10]');
  process.exit(1);
}

/* ─── 1. Catalogul, prin parserul care există deja ────────────────────────
   parse-catalog.js citește PDF-ul cu pdftotext și scoate un CSV cu exact
   cheile pe care le citește site-ul (_pret_volum, _prag_volum, _unitate_pret).
   Îl rulăm în loc să-i rescriem logica: el știe deja secțiunile catalogului,
   greșelile de scriere din sursă și cazurile de denumire pe două rânduri. */
const temp = mkdtempSync(join(tmpdir(), "catalog-"));
execFileSync(process.execPath, [join(aici, "..", "catalog-import", "parse-catalog.js"), opt.catalog, temp], {
  stdio: ["ignore", "ignore", "inherit"],
});

/** Un CSV cu ghilimele, în tablou de obiecte după antet. */
function citesteCsv(cale) {
  const t = readFileSync(cale, "utf8");
  const randuri = [];
  let camp = "";
  let rand = [];
  let inGhilimele = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inGhilimele) {
      if (c === '"') {
        if (t[i + 1] === '"') { camp += '"'; i++; } else inGhilimele = false;
      } else camp += c;
    } else if (c === '"') inGhilimele = true;
    else if (c === ",") { rand.push(camp); camp = ""; }
    else if (c === "\n") { rand.push(camp); randuri.push(rand); rand = []; camp = ""; }
    else if (c !== "\r") camp += c;
  }
  if (camp || rand.length) { rand.push(camp); randuri.push(rand); }
  const cap = randuri.shift();
  return randuri.filter((r) => r.length > 1).map((r) => Object.fromEntries(cap.map((k, i) => [k, r[i] ?? ""])));
}

const dinCatalog = citesteCsv(join(temp, "solar-one-woocommerce.csv"));

/* Dublurile din PDF sunt repetiții de machetare, nu produse.
   Jinko JKM510N apare de trei ori, cu preț și categorie identice. Se
   păstrează prima apariție și se numără câte au fost, ca să se vadă în
   raport că am șters ceva și de ce. */
const catalog = [];
const repetate = new Map();
for (const r of dinCatalog) {
  const gasit = catalog.find((x) => x.SKU === r.SKU);
  if (gasit) { repetate.set(r.SKU, (repetate.get(r.SKU) ?? 1) + 1); continue; }
  catalog.push(r);
}

/* ─── 2. Exportul OpenCart ────────────────────────────────────────────── */
const caleOc = opt.opencart ?? join(aici, "date", "opencart-2026-09-25.json");
const oc = JSON.parse(readFileSync(caleOc, "utf8"));

const numeCategorii = new Map(oc.categorii.map((c) => [c.category_id, c.name]));
const numeProducatori = new Map(oc.producatori.map((m) => [m.manufacturer_id, m.name]));
const numeStoc = new Map(oc.statusuriStoc.map((s) => [s.stock_status_id, s.name]));

const pozeExtra = new Map();
for (const i of oc.imagini) {
  if (!i.image) continue;
  if (!pozeExtra.has(i.product_id)) pozeExtra.set(i.product_id, []);
  pozeExtra.get(i.product_id).push(i.image);
}

const slugProdus = new Map();
for (const s of oc.seoUrl) {
  const m = /^product_id=(\d+)$/.exec(s.query ?? "");
  if (m) slugProdus.set(Number(m[1]), s.keyword);
}

const categoriiProdus = new Map();
for (const r of oc.produsCategorie) {
  if (!categoriiProdus.has(r.product_id)) categoriiProdus.set(r.product_id, []);
  categoriiProdus.get(r.product_id).push(numeCategorii.get(r.category_id) ?? String(r.category_id));
}

/** Cel mai mic preț pe care îl vede un grup de clienți, din oferte + reduceri. */
function pretGrup(id, grup) {
  let cel = null;
  for (const r of oc.oferteSpeciale) if (r.product_id === id && r.customer_group_id === grup) cel = cel === null ? r.price : Math.min(cel, r.price);
  for (const r of oc.reduceriCantitate) if (r.product_id === id && r.customer_group_id === grup) cel = cel === null ? r.price : Math.min(cel, r.price);
  return cel;
}

/* ─── 3. Etichetele de pe site ────────────────────────────────────────── */
const etichete = new Map();
if (opt.labeluri) {
  const foaie = citesteRegistru(opt.labeluri).get("Labeluri - produse") ?? [];
  for (const r of foaie) {
    const id = Number(r["ID produs"]);
    if (!id) continue;
    if (!etichete.has(id)) etichete.set(id, []);
    etichete.get(id).push({ nume: r["Nume label"], tip: r["Tip asociere"], eligibil: r["Eligibil în export"] === "Da" });
  }
}

/* ─── 4. Potrivirea ───────────────────────────────────────────────────────
   Trei trepte, de la sigur la nesigur, iar treapta folosită se scrie în
   rezultat. Un produs potrivit după denumire nu e același lucru cu unul
   potrivit după cod de model, iar raportul trebuie să arate diferența — o
   potrivire greșită pune fotografia altui produs lângă prețul ăstuia. */
/* Diacriticele se scot pe ambele părți.
   Catalogul scrie „Sina aluminiu", OpenCart scrie „Șină aluminiu". Fără
   normalizare, „Ș" și „ă" cad la filtrul de caractere și cele două cuvinte
   devin „SIN" și „SIN" — sau, mai rău, se scurtează diferit. */
const cheie = (s) =>
  (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const cuvinte = (s) =>
  (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3);

const dupaCod = new Map();
for (const p of oc.produse) {
  for (const v of [p.model, p.sku]) {
    const k = cheie(v);
    if (k.length > 3) {
      if (!dupaCod.has(k)) dupaCod.set(k, []);
      dupaCod.get(k).push(p);
    }
  }
}

/* Al doilea index: modelul OpenCart ca JETON, oricât de scurt.
   AICI A FOST DEFECTUL CARE A COSTAT CEL MAI MULT. Indexul de mai sus cere
   modele de peste trei caractere, ca să nu se potrivească orice. Dar
   acumulatorii Pytes au modelele „V5a", „V12", „V15" — exact trei sau mai
   puțin. Rezultatul: PYTES V15 apărea ca „produs fără corespondent", deși
   stătea în export cu 9.785 lei, iar eu mă pregăteam să-i caut prețul pe
   solarone.ro. Un cod scurt nu e un cod mai puțin adevărat.
   Aici modelul scurt e admis, dar potrivirea trece doar dacă se confirmă și
   din denumire — vezi `potriveste`. */
const dupaJeton = new Map();
for (const p of oc.produse) {
  const k = cheie(p.model);
  if (k.length >= 2) {
    if (!dupaJeton.has(k)) dupaJeton.set(k, []);
    dupaJeton.get(k).push(p);
  }
}

function potriveste(r) {
  const k = cheie(r.SKU);
  if (k && dupaCod.has(k)) return [dupaCod.get(k), "cod"];

  // Codul catalogului poate fi mai lung sau mai scurt decât modelul OpenCart
  // („SUN-5K-SG03LP1-EU" vs „SUN5KSG03LP1"). Se acceptă doar dacă e o singură
  // potrivire: două ar însemna că nu știm care.
  if (k.length > 5) {
    const candidati = [...dupaCod.entries()].filter(([kk]) => kk.length > 5 && (kk.includes(k) || k.includes(kk)));
    if (candidati.length === 1) return [candidati[0][1], "cod-partial"];
  }

  // Modelul OpenCart, căutat ca jeton în SKU-ul și denumirea din catalog.
  //
  // „PYTES-V15-14-34KWH" se desface în [pytes, v15, 14, 34kwh]; modelul
  // OpenCart „V15" e printre ele. Un jeton scurt singur n-ar dovedi nimic —
  // „V5" s-ar potrivi la orice — deci se cere ȘI ca denumirile să se
  // suprapună pe jumătate. Câștigă modelul cel mai lung dintre cele care trec.
  const jetoane = new Set(
    [...(r.SKU ?? "").split(/[^A-Za-z0-9.]+/), ...(r.Name ?? "").split(/[^A-Za-z0-9.]+/)]
      .map(cheie)
      .filter((x) => x.length >= 2),
  );
  const cuv = cuvinte(r.Name);
  if (jetoane.size && cuv.length) {
    const gasite = [];
    for (const [k, lista] of dupaJeton) {
      if (!jetoane.has(k)) continue;
      for (const p of lista) {
        const n = cuvinte(p.name);
        const comune = cuv.filter((x) => n.includes(x)).length;
        const acoperire = comune / cuv.length;
        if (acoperire >= 0.5) gasite.push([k.length, acoperire, p]);
      }
    }
    if (gasite.length) {
      gasite.sort((a, b) => b[0] - a[0] || b[1] - a[1] || (b[2].status === 1) - (a[2].status === 1));
      return [[gasite[0][2]], "model-jeton"];
    }
  }

  // Denumirea aproape identică.
  //
  // Jumătate din SKU-urile catalogului sunt inventate de parser din denumire,
  // fiindcă produsul n-are cod tipărit în PDF. Pentru ele niciun index pe cod
  // n-are ce potrivi — dar DENUMIREA e aceeași în ambele surse, adesea literă
  // cu literă: „Sistem de montaj panouri fotovoltaice PB-098, montare acoperis
  // plat" apare la fel în catalog și în OpenCart, unde modelul e „XFS_PB098".
  //
  // Am ratat asta la prima variantă și era să caut prețurile pe solarone.ro
  // pentru produse care stăteau în export. PB-098: 310 lei, acolo, tot timpul.
  //
  // Acoperirea se cere în AMBELE sensuri. Doar dinspre catalog, „Clemă de
  // capăt" s-ar potrivi la „Clemă de capăt universală Single Rail pentru
  // panouri 35mm" și la încă cinci; cerând ca și denumirea OpenCart să fie
  // acoperită pe jumătate, rămâne cea scurtă, adică cea bună.
  const jetNume = (s) =>
    new Set(
      (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
        .split(/[^a-z0-9.]+/).filter((x) => x.length >= 2),
    );
  const A = jetNume(r.Name);
  if (A.size >= 2) {
    const scoruri = [];
    for (const p of oc.produse) {
      const B = jetNume(p.name);
      if (!B.size) continue;
      let comune = 0;
      for (const x of A) if (B.has(x)) comune++;
      const acopA = comune / A.size;
      const acopB = comune / B.size;
      if (acopA >= 0.8 && acopB >= 0.5) scoruri.push([acopA + acopB, acopA, p]);
    }
    if (scoruri.length) {
      scoruri.sort((a, b) => b[0] - a[0] || (b[2].status === 1) - (a[2].status === 1));
      const capi = scoruri.filter(([s]) => Math.abs(s - scoruri[0][0]) < 1e-9);
      const idUnic = new Set(capi.map(([, , p]) => p.product_id)).size === 1;
      if (capi.length === 1 || idUnic) return [[scoruri[0][2]], "denumire-tare"];
      return [capi.map(([, , p]) => p), "denumire-ambigua"];
    }
  }

  // Potrivirea după denumire se punctează, nu se filtrează.
  //
  // AICI A FOST UN DEFECT, prins la prima rulare: „Cablu solar 6mm² Tambur
  // 500m – Negru" și „…– Rosu" au primit AMÂNDOUĂ același produs OpenCart.
  // Filtrul cerea patru cuvinte comune, iar „cablu solar tambur 500m" erau
  // deja patru — culoarea, singurul lucru care le deosebește, nu mai conta.
  //
  // Acum câștigă cel cu cele mai multe cuvinte comune, iar dacă primii doi
  // sunt la egalitate, potrivirea se declară ambiguă: mai bine un produs fără
  // fotografie decât unul cu fotografia altuia.
  const w = cuvinte(r.Name);
  if (w.length >= 3) {
    const punctaje = [];
    for (const p of oc.produse) {
      const n = (p.name ?? "").toUpperCase();
      const scor = w.filter((x) => n.includes(x)).length;
      if (scor >= Math.min(4, w.length)) punctaje.push([scor, p]);
    }
    punctaje.sort((a, b) => b[0] - a[0] || (b[1].status === 1) - (a[1].status === 1));
    if (punctaje.length === 1) return [[punctaje[0][1]], "denumire"];
    if (punctaje.length > 1) {
      const capi = punctaje.filter(([s]) => s === punctaje[0][0]);
      // Egalitate între produse diferite = nu știm care. Excepție: dacă toate
      // au același product_id (același produs găsit pe două chei), e sigur.
      const idUnic = new Set(capi.map(([, p]) => p.product_id)).size === 1;
      if (capi.length === 1 || idUnic) return [[punctaje[0][1]], "denumire"];
      return [capi.map(([, p]) => p), "denumire-ambigua"];
    }
  }
  return [null, "lipsa"];
}

/* ─── 5. Unificarea ──────────────────────────────────────────────────── */
const luna = opt.luna ?? new Date().toISOString().slice(0, 7);
const produse = [];

for (const r of catalog) {
  const [gasiti, fel] = potriveste(r);
  // Dintre mai mulți candidați se ia cel activ; dacă niciunul nu e activ, tot
  // primul — dar atunci raportul arată că produsul e dezactivat în OpenCart.
  //
  // La potrivirea ambiguă NU se ia niciunul: candidații se trec în raport, iar
  // produsul rămâne fără conținut până alege un om. O legătură greșită pune
  // fotografia și descrierea altui produs sub prețul ăstuia — greșeală care se
  // vede pe site și nu se vede în date.
  const p = gasiti && fel !== "denumire-ambigua" ? (gasiti.find((x) => x.status === 1) ?? gasiti[0]) : null;
  const candidati = fel === "denumire-ambigua" ? gasiti.map((x) => ({ id: x.product_id, model: x.model, nume: x.name })) : null;

  const eur = parseFloat(r["Regular price"]);
  const volumEur = parseFloat(r["Meta: _pret_volum"]);
  const cale = r.Categories.split(">").map((s) => s.trim());

  const atribute = {};
  for (let i = 1; i <= 6; i++) {
    const nume = r[`Attribute ${i} name`];
    if (nume) atribute[nume] = r[`Attribute ${i} value(s)`];
  }

  const publicRon = p && p.price > 0 ? p.price : null;
  const b2bRon = p ? pretGrup(p.product_id, 3) : null;

  const lipsuri = [];
  if (!p) lipsuri.push("fara-corespondent");
  else {
    if (!p.image) lipsuri.push("fara-poza");
    if (!p.description || p.description.length < 200) lipsuri.push("fara-descriere");
    if (p.description && p.description.length >= 32760) lipsuri.push("descriere-taiata");
    if (p.status !== 1) lipsuri.push("dezactivat-in-opencart");
  }
  if (!(eur > 0)) lipsuri.push("fara-pret");

  produse.push({
    sku: r.SKU,
    nume: r.Name,
    sectiune: cale[0],
    subsectiune: cale[1] ?? null,
    evidentiat: r["Is featured?"] === "1",
    repetariInPdf: repetate.get(r.SKU) ?? 1,
    pret: {
      catalogEur: eur > 0 ? eur : null,
      volumEur: volumEur > 0 ? volumEur : null,
      pragVolum: r["Meta: _prag_volum"] || null,
      unitate: r["Meta: _unitate_pret"] || null,
      container: r["Meta: _pret_container"] || null,
      laCerere: !(eur > 0),
    },
    atribute,
    capacitateKwh: r["Meta: _capacitate_kwh"] || null,
    potrivire: fel,
    candidati,
    opencart: p
      ? {
          id: p.product_id,
          model: p.model,
          activ: p.status === 1,
          publicRon,
          b2bRon,
          raportPublic: publicRon && eur > 0 ? +(publicRon / eur).toFixed(3) : null,
          raportB2b: b2bRon && eur > 0 ? +(b2bRon / eur).toFixed(3) : null,
          poza: p.image || null,
          pozeExtra: pozeExtra.get(p.product_id) ?? [],
          slug: slugProdus.get(p.product_id) ?? null,
          stoc: numeStoc.get(p.stock_status_id) ?? null,
          cantitate: p.quantity,
          producator: numeProducatori.get(p.manufacturer_id) ?? null,
          categoriiOpencart: categoriiProdus.get(p.product_id) ?? [],
          lungimeDescriere: (p.description ?? "").length,
          descriere: p.description ?? null,
          etichete: (etichete.get(p.product_id) ?? []).filter((e) => e.eligibil).map((e) => e.nume),
        }
      : null,
    lipsuri,
  });
}

const iesire = {
  luna,
  generatLa: new Date().toISOString(),
  surse: { catalog: opt.catalog, opencart: caleOc, labeluri: opt.labeluri ?? null },
  regula: "Catalogul PDF decide CARE produse există. OpenCart aduce doar conținut pentru ele.",
  produse,
};

mkdirSync(join(aici, "date"), { recursive: true });
const caleJson = join(aici, "date", `unificat-${luna}.json`);
writeFileSync(caleJson, JSON.stringify(iesire, null, 1));

/* ─── 6. Raportul de citit ─────────────────────────────────────────────
   JSON-ul are 2 MB și descrieri de 17.000 de caractere: nu se citește. Omul
   are nevoie de un tabel în care să vadă, pe un rând, dacă produsul are tot
   ce-i trebuie și cât de mult diferă cele două prețuri. */
const ban = (v) => (v == null ? "—" : v.toLocaleString("ro-RO", { minimumFractionDigits: 0, maximumFractionDigits: 0 }));
const r2 = (v) => (v == null ? "—" : v.toFixed(2));

const sectiuni = [...new Set(produse.map((p) => p.sectiune))].sort();
let md = `# Catalog unificat — ${luna}\n\n`;
md += `Generat ${iesire.generatLa.slice(0, 16).replace("T", " ")} din:\n\n`;
md += `- \`${opt.catalog.split(/[\\/]/).pop()}\`\n- \`${caleOc.split(/[\\/]/).pop()}\`\n`;
md += opt.labeluri ? `- \`${opt.labeluri.split(/[\\/]/).pop()}\`\n` : "";
md += `\n**${iesire.regula}**\n\n`;

const nr = produse.length;
const cu = produse.filter((p) => p.opencart).length;
const fara = produse.filter((p) => p.potrivire === "lipsa");
const ambigue = produse.filter((p) => p.potrivire === "denumire-ambigua");

/* Același produs OpenCart legat la două poziții din catalog.
   E un semn sigur de potrivire greșită: două produse diferite din catalog
   n-au cum să fie același produs în magazin. Verificarea e ieftină și prinde
   exact cazul pe care punctajul de mai sus l-ar putea rata. */
const pePozitie = new Map();
for (const p of produse) if (p.opencart) {
  if (!pePozitie.has(p.opencart.id)) pePozitie.set(p.opencart.id, []);
  pePozitie.get(p.opencart.id).push(p);
}
const suprapuse = [...pePozitie.values()].filter((v) => v.length > 1);
const taiate = produse.filter((p) => p.lipsuri.includes("descriere-taiata"));
md += `## Pe scurt\n\n`;
md += `| | |\n|---|---:|\n`;
md += `| Produse distincte în catalog | ${nr} |\n`;
md += `| Cu corespondent în OpenBcart (poză + descriere) | ${cu} |\n`.replace("OpenBcart", "OpenCart");
md += `| **Fără corespondent** — de completat manual | **${fara.length}** |\n`;
md += `| Potrivite după cod de model | ${produse.filter((p) => p.potrivire === "cod").length} |\n`;
md += `| Potrivite după cod parțial | ${produse.filter((p) => p.potrivire === "cod-partial").length} |\n`;
md += `| Potrivite doar după denumire (de verificat) | ${produse.filter((p) => p.potrivire === "denumire").length} |\n`;
md += `| **Potrivire ambiguă** — lăsate nelegate | **${ambigue.length}** |\n`;
md += `| **Același produs OpenCart legat de două ori** | **${suprapuse.length}** |\n`;
md += `| Fără preț („la cerere") | ${produse.filter((p) => p.pret.laCerere).length} |\n`;
md += `| Cu preț la volum | ${produse.filter((p) => p.pret.volumEur).length} |\n`;
md += `| Ofertele lunii | ${produse.filter((p) => p.evidentiat).length} |\n`;
md += `| Descrieri tăiate de Excel | ${taiate.length} |\n`;
md += `| Fotografii distincte necesare | ${new Set(produse.flatMap((p) => (p.opencart ? [p.opencart.poza, ...p.opencart.pozeExtra] : [])).filter(Boolean)).size} |\n\n`;

const rap = produse.map((p) => p.opencart?.raportPublic).filter(Boolean).sort((a, b) => a - b);
if (rap.length) {
  md += `## Cele două niveluri de preț\n\n`;
  md += `Raportul dintre prețul public din OpenCart (RON) și cel din catalog (EUR), pe ${rap.length} produse comparabile: `;
  md += `minim **${r2(rap[0])}**, mediană **${r2(rap[Math.floor(rap.length / 2)])}**, maxim **${r2(rap[rap.length - 1])}**.\n\n`;
  md += `Cursul real e în jur de 5,0–5,1. Tot ce e peste înseamnă adaos, nu schimb valutar.\n\n`;
}

for (const s of sectiuni) {
  const ale = produse.filter((p) => p.sectiune === s);
  md += `## ${s} — ${ale.length}\n\n`;
  md += `| SKU | Produs | Catalog € | Volum € | Public RON | B2B RON | ×EUR | Poză | Descr. | Potrivire |\n`;
  md += `|---|---|---:|---:|---:|---:|---:|:-:|---:|---|\n`;
  for (const p of ale.sort((a, b) => (a.subsectiune ?? "").localeCompare(b.subsectiune ?? "") || a.nume.localeCompare(b.nume))) {
    const o = p.opencart;
    md += `| \`${p.sku}\` | ${p.nume.replace(/\|/g, "/")}${p.subsectiune ? ` <br><sub>${p.subsectiune}</sub>` : ""} `;
    md += `| ${p.pret.catalogEur ?? "la cerere"} | ${p.pret.volumEur ?? "—"} `;
    md += `| ${ban(o?.publicRon)} | ${ban(o?.b2bRon)} | ${r2(o?.raportPublic)} `;
    md += `| ${o?.poza ? "da" : "**NU**"} | ${o ? o.lungimeDescriere.toLocaleString("ro-RO") : "**—**"} | ${p.potrivire} |\n`;
  }
  md += `\n`;
}

if (fara.length) {
  md += `## Fără corespondent în OpenCart — ${fara.length}\n\n`;
  md += `Pentru astea avem doar denumirea și prețul din catalog. Nu au fotografie, descriere, slug SEO sau categorie moștenită.\n\n`;
  md += `| SKU | Produs | Secțiune | Catalog € |\n|---|---|---|---:|\n`;
  for (const p of fara) md += `| \`${p.sku}\` | ${p.nume.replace(/\|/g, "/")} | ${p.sectiune}${p.subsectiune ? " › " + p.subsectiune : ""} | ${p.pret.catalogEur ?? "la cerere"} |\n`;
  md += `\n`;
}

if (suprapuse.length) {
  md += `## Același produs OpenCart legat de două poziții din catalog — ${suprapuse.length}\n\n`;
  md += `Două poziții diferite din catalog nu pot fi același produs în magazin. Una dintre ele are conținut greșit.\n\n`;
  for (const g of suprapuse) {
    md += `**${g[0].opencart.nume ?? g[0].opencart.model}** (id ${g[0].opencart.id}) e legat de:\n\n`;
    for (const p of g) md += `- \`${p.sku}\` — ${p.nume} *(${p.potrivire})*\n`;
    md += `\n`;
  }
}

if (ambigue.length) {
  md += `## Potrivire ambiguă — ${ambigue.length}\n\n`;
  md += `Mai mulți candidați cu același punctaj. Nu le-am legat de nimic: mai bine fără fotografie decât cu fotografia altui produs. Alege tu, sau le tratăm ca produse noi.\n\n`;
  for (const p of ambigue) {
    md += `**\`${p.sku}\`** — ${p.nume} · ${p.pret.catalogEur ?? "la cerere"} €\n\n`;
    for (const c of p.candidati) md += `- id ${c.id}, \`${c.model}\` — ${c.nume}\n`;
    md += `\n`;
  }
}

const deVerificat = produse.filter((p) => p.potrivire === "denumire" || p.potrivire === "cod-partial" || p.potrivire === "model-jeton" || p.potrivire === "denumire-tare");
if (deVerificat.length) {
  md += `## De verificat cu ochiul — ${deVerificat.length}\n\n`;
  md += `Potrivite fără cod de model exact. O potrivire greșită pune fotografia altui produs lângă prețul ăstuia.\n\n`;
  md += `| SKU catalog | Produs din catalog | Model OpenCart | Produs OpenCart | Fel |\n|---|---|---|---|---|\n`;
  for (const p of deVerificat) md += `| \`${p.sku}\` | ${p.nume.replace(/\|/g, "/")} | \`${p.opencart?.model ?? "—"}\` | ${(p.opencart ? oc.produse.find((x) => x.product_id === p.opencart.id)?.name : "—")?.replace(/\|/g, "/")} | ${p.potrivire} |\n`;
  md += `\n`;
}

const caleMd = join(aici, "date", `unificat-${luna}.md`);
writeFileSync(caleMd, md);

console.error(`
Scris:
  ${caleJson}
  ${caleMd}

  produse distincte ............ ${nr}${repetate.size ? `   (${[...repetate.values()].reduce((s, v) => s + v - 1, 0)} repetări de machetare eliminate)` : ""}
  cu corespondent OpenCart ..... ${cu}
  FARA corespondent ............ ${fara.length}
  potrivire dupa cod ........... ${produse.filter((p) => p.potrivire === "cod").length}
  potrivire dupa cod partial ... ${produse.filter((p) => p.potrivire === "cod-partial").length}
  potrivire model ca jeton ..... ${produse.filter((p) => p.potrivire === "model-jeton").length}
  potrivire denumire tare ...... ${produse.filter((p) => p.potrivire === "denumire-tare").length}
  potrivire dupa denumire ...... ${produse.filter((p) => p.potrivire === "denumire").length}
  potrivire AMBIGUA (nelegate) . ${ambigue.length}
  acelasi produs legat de 2 ori  ${suprapuse.length}
  fotografii necesare .......... ${new Set(produse.flatMap((p) => (p.opencart ? [p.opencart.poza, ...p.opencart.pozeExtra] : [])).filter(Boolean)).size}
`);
