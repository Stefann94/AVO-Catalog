#!/usr/bin/env node
/**
 * Caută pe deyeinverter.com fotografiile produselor Deye care n-au poză la noi.
 *
 *   node cauta-poze-deye.js [optiuni]
 *
 * NU URCĂ NIMIC. Scrie în `poze-produse-pas4/`, plus manifest. Nu cere nicio
 * credențială: lista produselor fără poză vine prin WPGraphQL, care e public.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * DE CE O UNEALTĂ SEPARATĂ DE CEA PENTRU SOLARONE
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Fiindcă problema e alta. La solarone.ro dificultatea era să GĂSEȘTI pagina;
 * codul era scris cinstit în datele structurate, deci verificarea era ușoară.
 * La Deye e invers: paginile se găsesc simplu — toate cele ~100 sunt listate pe
 * /product/ — dar niciuna nu poartă un cod de produs. Poartă o FAMILIE:
 *
 *   SUN-7.6/8/10/12K-SG02LP1-EU-AM2/AM3-P
 *
 * Un singur titlu care înseamnă opt produse: patru puteri × două sufixe. Al
 * nostru, „SUN-12K-SG02LP1-AM3", e unul dintre ele.
 *
 * ─── DESFACEREA, ȘI GREȘEALA CARE A COSTAT ───────────────────────────────
 *
 * Prima variantă rupea titlul la „/" și lua bucățile ca atare. Din
 * „SUN-7.6/8/10/12K-…" ieșeau „7.6", „8", „10" și „12K" — adică unitatea
 * rămânea lipită doar de ultima. Rezultatul se vedea exact: „SUN-12K-SG02LP1"
 * se potrivea, „SUN-10K-SG02LP1" nu, deși sunt în același titlu.
 *
 * Acum unitatea de la coada ultimei bucăți („K") se moștenește de toate
 * bucățile pur numerice. Desfacerea se repetă de câteva ori, fiindcă un titlu
 * poate avea două grupuri („…12K-SG02LP1-EU-AM2/AM3-P").
 *
 * ─── CUM SE CONFIRMĂ O POTRIVIRE ─────────────────────────────────────────
 *
 * Două căi, amândouă stricte:
 *
 *   PE MODEL ... fiecare jeton al codului nostru trebuie să apară într-una
 *                dintre variantele desfăcute din titlu. Ei pot avea în plus
 *                („-P", „EU"), dar nu poate lipsi nimic de-al nostru.
 *   PE PAGINĂ .. codul nostru, normalizat, apare în textul paginii. Asta prinde
 *                produsele care nu sunt invertoare și n-au titlu de familie —
 *                priza inteligentă, comutatorul, încărcătorul auto, dataloggerul.
 *
 * CE RESPINGE, ȘI E BINE CĂ RESPINGE. „SUN-60K-G03" nu se potrivește cu
 * „SUN-70/75/80/90/100/110K-G03": 60 chiar nu e în gama aia. Iar
 * „SUN-125K-G01P03-EU-AM8" nu se potrivește cu „SUN-120/125/130/135/136K-G01P3",
 * fiindcă „G01P03" și „G01P3" sunt jetoane diferite. S-ar putea să fie același
 * produs scris altfel — dar „s-ar putea" nu e o bază pentru a pune o fotografie
 * pe un produs de catalog.
 *
 * ─── CARE IMAGINE E CEA A PRODUSULUI ─────────────────────────────────────
 *
 * Paginile n-au `og:image`, iar galeria e amestecată cu iconițe și bannere.
 * Se sar fișierele cu nume de tip amprentă (32 de caractere hexa — sunt bannere
 * generate) și cele cu „icon"/„logo" în nume, apoi din ce rămâne se cere
 * dimensiunea prin HEAD și se ia cea mai mare. Pe un exemplu verificat:
 * bannerul avea 124 KB, fotografia produsului 508 KB și 4143×4143 px.
 *
 * Fotografiile Deye sunt mult mai bune decât cele de pe solarone.ro — 4000px
 * față de 700px — deci pentru produsele acoperite de amândouă sursele, asta e
 * sursa preferabilă.
 *
 * ─── RITMUL ──────────────────────────────────────────────────────────────
 *
 * deyeinverter.com e site-ul altcuiva. O pauză de 1,5s după FIECARE cerere,
 * inclusiv după HEAD-uri. Indexul costă ~100 de cereri o singură dată și se
 * păstrează pe disc (`cauta-poze-deye-index.json`), deci a doua rulare nu-l mai
 * cere. Oprire după 3 refuzuri la rând.
 *
 * ─── OPȚIUNI ─────────────────────────────────────────────────────────────
 *
 *   --dir <cale>       unde scrie (implicit ../../poze-produse-pas4)
 *   --pauza <ms>       între cereri (implicit 1500)
 *   --reindexeaza      reface indexul, chiar dacă există pe disc
 *   --doar-cauta       nu descarcă, doar raportează ce ar lua
 */

const fs = require('fs');
const path = require('path');

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : d; };
const are = (n) => process.argv.includes(n);

const DIR = path.resolve(__dirname, arg('--dir', '../../poze-produse-pas4'));
const PAUZA = Number(arg('--pauza', '1500'));
const REINDEXEAZA = are('--reindexeaza');
const DOAR_CAUTA = are('--doar-cauta');

const SITE = 'https://www.deyeinverter.com';
const GRAPHQL = 'https://www.avogrupinvest.ro/graphql';
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' };

const FISIER_INDEX = path.join(__dirname, 'cauta-poze-deye-index.json');
const FISIER_JURNAL = path.join(__dirname, 'cauta-poze-deye-jurnal.txt');
const BLOCAJE_ACCEPTATE = 3;

/* ── Jurnal ─────────────────────────────────────────────────────────────── */

const ceas = () => new Date().toTimeString().slice(0, 8);
function scrie(t = '') {
  const r = t ? `[${ceas()}] ${t}` : '';
  console.log(r);
  try { fs.appendFileSync(FISIER_JURNAL, r + '\n'); } catch { /* nu oprim lucrul */ }
}

/* ── Cereri ─────────────────────────────────────────────────────────────── */

const asteapta = (ms) => new Promise((r) => setTimeout(r, ms));
let blocajeLaRand = 0;

async function ia(url, mod = 'text') {
  let r;
  try {
    r = await fetch(url, { headers: UA, method: mod === 'head' ? 'HEAD' : 'GET' });
  } catch (e) {
    await asteapta(PAUZA); blocajeLaRand++;
    throw new Error(`rețea: ${e.message}`);
  }
  const rezultat = mod === 'head'
    ? { marime: Number(r.headers.get('content-length') || 0), tip: r.headers.get('content-type') || '' }
    : mod === 'binar'
      ? { corp: Buffer.from(await r.arrayBuffer()), tip: r.headers.get('content-type') || '' }
      : { corp: await r.text() };
  await asteapta(PAUZA);
  if (!r.ok) {
    if (r.status === 429 || r.status === 403 || r.status >= 500) blocajeLaRand++;
    throw new Error(`${r.status} ${url.slice(0, 70)}`);
  }
  blocajeLaRand = 0;
  return rezultat;
}

/* ── Desfacerea modelelor grupate ───────────────────────────────────────── */

/**
 * „SUN-7.6/8/10/12K-SG02LP1-EU-AM2/AM3-P" → cele opt modele individuale.
 * Vezi comentariul din capul fișierului pentru unitatea moștenită.
 */
function desfa(titlu) {
  let variante = [String(titlu).replace(/\s+/g, '')];
  for (let runda = 0; runda < 4; runda++) {
    const noi = [];
    let sSchimbat = false;
    for (const v of variante) {
      const m = v.match(/([A-Za-z0-9.]+(?:\/[A-Za-z0-9.]+)+)/);
      if (!m) { noi.push(v); continue; }
      sSchimbat = true;
      const bucati = m[1].split('/');
      const unitate = (bucati[bucati.length - 1].match(/[A-Za-z]+$/) || [''])[0];
      for (const b of bucati) {
        const completat = /^\d+(?:\.\d+)?$/.test(b) ? b + unitate : b;
        noi.push(v.slice(0, m.index) + completat + v.slice(m.index + m[1].length));
      }
    }
    variante = [...new Set(noi)];
    if (!sSchimbat || variante.length > 600) break;
  }
  return variante;
}

const jetoane = (s) => String(s).toUpperCase().split(/[^A-Z0-9.]+/).filter(Boolean).map((x) => x.toLowerCase());
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

/* ── Indexul Deye ───────────────────────────────────────────────────────── */

async function construiesteIndex() {
  scrie('construiesc indexul deyeinverter.com…');
  const { corp } = await ia(`${SITE}/product/`);
  const cai = [...new Set([...corp.matchAll(/href="(\/product\/[^"]+\.html)"/g)].map((m) => m[1]))];
  scrie(`  ${cai.length} pagini de produs de citit`);

  const index = [];
  for (const [i, cale] of cai.entries()) {
    try {
      const { corp: h } = await ia(SITE + cale);
      const titlu = ((h.match(/<title>([^<]*)<\/title>/) || [])[1] || '').trim();
      // Modelul e partea din titlu de dinaintea descrierii comerciale.
      const model = titlu.split(/\s+(?:Inverter|Micro|Solar|Company|Supplier|\|)/i)[0].trim();
      index.push({ cale, titlu, model, text: norm(h.replace(/<[^>]+>/g, ' ')).slice(0, 120000) });
      if ((i + 1) % 20 === 0) scrie(`  ${i + 1}/${cai.length}`);
    } catch (e) {
      scrie(`  eroare la ${cale}: ${e.message}`);
    }
    if (blocajeLaRand >= BLOCAJE_ACCEPTATE) { scrie('  OPRESC indexarea: 3 refuzuri la rând'); break; }
  }
  fs.writeFileSync(FISIER_INDEX, JSON.stringify(index));
  scrie(`  index scris: ${index.length} pagini`);
  return index;
}

/* ── Potrivirea ─────────────────────────────────────────────────────────── */

function cauta(sku, index) {
  const j = jetoane(sku);
  const n = norm(sku);

  // 1. Pe model, cu desfacere. Cea mai tare dovadă.
  if (j.length >= 3) {
    for (const p of index) {
      for (const v of desfa(p.model)) {
        const s = new Set(jetoane(v));
        if (j.every((x) => s.has(x))) return { ...p, cum: `model: ${v}` };
      }
    }
  }

  /* A EXISTAT AICI O A DOUA REGULĂ, iar ștergerea ei e o corecție, nu o
     simplificare.

     Regula spunea: dacă codul nostru apare oriunde în textul paginii, e o
     potrivire. Suna rezonabil și a produs exact trei rezultate —
     SUN-SMART-PLUG, SUN-SMART-SWITCH și SUN-EVSE22K01-EU-AC — toate trei
     ACELAȘI fișier de 187 KB, un banner de marketing cu o casă și un telefon.
     Precizie zero din trei.

     Motivul e structural, nu o scăpare de reglaj: Deye are pagini de prezentare
     care enumeră mai multe produse, iar pe ele codul chiar apare. „Apare pe
     pagină" nu înseamnă „pagina e despre el".

     Cele trei produse rămân fără poză de aici. E rezultatul corect: mai bine
     lipsă decât un banner pus pe trei produse diferite. */
  return null;
}

/* ── Imaginea produsului ────────────────────────────────────────────────── */

/** Amprentă de 32 hexa = banner generat, nu fotografie de produs. */
const ESTE_AMPRENTA = (u) => /\/[0-9a-f]{32}\.(?:png|jpe?g|webp)$/i.test(u);

/* ── FORMA IMAGINII, NU DOAR MĂRIMEA EI ─────────────────────────────────────
   „Cea mai mare imagine de pe pagină" pare o regulă bună și nu e. Prima rulare
   a luat pentru SUN-SMART-PLUG, SUN-SMART-SWITCH și SUN-EVSE22K01 exact
   ACELAȘI fișier de 191 KB — un banner de marketing cu o casă, un telefon și
   textul „Smart Load Management and Home Automation". Era cea mai mare imagine
   de pe o pagină comună mai multor produse, deci regula a ales-o de trei ori.

   Ce le desparte nu e greutatea, e FORMA. Fotografiile de produs Deye sunt
   pătrate — 4143×4143, 1000×1000 — fiindcă asta e convenția pentru un obiect
   decupat pe alb. Bannerele sunt late, fiindcă trebuie să încapă un titlu
   lângă o imagine.

   Deci se cer octeții, se citesc dimensiunile din antet și se resping cele mai
   late decât 1,4:1 sau mai înalte decât 1:1,4. Costă o descărcare în plus la
   candidații respinși, dar prinde exact greșeala care altfel ajunge pe site —
   iar o poză greșită e mai rea decât una lipsă. */

const RAPORT_MAXIM = 1.4;

/** Dimensiunile din antetul fișierului, fără nicio bibliotecă. */
function dimensiuni(b) {
  if (b.length > 24 && b.toString('latin1', 1, 4) === 'PNG') {
    return [b.readUInt32BE(16), b.readUInt32BE(20)];
  }
  if (b.toString('latin1', 0, 4) === 'RIFF') {
    const t = b.toString('latin1', 12, 16);
    if (t === 'VP8X') return [1 + (b[24] | (b[25] << 8) | (b[26] << 16)), 1 + (b[27] | (b[28] << 8) | (b[29] << 16))];
    if (t === 'VP8L') { const n = b.readUInt32LE(21); return [(n & 0x3fff) + 1, ((n >> 14) & 0x3fff) + 1]; }
    if (t === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
    return null;
  }
  if (b[0] === 0xff && b[1] === 0xd8) {           // JPEG: căutăm marcajul SOF
    let i = 2;
    while (i < b.length - 9) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
        return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
      }
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  return null;
}

/** Pătrată-ish = fotografie de produs. Lată = banner. */
function areFormaDeProdus(b) {
  const d = dimensiuni(b);
  if (!d || !d[0] || !d[1]) return true;          // necunoscut: nu respingem orbește
  const raport = d[0] / d[1];
  return raport <= RAPORT_MAXIM && raport >= 1 / RAPORT_MAXIM;
}

async function alegeImaginea(html) {
  const brute = [...new Set(
    [...html.matchAll(/(?:src|data-src)="(\/deyeinverter\/[^"]+\.(?:jpg|jpeg|png|webp))"/gi)].map((m) => m[1]),
  )].filter((u) => !ESTE_AMPRENTA(u) && !/icon|logo|flag|banner|qrcode/i.test(u));

  let cea = null;
  for (const u of brute.slice(0, 5)) {
    try {
      const { marime, tip } = await ia(SITE + u, 'head');
      if (!tip.startsWith('image/')) continue;
      if (!cea || marime > cea.marime) cea = { url: SITE + u, marime };
    } catch { /* sărim imaginea care nu răspunde */ }
  }
  return cea;
}

/* ── Produsele fără poză ────────────────────────────────────────────────── */

const Q = `query($after: String) {
  products(first: 100, after: $after) {
    pageInfo { hasNextPage endCursor }
    nodes { ... on SimpleProduct {
      sku name image { sourceUrl }
      attributes { nodes { name ... on GlobalProductAttribute { terms(first: 1) { nodes { name } } } } }
    } }
  }
}`;

async function produseDeyeFaraPoza() {
  const out = [];
  let after = null;
  do {
    const r = await fetch(GRAPHQL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...UA },
      body: JSON.stringify({ query: Q, variables: { after } }),
    });
    const j = await r.json();
    if (j.errors) throw new Error('GraphQL: ' + JSON.stringify(j.errors).slice(0, 200));
    const p = j.data.products;
    for (const n of p.nodes) {
      if (!n?.sku || n.image) continue;
      const brand = n.attributes?.nodes?.find((x) => x?.name === 'pa_brand')?.terms?.nodes?.[0]?.name?.trim();
      if (brand === 'Deye') out.push({ sku: n.sku.trim(), nume: (n.name || '').trim() });
    }
    after = p.pageInfo.hasNextPage ? p.pageInfo.endCursor : null;
  } while (after);
  return out;
}

/* ── Programul ──────────────────────────────────────────────────────────── */

const EXT = { 'image/webp': '.webp', 'image/jpeg': '.jpg', 'image/png': '.png' };

async function main() {
  fs.mkdirSync(DIR, { recursive: true });
  scrie('');
  scrie(`══ poze Deye · ${new Date().toLocaleString('ro-RO')} ══`);

  let index;
  if (!REINDEXEAZA && fs.existsSync(FISIER_INDEX)) {
    index = JSON.parse(fs.readFileSync(FISIER_INDEX, 'utf8'));
    scrie(`index de pe disc: ${index.length} pagini (--reindexeaza ca să-l refacă)`);
  } else {
    index = await construiesteIndex();
  }

  const deFacut = await produseDeyeFaraPoza();
  const deja = new Set(fs.readdirSync(DIR).filter((f) => /\.(webp|jpe?g|png)$/i.test(f)).map((f) => f.replace(/\.\w+$/, '')));
  const lista = deFacut.filter((p) => !deja.has(p.sku));

  scrie(`produse Deye fără poză: ${deFacut.length}${deja.size ? ` (${deja.size} deja luate)` : ''}`);
  scrie('');

  const manifest = [];
  let gasite = 0, negasite = 0;

  for (const p of lista) {
    const g = cauta(p.sku, index);
    if (!g) { scrie(`  negăsit   ${p.sku.padEnd(40)} ${p.nume.slice(0, 30)}`); negasite++; continue; }

    try {
      const { corp: html } = await ia(SITE + g.cale);
      const img = await alegeImaginea(html);
      if (!img) { scrie(`  fără poză ${p.sku.padEnd(40)} ${g.cum}`); negasite++; continue; }

      if (DOAR_CAUTA) {
        scrie(`  ar lua    ${p.sku.padEnd(40)} ${g.cum} · ${Math.round(img.marime / 1024)}KB`);
        manifest.push([p.sku, '', img.url, g.model, g.cum]);
        gasite++;
        continue;
      }

      const { corp, tip } = await ia(img.url, 'binar');

      // Ultima poartă: forma. Vezi comentariul de la `areFormaDeProdus`.
      if (!areFormaDeProdus(corp)) {
        const d = dimensiuni(corp);
        scrie(`  BANNER    ${p.sku.padEnd(40)} ${d ? d.join('×') : '?'} — prea lată, nu e fotografie de produs`);
        negasite++;
        continue;
      }

      const ext = EXT[tip.split(';')[0]] || path.extname(new URL(img.url).pathname) || '.png';
      fs.writeFileSync(path.join(DIR, `${p.sku}${ext}`), corp);
      scrie(`  luat      ${p.sku.padEnd(40)} ${g.cum} · ${Math.round(corp.length / 1024)}KB`);
      manifest.push([p.sku, `${p.sku}${ext}`, img.url, g.model, g.cum]);
      gasite++;
    } catch (e) {
      scrie(`  EROARE    ${p.sku.padEnd(40)} ${e.message}`);
      negasite++;
    }

    if (blocajeLaRand >= BLOCAJE_ACCEPTATE) { scrie(''); scrie('OPRESC: 3 refuzuri la rând de la deyeinverter.com.'); break; }
  }

  if (manifest.length) {
    const f = path.join(DIR, 'manifest.csv');
    const antet = '"sku","fisier","sursa","model_deye","verificare"\n';
    const randuri = manifest.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n') + '\n';
    if (fs.existsSync(f)) fs.appendFileSync(f, randuri); else fs.writeFileSync(f, antet + randuri);
  }

  scrie('');
  scrie(`găsite ${gasite} · negăsite ${negasite}`);
  if (gasite && !DOAR_CAUTA) scrie(`Fișierele sunt în ${DIR}`);
}

main().catch((e) => { scrie(`eroare neprevăzută: ${e.stack || e.message}`); process.exitCode = 1; });
