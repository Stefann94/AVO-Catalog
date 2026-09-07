#!/usr/bin/env node
/**
 * Leagă de produse pozele DEJA urcate în biblioteca media.
 *
 *   node leaga-poze.js [optiuni]        sau, pe Windows:   leaga-poze.cmd
 *
 * NU URCĂ NIMIC. Fișierele trebuie să fie deja în bibliotecă — puse acolo prin
 * Media → Add New Media File, trăgându-le din poze-produse/ toate deodată.
 * Scriptul doar spune fiecărui produs care imagine e a lui.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * DE CE EXISTĂ, SEPARAT DE INCARCA-POZE.JS
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Fiindcă pe găzduirea asta încărcarea prin API nu e posibilă, iar motivul n-are
 * legătură cu WordPress: LiteSpeed răspunde 503 la ORICE cerere care poartă
 * antetul `Authorization: Basic`, indiferent de conținutul lui (vezi
 * diagnostic-acces.js pentru proba pe care s-a stabilit asta). Parolele de
 * aplicație merg DOAR prin Basic, deci `/wp-json/wp/v2/media` — singura rută
 * prin care se poate urca un fișier — e închisă.
 *
 * Ce a rămas deschis, verificat pe site-ul real:
 *
 *   citirea bibliotecii media, FĂRĂ autentificare ...... 200 JSON
 *   WooCommerce cu cheie și secret ÎN URL .............. 200 JSON
 *
 * A doua e cheia întregii soluții: cheile WooCommerce călătoresc ca parametri
 * în adresă, nu ca antet `Authorization`, deci ocolesc complet regula. O cheie
 * falsă primește un 401 JSON curat, nu 503 HTML — semnul că cererea chiar
 * ajunge la WordPress.
 *
 * Așa că munca se împarte în două: fișierele intră prin browser, unde
 * autentificarea e pe cookie și regula nu se aplică; legarea se face de aici.
 *
 * ─── CE SE POATE ȘI CE NU, PE DRUMUL ĂSTA ────────────────────────────────
 *
 * S-ar părea că `alt` și titlul imaginii se pierd, fiindcă se scriu prin
 * `/wp-json/wp/v2/media/{id}`, care e închis. Nu se pierd: WooCommerce
 * acceptă `name` și `alt` chiar în obiectul imaginii trimis pe produs și le
 * scrie el pe atașament. Deci și textul alternativ ajunge unde trebuie, pe
 * ruta care merge.
 *
 * `alt` e denumirea reală a produsului, nu numele fișierului: fișierul se
 * cheamă „CS6.2-48TD-460.webp", ceea ce nu spune nimic unui cititor de ecran.
 *
 * ─── RITMUL ──────────────────────────────────────────────────────────────
 *
 * Mult mai blând decât la încărcare, și dintr-un motiv măsurabil: acolo fiecare
 * fișier costa serverul cinci-șase miniaturi generate, adică una-trei secunde
 * de CPU. Aici e o singură cerere de actualizare per produs, fără nicio
 * prelucrare de imagine.
 *
 * Rămâne totuși o pauză, fiindcă salvarea unui produs nu e gratuită: golește
 * cache-uri, iar plugin-ul nostru cheamă `/api/revalidate` pe site la fiecare.
 * 79 de salvări în rafală ar însemna 79 de regenerări simultane.
 *
 *   pornire 6s · podea 3s · accelerare cu 15% după fiecare 5 curate
 *   frânare ×4 la orice blocaj, cu podeaua urcată definitiv cu 50%
 *
 * În practică: ~5 minute pentru 79 de produse.
 *
 * ─── STARE ȘI RELUARE ────────────────────────────────────────────────────
 *
 * `leaga-poze-stare.json`, scris după fiecare produs. Ctrl+C oricând; la
 * repornire sare peste ce e gata. Spre deosebire de încărcare, operația e
 * oricum idempotentă — a pune de două ori aceeași imagine pe același produs dă
 * exact același rezultat — dar starea scutește cererile.
 *
 * NU ATINGE produsele care au deja o imagine. Dacă cineva a pus de mână una mai
 * bună, rămâne a lui. Pentru înlocuire deliberată există `--forteaza`.
 *
 * ─── OPȚIUNI ─────────────────────────────────────────────────────────────
 *
 *   --proba          nu scrie nimic, doar arată ce ar face
 *   --limita <n>     oprește după n produse
 *   --dir <cale>     directorul cu poze (implicit ../../poze-produse)
 *   --forteaza       înlocuiește și imaginile existente
 *   --pauza <s>      pauza de pornire (implicit 6)
 *   --pauza-min <s>  podeaua (implicit 3)
 *   --de-la-capat    ignoră starea salvată
 */

const fs = require('fs');
const path = require('path');

/* ── Argumente și credențiale ───────────────────────────────────────────── */

const arg = (nume, implicit) => {
  const i = process.argv.indexOf(nume);
  return i > -1 ? process.argv[i + 1] : implicit;
};
const are = (nume) => process.argv.includes(nume);

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
const CHEIE = process.env.WC_KEY || '';
const SECRET = process.env.WC_SECRET || '';

const DIR = path.resolve(__dirname, arg('--dir', '../../poze-produse'));
const LIMITA = Number(arg('--limita', '0')) || Infinity;
const PROBA = are('--proba');
const FORTEAZA = are('--forteaza');
const DE_LA_CAPAT = are('--de-la-capat');

const PAUZA_PORNIRE = Number(arg('--pauza', '6')) * 1000;
const PAUZA_PODEA_INITIALA = Number(arg('--pauza-min', '3')) * 1000;
const PAUZA_TAVAN = 300000;

const DEVIATIE = 0.35;
const PAS_ACCELERARE = 0.85;
const POZE_PE_TREAPTA = 5;
const FACTOR_FRANARE = 4;
const INCERCARI = 4;
const BLOCAJE_ACCEPTATE = 3;

const FISIER_STARE = path.join(__dirname, 'leaga-poze-stare.json');
const FISIER_JURNAL = path.join(__dirname, 'leaga-poze-jurnal.txt');

/* ── Jurnal ─────────────────────────────────────────────────────────────── */

const ceas = () => new Date().toTimeString().slice(0, 8);

function scrie(text = '') {
  const rand = text ? `[${ceas()}] ${text}` : '';
  console.log(rand);
  try {
    fs.appendFileSync(FISIER_JURNAL, rand + '\n');
  } catch { /* un jurnal nescriibil nu oprește lucrul */ }
}

function durata(ms) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, '0')}s`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
}

/* ── Stare ──────────────────────────────────────────────────────────────── */

let stare = { gata: [], esuate: {} };
if (!DE_LA_CAPAT && fs.existsSync(FISIER_STARE)) {
  try {
    const citit = JSON.parse(fs.readFileSync(FISIER_STARE, 'utf8'));
    stare = { gata: citit.gata ?? [], esuate: citit.esuate ?? {} };
  } catch {
    scrie('stare coruptă — o iau de la capăt');
  }
}
const gata = new Set(stare.gata);

function salveazaStarea() {
  if (PROBA) return;
  stare.gata = [...gata];
  fs.writeFileSync(FISIER_STARE, JSON.stringify(stare, null, 1));
}

/* ── Cereri ─────────────────────────────────────────────────────────────── */

const asteapta = (ms) => new Promise((r) => setTimeout(r, ms));
const UA = { 'User-Agent': 'Mozilla/5.0' };

class EroareHttp extends Error {
  constructor(status, mesaj, retryAfter, blocaj) {
    super(mesaj);
    this.status = status;
    this.retryAfter = retryAfter;
    this.blocaj = blocaj;
  }
}

function citesteRetryAfter(antet) {
  if (!antet) return null;
  const secunde = Number(antet);
  if (Number.isFinite(secunde)) return secunde * 1000;
  const data = Date.parse(antet);
  return Number.isNaN(data) ? null : Math.max(0, data - Date.now());
}

/**
 * Cheile merg în adresă, nu în antet.
 *
 * Asta E soluția, nu un amănunt de implementare: antetul `Authorization` e
 * blocat de web-server pe găzduirea asta, iar parametrii din adresă nu sunt.
 */
async function cere(cale, optiuni = {}, cuChei = true) {
  const adresa = cuChei
    ? `${URL_WP}${cale}${cale.includes('?') ? '&' : '?'}consumer_key=${CHEIE}&consumer_secret=${SECRET}`
    : `${URL_WP}${cale}`;

  let r;
  try {
    r = await fetch(adresa, { ...optiuni, headers: { ...UA, ...(optiuni.headers || {}) } });
  } catch (e) {
    throw new EroareHttp(0, `rețea: ${e.message}`, null, true);
  }

  const text = await r.text();
  let corp;
  try { corp = JSON.parse(text); } catch { corp = text; }

  if (r.ok) return { corp, pagini: Number(r.headers.get('x-wp-totalpages') || 1) };

  const eHtml = typeof corp === 'string' && /^\s*</.test(corp);
  const blocaj = r.status === 429 || r.status === 403 || r.status >= 500 || eHtml;
  const mesaj = corp && corp.message
    ? corp.message
    : eHtml ? 'răspuns HTML (pagină de firewall?)' : String(corp).slice(0, 160);

  throw new EroareHttp(
    r.status,
    `${r.status} ${cale.split('?')[0]} — ${mesaj}`,
    citesteRetryAfter(r.headers.get('retry-after')),
    blocaj,
  );
}

/** Toate paginile unei colecții, cu pauză scurtă între ele. */
async function toate(caleBaza, eticheta, cuChei = true) {
  const iesire = [];
  let pagina = 1, pagini = 1;
  do {
    const { corp, pagini: p } = await cere(`${caleBaza}&per_page=100&page=${pagina}`, {}, cuChei);
    pagini = p;
    if (!Array.isArray(corp)) break;
    iesire.push(...corp);
    process.stdout.write(`\r  ${eticheta}: ${iesire.length}…   `);
    pagina++;
    if (pagina <= pagini) await asteapta(800);
  } while (pagina <= pagini);
  process.stdout.write('\r' + ' '.repeat(48) + '\r');
  return iesire;
}

/* ── Regulatorul de ritm ────────────────────────────────────────────────── */

let pauzaBaza = PAUZA_PORNIRE;
let podea = PAUZA_PODEA_INITIALA;
let curateLaRand = 0;
let blocajeLaRand = 0;

function pauzaUrmatoare() {
  const deviat = pauzaBaza * (1 + (Math.random() * 2 - 1) * DEVIATIE);
  return Math.round(Math.min(PAUZA_TAVAN, Math.max(podea, deviat)));
}

function dupaCurata() {
  blocajeLaRand = 0;
  if (++curateLaRand < POZE_PE_TREAPTA) return;
  curateLaRand = 0;
  const nou = Math.max(podea, Math.round(pauzaBaza * PAS_ACCELERARE));
  if (nou < pauzaBaza) {
    pauzaBaza = nou;
    scrie(`        ritm: accelerez — pauza scade la ~${Math.round(pauzaBaza / 1000)}s`);
  }
}

function dupaBlocaj(e) {
  blocajeLaRand++;
  curateLaRand = 0;
  podea = Math.min(PAUZA_TAVAN, Math.round(podea * 1.5));
  pauzaBaza = Math.min(PAUZA_TAVAN, Math.max(podea, Math.round(pauzaBaza * FACTOR_FRANARE)));
  const impus = e.retryAfter && e.retryAfter > pauzaBaza ? Math.min(PAUZA_TAVAN, e.retryAfter) : null;
  if (impus) pauzaBaza = impus;
  scrie(
    `        ritm: FRÂNEZ — pauza urcă la ~${Math.round(pauzaBaza / 1000)}s` +
    (impus ? ' (cerut de server prin Retry-After)' : ''),
  );
}

/* ── Programul ──────────────────────────────────────────────────────────── */

const numeDinUrl = (u) => decodeURIComponent(String(u || '').split('/').pop() || '');

let intrerupt = false;
process.on('SIGINT', () => {
  if (intrerupt) process.exit(1);
  intrerupt = true;
  scrie('');
  scrie('oprire cerută — termin produsul curent și ies (Ctrl+C din nou = imediat)');
});

async function main() {
  if (!URL_WP || !CHEIE || !SECRET) {
    console.error(
      'Lipsesc WP_URL, WC_KEY sau WC_SECRET din tools/wordpress/.env.local.\n' +
      'Cheile se fac în WooCommerce → Setări → Avansat → REST API, cu drept Read/Write.',
    );
    process.exitCode = 1;
    return;
  }

  scrie('');
  scrie(`══ legare poze · ${new Date().toLocaleString('ro-RO')} ══`);

  const locale = fs.readdirSync(DIR).filter((f) => /\.(webp|jpe?g|png)$/i.test(f)).sort();
  scrie(`${locale.length} poze locale în ${DIR}`);

  // Biblioteca se citește FĂRĂ chei: atașamentele publicate sunt publice, iar
  // cheile WooCommerce oricum n-au trecere pe rutele WordPress de bază.
  const media = await toate('/wp-json/wp/v2/media?media_type=image&_fields=id,source_url', 'biblioteca', false);
  const produse = await toate('/wp-json/wc/v3/products?status=any&_fields=id,sku,name,images', 'produse');

  const dupaNume = new Map();
  for (const m of media) dupaNume.set(numeDinUrl(m.source_url), m.id);
  const dupaSku = new Map();
  for (const p of produse) if (p.sku) dupaSku.set(p.sku, p);

  scrie(`biblioteca media: ${media.length} imagini · WooCommerce: ${produse.length} produse`);

  // Împărțim înainte de a atinge ceva, ca raportul de la început să fie corect.
  const deFacut = [];
  let sarite = 0, faraMedia = 0, faraProdus = 0;

  for (const fisier of locale) {
    const sku = fisier.replace(/\.\w+$/, '');
    if (gata.has(sku)) { sarite++; continue; }
    const produs = dupaSku.get(sku);
    const mediaId = dupaNume.get(fisier);
    if (!produs) { faraProdus++; stare.esuate[sku] = 'niciun produs cu acest SKU'; continue; }
    if (!mediaId) { faraMedia++; stare.esuate[sku] = 'fișierul nu e în biblioteca media'; continue; }
    if (produs.images && produs.images.length && !FORTEAZA) { sarite++; gata.add(sku); continue; }
    deFacut.push({ sku, fisier, produs, mediaId });
  }

  scrie('');
  scrie(`de legat: ${Math.min(deFacut.length, LIMITA)}`);
  if (sarite) scrie(`sărite (gata sau au deja imagine): ${sarite}`);
  if (faraMedia) scrie(`fișiere care nu sunt în bibliotecă: ${faraMedia}  ← urcă-le prin Media → Add New`);
  if (faraProdus) scrie(`fișiere fără produs cu acest SKU: ${faraProdus}`);
  if (PROBA) scrie('MOD PROBĂ — nu se scrie nimic.');
  scrie('');

  const total = Math.min(deFacut.length, LIMITA);
  if (!total) { salveazaStarea(); scrie('nimic de făcut.'); return; }

  let legate = 0, esuate = 0, n = 0;
  const cicluri = [];
  const pornire = Date.now();

  for (const x of deFacut.slice(0, LIMITA)) {
    if (intrerupt) break;
    n++;
    const inceput = Date.now();
    const eticheta = `[${String(n).padStart(3)}/${total}] ${String(Math.round(((n - 1) / total) * 100)).padStart(3)}%`;

    if (PROBA) {
      scrie(`${eticheta} ar lega  ${x.sku}  media #${x.mediaId} → produs #${x.produs.id}`);
      legate++;
      continue;
    }

    let reusit = false, ultima = null;
    for (let incercare = 1; incercare <= INCERCARI && !intrerupt; incercare++) {
      try {
        await cere(`/wp-json/wc/v3/products/${x.produs.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          // `name` și `alt` sunt scrise de WooCommerce pe atașament. E singura
          // cale către textul alternativ, ruta WordPress fiind închisă.
          body: JSON.stringify({
            images: [{ id: x.mediaId, name: x.produs.name, alt: x.produs.name }],
          }),
        });
        legate++;
        gata.add(x.sku);
        delete stare.esuate[x.sku];
        reusit = true;
        scrie(`${eticheta} legat    ${x.sku}  media #${x.mediaId} → produs #${x.produs.id}   în ${durata(Date.now() - inceput)}`);
        break;
      } catch (e) {
        ultima = e;
        scrie(`${eticheta} ${e.blocaj ? 'BLOCAJ' : 'eroare'}   ${x.sku}  ${e.message}  (încercarea ${incercare}/${INCERCARI})`);
        if (!e.blocaj) break;
        dupaBlocaj(e);
        if (blocajeLaRand >= BLOCAJE_ACCEPTATE) break;
        if (incercare < INCERCARI) await asteapta(pauzaUrmatoare());
      }
    }

    if (reusit) dupaCurata();
    else if (ultima) { esuate++; stare.esuate[x.sku] = ultima.message; }
    salveazaStarea();

    if (blocajeLaRand >= BLOCAJE_ACCEPTATE) {
      scrie('');
      scrie(`OPRESC: ${BLOCAJE_ACCEPTATE} blocaje la rând. Reia mai târziu — starea e salvată.`);
      break;
    }

    let pauza = 0;
    if (n < total && !intrerupt) { pauza = pauzaUrmatoare(); await asteapta(pauza); }

    cicluri.push(Date.now() - inceput);
    if (cicluri.length > 5) cicluri.shift();
    const medie = cicluri.reduce((s, c) => s + c, 0) / cicluri.length;
    const ramase = total - n;
    if (ramase > 0) {
      scrie(`        ${legate} legate · ${esuate} eșuate  |  ${durata(medie)}/produs  |  mai rămân ${ramase}, ~${durata(ramase * medie)}`);
    }
  }

  salveazaStarea();
  scrie('');
  scrie(`══ gata în ${durata(Date.now() - pornire)} ══`);
  scrie(`legate ${legate} · eșuate ${esuate}`);

  const ramase = Object.keys(stare.esuate);
  if (ramase.length) {
    scrie('');
    scrie('Nerezolvate — pornește din nou, le încearcă exact pe astea:');
    for (const sku of ramase) scrie(`   ${sku}  ${stare.esuate[sku]}`);
  }

  if (legate && !PROBA) {
    scrie('');
    scrie('Pozele apar pe site la prima regenerare: fișele de produs, /catalog,');
    scrie('paginile de categorie și „Ofertele lunii" cer toate câmpul `image`.');
    scrie('');
    scrie('Aici scria că interogarea trebuie încă reparată. A fost reparată între');
    scrie('timp — `image` e cerut acum în GET_PRODUSE_TOATE_QUERY și în');
    scrie('GET_OFERTE_QUERY. Mesajul rămăsese să trimită omul la o treabă făcută.');
  }
}

main().catch((e) => {
  scrie(`eroare neprevăzută: ${e.stack || e.message}`);
  salveazaStarea();
  process.exitCode = 1;
});
