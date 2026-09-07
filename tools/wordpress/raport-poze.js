#!/usr/bin/env node
/**
 * Raport despre starea pozelor în WooCommerce. NU SCRIE NIMIC.
 *
 *   node raport-poze.js            sau, pe Windows:   raport-poze.cmd
 *
 * Citește aceleași credențiale ca incarca-poze.js, din `.env.local` sau din
 * mediu. Scoate două fișiere lângă script:
 *
 *   raport-poze.txt  ... de citit, și de trimis mai departe
 *   raport-poze.json ... aceleași date, complete, pentru cine vrea detaliul
 *
 * ─── LA CE FOLOSEȘTE ──────────────────────────────────────────────────────
 *
 * Răspunde la întrebarea „ce s-a întâmplat la încercarea de dinainte", pe care
 * din administrarea WordPress nu o poți afla la 79 de fișiere. Concret:
 *
 *   CÂTE PRODUSE AU POZĂ, din toate. Cifra pe care o vrei prima.
 *
 *   CE S-A URCAT DAR N-A FOST LEGAT. Dacă o rulare a murit între „urcă
 *   fișierul" și „leagă de produs", fișierul a rămas în bibliotecă fără să
 *   ajungă pe produs. Din admin arată ca o poză oarecare din bibliotecă; aici
 *   apare ca „urcat, nelegat", cu id cu tot.
 *
 *   DUPLICATELE. WordPress nu refuză un fișier cu nume existent, îl
 *   redenumește tăcut în `nume-1.webp`, `-2`, `-3`. Se adună fără să se vadă,
 *   iar din bibliotecă nu poți spune care e originalul. Aici sunt numărate.
 *
 *   PRODUSELE CU ALTĂ POZĂ DECÂT A NOASTRĂ. Dacă cineva a pus de mână o
 *   fotografie mai bună, `incarca-poze.js` o va SĂRI, nu o va înlocui — și e
 *   bine să știi dinainte pe care.
 *
 * ─── DE CE E DESPĂRȚIT DE INCARCA-POZE.JS ────────────────────────────────
 *
 * Ca să poată fi rulat fără nicio teamă, oricând, inclusiv în timp ce
 * încărcarea merge. Un script care doar citește nu are nevoie de confirmări,
 * de stare pe disc și de regulator de ritm — și e util tocmai fiindcă poate fi
 * pornit fără să te gândești de două ori.
 *
 * Ritmul e totuși blând: paginile se cer câte 100, cu o pauză scurtă între ele.
 * Un GET nu costă serverul aproape nimic — nu generează miniaturi, cum face o
 * încărcare — dar nici nu ne grăbim nicăieri.
 */

const fs = require('fs');
const path = require('path');

/* ── Argumente și credențiale ───────────────────────────────────────────── */

const arg = (nume, implicit) => {
  const i = process.argv.indexOf(nume);
  return i > -1 ? process.argv[i + 1] : implicit;
};

function incarcaEnvLocal() {
  const f = path.join(__dirname, '.env.local');
  if (!fs.existsSync(f)) return;
  for (const linie of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    if (linie.trim().startsWith('#')) continue;
    const m = linie.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = v;
  }
}
incarcaEnvLocal();

const URL_WP = (process.env.WP_URL || '').replace(/\/+$/, '');
const USER = process.env.WP_USER || '';
const PAROLA = process.env.WP_APP_PASSWORD || '';

const DIR = path.resolve(__dirname, arg('--dir', '../../poze-produse'));
const PAUZA = Number(arg('--pauza', '1500'));
const MAX_MEDIA = Number(arg('--max-media', '3000'));

const FISIER_TXT = path.join(__dirname, 'raport-poze.txt');
const FISIER_JSON = path.join(__dirname, 'raport-poze.json');

/* ── Ieșire ─────────────────────────────────────────────────────────────── */

const randuri = [];
function scrie(text = '') {
  console.log(text);
  randuri.push(text);
}

const asteapta = (ms) => new Promise((r) => setTimeout(r, ms));
const AUTH = 'Basic ' + Buffer.from(`${USER}:${PAROLA}`).toString('base64');

async function cere(cale) {
  const r = await fetch(`${URL_WP}${cale}`, { headers: { Authorization: AUTH } });
  const text = await r.text();
  let corp;
  try {
    corp = JSON.parse(text);
  } catch {
    corp = text;
  }
  if (!r.ok) {
    const eHtml = typeof corp === 'string' && /^\s*</.test(corp);
    const mesaj = corp && corp.message
      ? corp.message
      : eHtml ? 'răspuns HTML (pagină de firewall?)' : String(corp).slice(0, 160);
    const e = new Error(`${r.status} ${cale.split('?')[0]} — ${mesaj}`);
    e.status = r.status;
    throw e;
  }
  return { corp, total: Number(r.headers.get('x-wp-totalpages') || 1) };
}

/** Cere toate paginile unei colecții, cu pauză între ele. */
async function toate(caleBaza, eticheta, plafon = Infinity) {
  const iesire = [];
  let pagina = 1;
  let pagini = 1;
  do {
    const { corp, total } = await cere(`${caleBaza}&per_page=100&page=${pagina}`);
    pagini = total;
    if (!Array.isArray(corp)) break;
    iesire.push(...corp);
    process.stdout.write(`\r  ${eticheta}: ${iesire.length}…   `);
    if (iesire.length >= plafon) break;
    pagina++;
    if (pagina <= pagini) await asteapta(PAUZA);
  } while (pagina <= pagini);
  // Spațiile șterg contorul: `\r` doar mută cursorul la început de rând, nu
  // curăță ce era scris, iar rămășița intra peste titlul următor.
  process.stdout.write('\r' + ' '.repeat(48) + '\r');
  return iesire;
}

/** Numele fișierului din URL, decodat. */
const numeDinUrl = (u) => decodeURIComponent(String(u || '').split('/').pop() || '');

/** „CS6.2-48TD-460-2.webp" -> „CS6.2-48TD-460.webp". Doar pentru duplicate. */
const faraSufixDeDuplicat = (nume) => nume.replace(/-\d+(\.\w+)$/, '$1');

async function main() {
  if (!URL_WP || !USER || !PAROLA) {
    console.error(
      'Lipsesc WP_URL, WP_USER sau WP_APP_PASSWORD.\n' +
      'Pune-le în tools/wordpress/.env.local (vezi .env.local.exemplu).',
    );
    process.exit(1);
  }

  const localeToate = fs
    .readdirSync(DIR)
    .filter((f) => /\.(webp|jpe?g|png)$/i.test(f))
    .sort();

  scrie(`RAPORT POZE · ${new Date().toLocaleString('ro-RO')}`);
  scrie(`site: ${URL_WP}`);
  scrie(`poze locale: ${localeToate.length} în ${DIR}`);
  scrie('');

  try {
    await cere('/wp-json/wc/v3/products?per_page=1');
  } catch (e) {
    console.error(`\nNu pot ajunge la WooCommerce: ${e.message}`);
    console.error('Verifică WP_URL, utilizatorul și parola de aplicație.');
    process.exit(1);
  }

  // `_fields` taie răspunsul la ce ne trebuie. Fără el, fiecare produs vine cu
  // descriere, meta și variante — zeci de kilobyți pe produs, degeaba.
  const produse = await toate(
    '/wp-json/wc/v3/products?status=any&_fields=id,sku,name,images',
    'produse',
  );
  const media = await toate(
    '/wp-json/wp/v2/media?media_type=image&_fields=id,source_url,date',
    'biblioteca media',
    MAX_MEDIA,
  );

  /* ── 1. Ansamblul ─────────────────────────────────────────────────────── */

  const cuPoza = produse.filter((p) => p.images && p.images.length);
  const procent = produse.length ? Math.round((cuPoza.length / produse.length) * 100) : 0;

  scrie('── ANSAMBLU ────────────────────────────────────────────────');
  scrie(`produse în WooCommerce ......... ${produse.length}`);
  scrie(`  cu cel puțin o poză .......... ${cuPoza.length}  (${procent}%)`);
  scrie(`  fără nicio poză .............. ${produse.length - cuPoza.length}`);
  scrie(`imagini în biblioteca media .... ${media.length}${media.length >= MAX_MEDIA ? ' (plafon atins)' : ''}`);
  scrie('');

  /* ── 2. Biblioteca, față de setul nostru ──────────────────────────────── */

  const numeLocale = new Set(localeToate);
  // id-urile de imagine chiar folosite de produse.
  const idFolosite = new Set();
  for (const p of produse) for (const im of p.images || []) idFolosite.add(im.id);

  const aleNoastre = [];   // fișiere din setul nostru, regăsite în bibliotecă
  const duplicate = [];    // aceleași, dar cu sufix -1, -2 pus de WordPress

  for (const m of media) {
    const nume = numeDinUrl(m.source_url);
    if (numeLocale.has(nume)) {
      aleNoastre.push({ id: m.id, nume, legat: idFolosite.has(m.id), data: m.date });
    } else {
      const original = faraSufixDeDuplicat(nume);
      if (original !== nume && numeLocale.has(original)) {
        duplicate.push({ id: m.id, nume, original, legat: idFolosite.has(m.id), data: m.date });
      }
    }
  }

  const orfane = aleNoastre.filter((x) => !x.legat);

  scrie('── BIBLIOTECA MEDIA, DIN SETUL NOSTRU ──────────────────────');
  scrie(`fișiere de-ale noastre urcate .. ${aleNoastre.length} din ${localeToate.length}`);
  scrie(`  legate de un produs .......... ${aleNoastre.length - orfane.length}`);
  scrie(`  URCATE DAR NELEGATE .......... ${orfane.length}`);
  scrie(`duplicate („-1", „-2" etc.) .... ${duplicate.length}`);
  scrie('');

  if (orfane.length) {
    scrie('  Urcate dar nelegate — `incarca-poze.js --verifica-media` le găsește');
    scrie('  și le leagă, fără să reurce nimic:');
    for (const o of orfane.slice(0, 40)) scrie(`     media #${o.id}  ${o.nume}`);
    if (orfane.length > 40) scrie(`     … și încă ${orfane.length - 40}`);
    scrie('');
  }

  if (duplicate.length) {
    scrie('  Duplicate lăsate de o rulare anterioară. Se șterg de mână din');
    scrie('  Media → Bibliotecă; niciunul nu e folosit de vreun produs dacă');
    scrie('  scrie „nelegat" lângă el:');
    for (const d of duplicate.slice(0, 40)) {
      scrie(`     media #${d.id}  ${d.nume}${d.legat ? '  ← LEGAT de un produs, nu-l șterge orbește' : '  (nelegat)'}`);
    }
    if (duplicate.length > 40) scrie(`     … și încă ${duplicate.length - 40}`);
    scrie('');
  }

  /* ── 3. Fișier cu fișier ──────────────────────────────────────────────── */

  const dupaSku = new Map();
  for (const p of produse) if (p.sku) dupaSku.set(p.sku, p);

  const stare = { gata: [], altaPoza: [], nelegat: [], deUrcat: [], faraProdus: [] };

  for (const fisier of localeToate) {
    const sku = fisier.replace(/\.\w+$/, '');
    const produs = dupaSku.get(sku);
    if (!produs) { stare.faraProdus.push(sku); continue; }

    const aNoastra = aleNoastre.find((x) => x.nume === fisier);
    const idProdus = (produs.images || []).map((i) => i.id);

    if (aNoastra && idProdus.includes(aNoastra.id)) stare.gata.push(sku);
    else if (idProdus.length) stare.altaPoza.push({ sku, imagine: numeDinUrl((produs.images[0] || {}).src) });
    else if (aNoastra) stare.nelegat.push({ sku, media: aNoastra.id });
    else stare.deUrcat.push(sku);
  }

  scrie('── CELE 79 DE POZE LOCALE, UNA CÂTE UNA ────────────────────');
  scrie(`gata (poza noastră e pe produs) . ${stare.gata.length}`);
  scrie(`produsul are ALTĂ poză .......... ${stare.altaPoza.length}   ← scriptul le sare`);
  scrie(`urcată, dar nelegată ............ ${stare.nelegat.length}   ← --verifica-media le rezolvă`);
  scrie(`de urcat de la zero ............. ${stare.deUrcat.length}`);
  scrie(`fără produs cu acest SKU ........ ${stare.faraProdus.length}`);
  scrie('');

  if (stare.altaPoza.length) {
    scrie('  Cu altă poză (nu se ating fără --forteaza):');
    for (const x of stare.altaPoza.slice(0, 25)) scrie(`     ${x.sku}  are „${x.imagine}"`);
    if (stare.altaPoza.length > 25) scrie(`     … și încă ${stare.altaPoza.length - 25}`);
    scrie('');
  }

  if (stare.faraProdus.length) {
    scrie('  Fără produs cu acest SKU în WooCommerce:');
    scrie('     ' + stare.faraProdus.slice(0, 25).join(', '));
    if (stare.faraProdus.length > 25) scrie(`     … și încă ${stare.faraProdus.length - 25}`);
    scrie('');
  }

  /* ── 4. Ce urmează ────────────────────────────────────────────────────── */

  scrie('── CE URMEAZĂ ──────────────────────────────────────────────');
  if (stare.deUrcat.length === 0 && stare.nelegat.length === 0) {
    scrie('Nimic de urcat. Tot ce se putea lega e legat.');
  } else {
    if (stare.nelegat.length) {
      scrie(`${stare.nelegat.length} poze sunt deja sus și trebuie doar legate.`);
      scrie('Pornește O SINGURĂ DATĂ cu --verifica-media, ca să le găsească pe toate:');
      scrie('   incarca-poze.cmd --verifica-media');
    }
    if (stare.deUrcat.length) {
      scrie(`${stare.deUrcat.length} poze sunt de urcat de la zero.`);
      if (!stare.nelegat.length) scrie('   incarca-poze.cmd --limita 3      (întâi o probă)');
    }
  }
  if (duplicate.length) {
    scrie('');
    scrie(
      duplicate.length === 1
        ? 'Curăță și duplicatul din Media → Bibliotecă.'
        : `Curăță și cele ${duplicate.length} duplicate din Media → Bibliotecă.`,
    );
  }
  scrie('');
  scrie('ATENȚIE, indiferent de cifrele de mai sus: fișele de produs de pe site NU');
  scrie('vor arăta pozele până nu cere `image` și GET_PRODUSE_TOATE_QUERY din');
  scrie('src/lib/queries.ts (vezi src/lib/produs.ts:254).');

  fs.writeFileSync(FISIER_TXT, randuri.join('\n') + '\n');
  fs.writeFileSync(
    FISIER_JSON,
    JSON.stringify(
      {
        cand: new Date().toISOString(),
        site: URL_WP,
        produse: { total: produse.length, cuPoza: cuPoza.length },
        media: { total: media.length, aleNoastre: aleNoastre.length, orfane, duplicate },
        locale: { total: localeToate.length, ...stare },
      },
      null,
      1,
    ),
  );

  console.log('');
  console.log(`scris ${FISIER_TXT}`);
  console.log(`scris ${FISIER_JSON}`);
}

main().catch((e) => {
  console.error(`\neroare: ${e.stack || e.message}`);
  process.exit(1);
});
