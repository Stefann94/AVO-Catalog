/**
 * DOSAR DE COMPARAȚIE PENTRU FOTOGRAFIILE DE PRODUS
 * ═════════════════════════════════════════════════════════════════════════
 * Scoate pe Desktop, într-un folder, fotografia pe care o are acum magazinul
 * și pe cea care ar ieși din originalul de pe solarone.ro — amândouă aduse la
 * mărimile la care site-ul chiar le afișează, în formatul pe care îl servește.
 * Plus o pagină care le pune una lângă alta.
 *
 *   node tools/imagini/compara-poze.mjs [--cate 12] [--pauza 2500]
 *
 * ─── DE CE NU E DE AJUNS SĂ TE UIȚI ÎN BIBLIOTECA MEDIA ──────────────────
 *
 * Acolo se vede sursa, iar sursa nu ajunge niciodată la vizitator. Construcția
 * o taie la lățimea de care are nevoie pagina și o re-encodează în AVIF. Un
 * PNG de 1,1 MB și un WebP de 6 KB pot arăta la fel în bibliotecă, la
 * dimensiune mică, și complet diferit după ce trec prin asta.
 *
 * Deci comparația se face pe ce vede omul: AVIF, la 300px (cardul din listă)
 * și 600px (fișa de produs).
 *
 * ─── DE CE DOAR UN EȘANTION ──────────────────────────────────────────────
 *
 * Fiecare produs înseamnă două descărcări, una de la magazin și una de la
 * solarone.ro. Pentru toate cele 114 ar fi 228 de cereri, dintre care 114
 * către magazinul care funcționează — pentru o decizie care se ia uitându-te
 * la zece.
 * ═════════════════════════════════════════════════════════════════════════
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const aici = dirname(fileURLToPath(import.meta.url));
const radacina = join(aici, "..", "..");

const opt = {};
for (let i = 2; i < process.argv.length; i += 2) opt[process.argv[i].replace(/^--/, "")] = process.argv[i + 1];
const CATE = Number(opt.cate ?? 12);
const PAUZA = Number(opt.pauza ?? 2500);
const LUNA = opt.luna ?? "2026-10";
const IESIRE = opt.iesire ?? "C:/Users/Sony/Desktop/COMPARATIE POZE";

/** Lățimile la care site-ul afișează fotografiile, și calitatea AVIF folosită. */
const LATIMI = [300, 600];
const CALITATE = 55;

const env = Object.fromEntries(
  readFileSync(join(radacina, "tools/wordpress/.env.local"), "utf8")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const BAZA = env.WP_URL.replace(/\/+$/, "");
const auth = "Basic " + Buffer.from(`${env.WC_KEY}:${env.WC_SECRET}`).toString("base64");
const asteapta = (ms) => new Promise((r) => setTimeout(r, ms));
const kb = (n) => (n / 1024).toFixed(1);

/* ─── Cine are poză veche ─────────────────────────────────────────────── */
const unificat = JSON.parse(readFileSync(join(radacina, "tools/import-opencart/date", `unificat-${LUNA}.json`), "utf8"));
const dupaSku = new Map(unificat.produse.map((p) => [p.sku, p]));
const urcateAcum = existsSync(join(radacina, "tools/import-opencart/date", `poze-urcate-${LUNA}.json`))
  ? new Set(Object.keys(JSON.parse(readFileSync(join(radacina, "tools/import-opencart/date", `poze-urcate-${LUNA}.json`), "utf8")).urcate))
  : new Set();

console.error("Iau lista de produse...");
const produse = [];
for (let p = 1; p <= 2; p++) {
  const r = await fetch(`${BAZA}/wp-json/wc/v3/products?per_page=100&status=publish&page=${p}`, { headers: { Authorization: auth } });
  const d = await r.json();
  produse.push(...d);
  if (d.length < 100) break;
  await asteapta(PAUZA);
}

/* Cele care au poză veche: au imagine, dar NU au fost atinse de noi azi.
   Se iau cele mai grele dintre ele — acolo diferența e cea mai vizibilă —
   dar amestecate pe categorii, ca să nu iasă zece panouri identice. */
const candidate = [];
for (const x of produse) {
  const im = (x.images ?? []).filter((i) => !/placeholder/i.test(i.src))[0];
  if (!im || urcateAcum.has(x.sku)) continue;
  const p = dupaSku.get(x.sku);
  if (!p?.opencart?.poza) continue;
  candidate.push({
    sku: x.sku,
    nume: x.name,
    sectiune: p.sectiune,
    acum: im.src,
    original: "https://www.solarone.ro/image/" + p.opencart.poza.split("/").map(encodeURIComponent).join("/"),
  });
}

const peSectiune = new Map();
for (const c of candidate) {
  if (!peSectiune.has(c.sectiune)) peSectiune.set(c.sectiune, []);
  peSectiune.get(c.sectiune).push(c);
}
const alese = [];
let tura = 0;
while (alese.length < CATE && tura < 20) {
  for (const lista of peSectiune.values()) if (lista[tura] && alese.length < CATE) alese.push(lista[tura]);
  tura++;
}

console.error(`Produse cu poză veche: ${candidate.length}. Compar ${alese.length}.\n`);
mkdirSync(IESIRE, { recursive: true });

/* ─── Comparația ──────────────────────────────────────────────────────── */
const randuri = [];
for (const c of alese) {
  try {
    const ia = async (u) => {
      const r = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0 Chrome/131.0" } });
      if (!r.ok) throw new Error(`HTTP ${r.status} la ${u.slice(0, 60)}`);
      return Buffer.from(await r.arrayBuffer());
    };

    const acum = await ia(c.acum);
    await asteapta(PAUZA);
    const orig = await ia(c.original);
    await asteapta(PAUZA);

    const mA = await sharp(acum).metadata();
    const mO = await sharp(orig).metadata();
    const nume = c.sku.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const iesiri = { sku: c.sku, nume: c.nume, sectiune: c.sectiune, sursaAcum: `${mA.width}x${mA.height} ${mA.format} ${kb(acum.length)} KB`, sursaNoua: `${mO.width}x${mO.height} ${mO.format} ${kb(orig.length)} KB`, variante: [] };

    for (const w of LATIMI) {
      const a = await sharp(acum).resize({ width: w, withoutEnlargement: true }).avif({ quality: CALITATE, effort: 4 }).toBuffer();
      const o = await sharp(orig).resize({ width: w, withoutEnlargement: true }).avif({ quality: CALITATE, effort: 4 }).toBuffer();
      writeFileSync(join(IESIRE, `${nume}-${w}-ACUM.avif`), a);
      writeFileSync(join(IESIRE, `${nume}-${w}-NOU.avif`), o);
      iesiri.variante.push({ latime: w, acum: a.length, nou: o.length, fisierAcum: `${nume}-${w}-ACUM.avif`, fisierNou: `${nume}-${w}-NOU.avif` });
    }

    randuri.push(iesiri);
    console.error(`  ${c.sku.padEnd(30).slice(0, 30)} ${iesiri.sursaAcum.padEnd(26)} -> ${iesiri.sursaNoua}`);
  } catch (e) {
    console.error(`  ! ${c.sku}: ${e.message}`);
  }
}

/* ─── Pagina de comparat ──────────────────────────────────────────────── */
let h = `<!doctype html><html lang="ro"><meta charset="utf-8">
<title>Comparație fotografii — ${LUNA}</title>
<style>
 :root{color-scheme:light dark}
 body{font:15px/1.6 system-ui,Segoe UI,sans-serif;margin:0;padding:32px;background:#0f1115;color:#e8eaed}
 h1{font-size:22px;margin:0 0 6px}
 .sub{color:#9aa0a6;margin:0 0 28px;max-width:70ch}
 .p{border:1px solid #2a2e36;border-radius:14px;padding:20px;margin:0 0 20px;background:#161922}
 .t{font-weight:600;margin:0 0 2px}
 .m{color:#9aa0a6;font-size:13px;margin:0 0 16px}
 .g{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px}
 .c{background:#0f1115;border:1px solid #262a33;border-radius:10px;padding:14px;text-align:center}
 .c img{max-width:100%;height:auto;background:#fff;border-radius:6px;display:block;margin:0 auto 10px}
 .e{font-size:12px;color:#9aa0a6}
 .nou{color:#6ee7a8;font-weight:600}
 .vechi{color:#f0a868;font-weight:600}
</style>
<h1>Comparație fotografii — ce are magazinul acum față de originalul de pe solarone.ro</h1>
<p class="sub">Amândouă trecute prin aceeași prelucrare ca pe site: taiate la lățimea de afișare și encodate AVIF la calitate ${CALITATE}.
Pe stânga, ce iese din poza din magazin. Pe dreapta, ce iese din original. Marește pagina cu Ctrl + rotița mouse-ului ca să vezi detaliul.</p>
`;
for (const r of randuri) {
  h += `<div class="p"><p class="t">${r.nume}</p><p class="m">${r.sku} · ${r.sectiune}<br>sursa din magazin: ${r.sursaAcum} &nbsp;|&nbsp; original solarone.ro: ${r.sursaNoua}</p><div class="g">`;
  for (const v of r.variante) {
    h += `<div class="c"><img src="${v.fisierAcum}" alt=""><div class="e"><span class="vechi">ACUM</span> · ${v.latime}px · ${kb(v.acum)} KB</div></div>`;
    h += `<div class="c"><img src="${v.fisierNou}" alt=""><div class="e"><span class="nou">NOU</span> · ${v.latime}px · ${kb(v.nou)} KB</div></div>`;
  }
  h += `</div></div>`;
}
writeFileSync(join(IESIRE, "COMPARATIE.html"), h, "utf8");

const totalA = randuri.reduce((s, r) => s + r.variante.reduce((t, v) => t + v.acum, 0), 0);
const totalN = randuri.reduce((s, r) => s + r.variante.reduce((t, v) => t + v.nou, 0), 0);
console.error(`
Scris in: ${IESIRE}
  produse comparate .... ${randuri.length}
  greutate totala ACUM . ${kb(totalA)} KB
  greutate totala NOU .. ${kb(totalN)} KB
  Deschide COMPARATIE.html
`);
