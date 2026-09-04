#!/usr/bin/env node
/**
 * Catalog lunar Solar One  ->  CSV de import WooCommerce
 *
 *   node parse-catalog.js "<cale catre PDF>" [director-iesire]
 *
 * Necesită `pdftotext` (Xpdf sau poppler) în PATH. Vine cu Git for Windows.
 *
 * Extragerea se face cu `-table -enc UTF-8`. Nu folosi `-layout`: dezaliniază
 * a doua coloană de prețuri (produce perechi imposibile, ex. 57.00 / 80.00).
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { SECTIONS } = require('./sections');
const { ORPHANS, ACCESORII, ACCESORII_CAT, BRAND_PREFIX, MONTAJ_SUBCAT, SKU_ALIAS, TYPOS } = require('./overrides');

const norm = s => s.replace(/\s+/g, ' ').trim();

// Linii de antet/subsol care nu sunt nici secțiuni, nici produse.
const NOISE = /^(Denumire produs|Preț net|Pentru comenzi|Contact rapid|Piatra Neamț|Constanța|PANOURI FOTOVOLTAICE|CATALOG PARTENERI|ECHIPAMENTE|SEPTEMBRIE|Valabil:|Distributor|autorizat|naționale|instalatori|Prețurile|Ofertele|OFERTELE|Oferte pentru|OFERTĂ|Disponibil|Panouri fotovoltaice +•)/;

/** Virgula în coloana de preț e separator de mii ("8,500€"); în denumire e zecimală ("16,08 kWh"). */
const pretNum = t => parseFloat(t.replace(/,/g, ''));

function extrageText(pdf) {
  const tmp = path.join(require('os').tmpdir(), `solarone-${Date.now()}.txt`);
  execFileSync('pdftotext', ['-table', '-enc', 'UTF-8', pdf, tmp], { stdio: 'pipe' });
  const txt = fs.readFileSync(tmp, 'utf8');
  fs.unlinkSync(tmp);
  return txt;
}

function parse(txt) {
  const linii = txt.split(/\r?\n/);
  const produse = [];
  const avertismente = [];
  const antet = [];                     // copertă + pagina "OFERTELE LUNII"
  let sect = null;
  let pornit = false;

  for (const linieBruta of linii) {
    const linie = linieBruta.replace(/\s+$/, '');
    if (!linie.trim()) continue;
    const n = norm(linie);

    // Secțiune?
    if (SECTIONS.has(n)) { sect = { titlu: n, ...SECTIONS.get(n) }; pornit = true; continue; }
    if (!pornit) { antet.push(n); continue; }   // copertă + pagina de oferte
    if (NOISE.test(n)) continue;

    const preturi = [...linie.matchAll(/([\d][\d.,]*)\s*€/g)];
    const laCerere = /LA CERERE/i.test(linie) && preturi.length === 0;

    // Continuare de denumire (rând fără preț care nu e titlu de secțiune)
    if (!preturi.length && !laCerere) {
      if (produse.length) {
        const p = produse[produse.length - 1];
        p.nume = norm(`${p.nume} ${n}`);
        p.numeMultilinie = true;
      } else {
        avertismente.push(`Rând neclasificat: "${n}"`);
      }
      continue;
    }

    // Produs
    const taiere = preturi.length ? preturi[0].index : linie.search(/LA CERERE/i);
    const nume = norm(linie.slice(0, taiere));
    if (!nume) { avertismente.push(`Rând cu preț dar fără denumire: "${n}"`); continue; }

    produse.push({
      nume,
      sectiune: sect.titlu,
      sect,
      pret1: preturi[0] ? pretNum(preturi[0][1]) : null,
      pret2: preturi[1] ? pretNum(preturi[1][1]) : null,
      laCerere,
      unitate: /€\/panou/.test(linie) ? 'panou' : 'buc',
      prag: sect.scheme === 'paleti' ? '4 paleți' : '12 buc',
      container: /PRET\s+LA\s+CERERE/i.test(linie),
    });
  }
  return { produse, avertismente, antet };
}

const LUNI = ['IANUARIE', 'FEBRUARIE', 'MARTIE', 'APRILIE', 'MAI', 'IUNIE',
  'IULIE', 'AUGUST', 'SEPTEMBRIE', 'OCTOMBRIE', 'NOIEMBRIE', 'DECEMBRIE'];

/** Perioada e tipărită pe copertă — nu trebuie introdusă manual nicăieri. */
function perioada(antet) {
  const t = antet.join('\n');
  const luna = t.match(new RegExp(`\\b(${LUNI.join('|')})\\s+(\\d{4})\\b`, 'i'));
  const val = t.match(/Valabil:?\s*(\d{2}\.\d{2}\.\d{4})\s*[–-]\s*(\d{2}\.\d{2}\.\d{4})/i);
  const nrLuna = luna ? LUNI.indexOf(luna[1].toUpperCase()) + 1 : null;
  return {
    eticheta: luna ? `${luna[1][0] + luna[1].slice(1).toLowerCase()} ${luna[2]}` : null,
    de: val ? val[1] : null,
    pana: val ? val[2] : null,
    cod: luna ? `${String(nrLuna).padStart(2, '0')}.${luna[2]}` : null,
  };
}

const cheie = s => s.toUpperCase().replace(/[^A-Z0-9]/g, '');

/**
 * Produsele de pe pagina "OFERTELE LUNII" sunt marcate Featured în WooCommerce.
 * Se potrivesc după codul de model (sau denumirea completă, dacă produsul nu are cod)
 * căutat în textul copertei — acolo codurile sunt scrise uneori altfel
 * (CS62-48TD-460 în loc de CS6.2-48TD-460), iar normalizarea absoarbe diferența.
 */
function marcheazaOferte(produse, antet) {
  const textAntet = cheie(antet.join(' '));
  for (const p of produse) {
    const c = codModel(p.nume);
    const amprenta = cheie(c || p.nume);
    p.oferta = amprenta.length >= 5 && textAntet.includes(amprenta);
  }
}

const slug = s => s.toLowerCase()
  .replace(/[ăâ]/g, 'a').replace(/[îi]/g, 'i').replace(/[șş]/g, 's').replace(/[țţ]/g, 't')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * Unitate de măsură = token format DOAR din număr + unitate ("5.12kWh", "460W", "290mm").
 * Nu testa doar sufixul: multe coduri de model se termină în literă de unitate
 * (CS6.2-66TB-615W, AIKO-A450-MAH54Mw) și ar fi respinse pe nedrept.
 */
const esteUnitate = t => /^\d+([.,]\d+)?\s*(kwh|kw|w|mm|cm|m|v|a)$/i.test(t);

/** Un token e cod de model dacă începe cu literă mare, conține cifră, nu e o unitate de măsură. */
function codModel(nume) {
  const k2 = nume.match(/-\s*(\d{7})$/);            // cod articol K2 Systems
  if (k2) return k2[1];
  const candidati = nume.split(/[\s,]+/)
    .map(t => t.replace(/[.,;:]+$/, ''))
    .filter(t => /^[A-Z]/.test(t) && /\d/.test(t) && t.length >= 5 && !t.includes('/') && !esteUnitate(t));
  if (!candidati.length) return null;
  return candidati.sort((a, b) => b.length - a.length)[0];
}

/**
 * SKU-urile se atribuie pe întreaga listă, nu produs cu produs: dacă două produse
 * ar primi același cod (ex. "GROWATT SPH 8000 TL3-BH-UP" și "SPH 10000 TL3-BH-UP"
 * dau amândouă TL3-BH-UP), AMBELE cad pe slug-ul denumirii complete.
 * Nu adăugăm sufixe -2/-3: SKU-ul trebuie să fie stabil de la o lună la alta,
 * altfel reimportul creează produse duplicate în loc să le actualizeze.
 */
function atribuieSku(produse) {
  const pref = produse.map(p => {
    const c = codModel(p.nume);
    return c ? (SKU_ALIAS[c] || c) : null;
  });
  const nr = {};
  pref.forEach(s => { if (s) nr[s] = (nr[s] || 0) + 1; });
  produse.forEach((p, i) => {
    const bun = pref[i] && nr[pref[i]] === 1;
    p.sku = bun ? pref[i] : slug(p.nume).toUpperCase().slice(0, 64);
    p.skuDerivat = !bun;
  });
}

function atribute(p) {
  const a = {};
  const s = p.sect;
  const nume = p.nume;

  // Brand: secțiunea, altfel prefixul denumirii
  a.Brand = s.brand || (BRAND_PREFIX.find(([re]) => re.test(nume)) || [])[1] || '';

  a.Disponibilitate = (s.lichidare || /LICHIDARE STOC/i.test(nume)) ? 'Lichidare stoc'
    : p.laCerere ? 'La comandă' : 'În stoc';

  if (s.cat === 'Panouri Fotovoltaice') {
    const wp = (nume.match(/\d+/g) || []).map(Number).find(v => v >= 380 && v <= 800);
    if (wp) a['Putere (Wp)'] = String(wp);
    a['Tip panou'] = /BIFACIAL/i.test(nume) ? 'Bifacial' : 'Monofacial';
    if (/TOPCon|Tiger Neo/i.test(nume)) a['Tehnologie celulă'] = 'N-Type TOPCon';
  }

  if (s.cat.startsWith('Invertoare')) {
    let kw = (nume.match(/(\d+(?:[.,]\d+)?)\s*K(?![A-Za-z])/i) || [])[1];
    if (!kw) { const m = nume.match(/\b(\d{4,5})\b/); if (m) kw = String(Number(m[1]) / 1000); }
    if (kw) a['Putere (kW)'] = kw.replace(',', '.');
    if (s.faze) a.Faze = s.faze;
    if (s.tip) a['Tip invertor'] = s.tip;
  }

  if (s.bat) a['Tensiune baterie'] = s.bat;

  const kwh = nume.match(/(\d+(?:[.,]\d+)?)\s*kWh/i);
  if (kwh) {
    const v = parseFloat(kwh[1].replace(',', '.'));
    a['Capacitate exactă (kWh)'] = String(v);
    a['Capacitate (kWh)'] = v < 6 ? 'sub 6 kWh' : v < 15 ? '6 - 15 kWh' : v < 30 ? '15 - 30 kWh'
      : v < 100 ? '30 - 100 kWh' : 'peste 100 kWh';
  }

  const ip = nume.match(/IP\s?(\d{2})/i);
  if (ip) a['Protecție IP'] = `IP${ip[1]}`;
  if (/cu\s+încălzire/i.test(nume)) a['Încălzire'] = 'Da';   // absența = nespecificat, NU "Nu"

  if (s.cat.startsWith('Sisteme de Montaj')) {
    if (/[țt]igl/i.test(nume)) a['Tip acoperiș'] = 'Țiglă';
    else if (/tabl|trapez|metalic|f[ăa]l[țt]uit/i.test(nume)) a['Tip acoperiș'] = 'Tablă';
    else if (/plat|teras|click-in/i.test(nume)) a['Tip acoperiș'] = 'Acoperiș plat';
  }
  return a;
}

function categorie(p) {
  const s = p.sku;
  if (ORPHANS[s]) return ORPHANS[s].cat;
  if (ACCESORII.includes(p.nume)) return ACCESORII_CAT;
  if (p.sect.cat === 'Sisteme de Montaj') {
    const hit = MONTAJ_SUBCAT.find(([re]) => re.test(p.nume));
    if (hit) return hit[1];
  }
  return p.sect.cat;
}

// ---------- CSV ----------
const COL_ATRIB = ['Brand', 'Disponibilitate', 'Putere (Wp)', 'Tehnologie celulă', 'Tip panou',
  'Putere (kW)', 'Faze', 'Tip invertor', 'Tensiune baterie', 'Capacitate (kWh)',
  'Protecție IP', 'Încălzire', 'Tip acoperiș'];

const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;

function csv(produse) {
  // Atributele se împachetează compact: fiecare produs trimite doar atributele
  // pe care le are efectiv. Altfel WooCommerce creează atribute goale pe fiecare
  // produs (un panou ar primi "Tip acoperiș" fără valoare).
  const perProdus = produse.map(p => {
    const a = atribute(p);
    return { p, a, lista: COL_ATRIB.filter(n => a[n]).map(n => [n, a[n]]) };
  });
  const maxAtrib = Math.max(...perProdus.map(x => x.lista.length));

  const cap = ['SKU', 'Name', 'Published', 'Is featured?', 'Visibility in catalog', 'Short description',
    'Tax status', 'In stock?', 'Regular price', 'Categories',
    'Meta: _pret_volum', 'Meta: _prag_volum', 'Meta: _unitate_pret',
    'Meta: _moneda', 'Meta: _pret_container', 'Meta: _capacitate_kwh',
    'Meta: _sursa_catalog', 'Meta: _perioada_eticheta', 'Meta: _valabil_de', 'Meta: _valabil_pana'];
  for (let i = 1; i <= maxAtrib; i++) cap.push(
    `Attribute ${i} name`, `Attribute ${i} value(s)`, `Attribute ${i} visible`, `Attribute ${i} global`);

  const randuri = perProdus.map(({ p, a, lista }) => {
    const r = [
      p.sku, p.nume, 1, p.oferta ? 1 : 0, 'visible',
      p.laCerere ? 'Preț la cerere. Contactați-ne pentru ofertă personalizată.' : '',
      'taxable', 1,
      p.laCerere ? '' : p.pret1,
      categorie(p),
      p.pret2 ?? '', p.pret2 ? p.prag : '', p.unitate,
      'EUR', p.container ? 'la cerere' : '',
      a['Capacitate exactă (kWh)'] || '',
      `Catalog Solar One ${PERIOADA.cod ?? ''}`.trim(),
      PERIOADA.eticheta ?? '', PERIOADA.de ?? '', PERIOADA.pana ?? '',
    ];
    for (let i = 0; i < maxAtrib; i++) {
      const [n, v] = lista[i] || ['', ''];
      r.push(n, v, n ? 1 : '', n ? 1 : '');
    }
    return r.map(esc).join(',');
  });
  return [cap.map(esc).join(','), ...randuri].join('\r\n');
}

// ---------- main ----------
const pdf = process.argv[2];
const outDir = process.argv[3] || process.cwd();
if (!pdf || !fs.existsSync(pdf)) {
  console.error('Utilizare: node parse-catalog.js "<cale PDF>" [director-iesire]');
  process.exit(1);
}

const { produse, avertismente, antet } = parse(extrageText(pdf));
const PERIOADA = perioada(antet);
marcheazaOferte(produse, antet);
atribuieSku(produse);

// ---- validări ----
const erori = [];
const vazute = new Map();
for (const p of produse) {
  const s = p.sku;
  if (vazute.has(s)) erori.push(`SKU duplicat "${s}": "${vazute.get(s)}" vs "${p.nume}"`);
  else vazute.set(s, p.nume);
  if (p.pret2 != null && p.pret1 != null && p.pret2 > p.pret1)
    erori.push(`Preț volum > preț bază la "${p.nume}" (${p.pret2} > ${p.pret1})`);
  if (!p.laCerere && !(p.pret1 > 0)) erori.push(`Preț lipsă la "${p.nume}"`);
}

/**
 * FĂRĂ BOM. Fișierul începe direct cu "SKU", nu cu marcajul EF BB BF.
 *
 * Aici era un BOM, pus ca Excel să deschidă fișierul ca UTF-8 și să arate
 * corect diacriticele. Costa mai mult decât aducea: importatorul WooCommerce
 * citește primul antet împreună cu marcajul, adică `<BOM>SKU` în loc de `SKU`,
 * nu-l recunoaște și pune coloana pe „Do not import".
 *
 * Efectul, verificat pe importul din septembrie: toate cele 172 de produse au
 * intrat corect — nume, prețuri, categorii, atribute, meta — dar TOATE fără
 * SKU. Iar SKU-ul e cheia după care importatorul potrivește produsele la
 * reimportul de luna viitoare; fără el, al doilea import n-ar actualiza nimic,
 * ar crea încă 172 de produse noi.
 *
 * Ce pierdem: dublu-clic pe fișier în Excel arată diacriticele greșit. Fișierul
 * rămâne UTF-8 valid — în Excel se deschide prin Date → Din text/CSV, alegând
 * codificarea UTF-8. E un inconvenient de câteva secunde, o dată pe lună,
 * pentru un fișier care oricum se duce în WooCommerce, nu în Excel.
 */
const outCsv = path.join(outDir, 'solar-one-woocommerce.csv');
fs.writeFileSync(outCsv, csv(produse), 'utf8');

// ---- raport ----
const peCat = {};
produse.forEach(p => { const c = categorie(p); peCat[c] = (peCat[c] || 0) + 1; });
const cuVolum = produse.filter(p => p.pret2 != null).length;

const raport = [
  `Perioadă catalog       : ${PERIOADA.eticheta ?? '(neidentificată)'}  (${PERIOADA.de ?? '?'} – ${PERIOADA.pana ?? '?'})`,
  `Produse extrase        : ${produse.length}`,
  `Categorii              : ${Object.keys(peCat).length}`,
  `Cu preț la volum       : ${cuVolum}`,
  `Fără preț la volum     : ${produse.length - cuVolum}`,
  `Fără niciun preț       : ${produse.filter(p => p.laCerere).length}`,
  `Denumiri pe mai multe rânduri reunite : ${produse.filter(p => p.numeMultilinie).length}`,
  '',
  'Produse pe categorie:',
  ...Object.entries(peCat).sort((a, b) => b[1] - a[1]).map(([c, n]) => `  ${String(n).padStart(3)}  ${c}`),
  '',
  erori.length ? `ERORI (${erori.length}):\n` + erori.map(e => '  ! ' + e).join('\n') : 'Erori de validare: niciuna',
  '',
  avertismente.length ? `Avertismente (${avertismente.length}):\n` + avertismente.map(w => '  ? ' + w).join('\n') : 'Avertismente: niciunul',
  '',
  `Ofertele lunii (marcate "Featured" în WooCommerce) — ${produse.filter(p => p.oferta).length}:`,
  ...produse.filter(p => p.oferta).map(p => `  ${p.sku.padEnd(18)} ${p.nume} — ${p.pret1} EUR/${p.unitate}`),
  '',
  'SKU-uri derivate din denumire (catalogul nu conține un cod de model) — de revizuit:',
  ...produse.filter(p => p.skuDerivat)
    .map(p => `  ${p.sku}\n      <- ${p.nume}`),
  '',
  'Typos în catalogul sursă (NEcorectate automat, denumirile rămân fidele catalogului):',
  ...TYPOS.map(([g, b, u]) => `  "${g}" -> "${b}"   (${u})`),
].join('\n');

fs.writeFileSync(path.join(outDir, 'raport-import.txt'), raport, 'utf8');
console.log(raport);
console.log(`\nCSV scris: ${outCsv}`);
