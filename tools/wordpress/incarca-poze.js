#!/usr/bin/env node
/**
 * Încarcă pozele de produs în WooCommerce și le leagă de produse.
 *
 *   node incarca-poze.js [optiuni]
 *
 * Pe Windows se pornește mai simplu cu incarca-poze.cmd, care citește
 * credențialele din .env.local. Pentru fundal:
 *
 *   start "AVO poze" /min incarca-poze.cmd
 *
 * Progresul se vede oricum în incarca-poze-jurnal.txt, scris de script.
 *
 * ─── CREDENȚIALE ──────────────────────────────────────────────────────────
 *
 * Din variabile de mediu sau din `.env.local` de lângă script (vezi
 * .env.local.exemplu; fișierul e în .gitignore):
 *
 *   WP_URL=https://www.avogrupinvest.ro
 *   WP_USER=<utilizator WordPress cu drept de încărcare>
 *   WP_APP_PASSWORD=<parolă de aplicație, cu spații cu tot>
 *
 * Parola de aplicație se face în WordPress la Utilizatori → Profil →
 * „Application Passwords". NU e parola de logare, și se poate revoca separat
 * fără să schimbi nimic altceva.
 *
 * ─── DE CE PRIN REST, NU PRIN IMPORT CSV ──────────────────────────────────
 *
 * Importatorul lunar de catalog (tools/catalog-import) NU scrie coloana
 * `Images`. Asta e deliberat și e proprietatea pe care se sprijină tot
 * mecanismul: o poză pusă o dată în biblioteca media rămâne legată de produs
 * peste toate reimporturile următoare. Dacă pozele ar veni prin CSV, fiecare
 * import le-ar rescrie — și ar trebui să ai tot setul, în fiecare lună.
 *
 * Deci pozele se pun O SINGURĂ DATĂ, pe alt drum decât prețurile. Ăsta e drumul.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * RITMUL — de ce e un regulator, nu o pauză fixă
 * ══════════════════════════════════════════════════════════════════════════
 *
 * CE TE BLOCHEAZĂ NU E NUMĂRUL DE CERERI. Pentru fiecare poză se fac patru
 * cereri REST (caută produsul după SKU, urcă fișierul, scrie `alt`, leagă), deci
 * 79 de poze înseamnă ~316 cereri. La pauza de pornire asta dă ~8 cereri pe
 * minut, iar pragurile obișnuite de firewall sunt de ordinul sutelor pe minut —
 * suntem cu două ordine de mărime dedesubt.
 *
 * Ce doare e ÎNCĂRCAREA în sine: la fiecare fișier primit WordPress generează
 * cinci-șase miniaturi, adică una-trei secunde de CPU. Un șir de încărcări fără
 * pauză arată, pentru o găzduire partajată, exact ca un abuz de resurse — și e
 * tăiat pe la jumătate, lăsându-te cu jumătate din produse cu poză și fără să
 * știi care. De aceea pauza e ÎNTRE POZE, nu între cereri: rafala de patru
 * cereri e neînsemnată, vârful de CPU e problema.
 *
 * PAUZA PERFECTĂ NU SE POATE ȘTI DE AICI. Depinde de firewall (Cloudflare,
 * mod_security, Wordfence), de limitele de CPU ale găzduirii și de cât e
 * încărcat serverul în ora aia. Aici era o constantă de 900ms — un număr ales
 * fără să știe nimic despre serverul pe care nimerește. Orice constantă e ori
 * prea lentă degeaba, ori prea rapidă exact în ziua proastă.
 *
 *   pornire ...... 30s. Prudent: ~40 min pentru 79 de poze, dacă n-ar
 *                  accelera niciodată.
 *   accelerare ... după 5 poze curate la rând, pauza scade cu 15%, până la
 *                  podeaua de 12s. Treptat, ca un firewall cu fereastră
 *                  glisantă să aibă timp să se golească între trepte.
 *   frânare ...... la orice semn de blocaj, pauza se ÎNMULȚEȘTE cu 4 și
 *                  podeaua urcă cu 50%. Podeaua urcă DEFINITIV: dacă serverul
 *                  s-a plâns o dată la 12s, n-are rost să ne întoarcem acolo.
 *   tavan ........ 10 minute.
 *
 * DEVIAȚIE ALEATOARE de ±35% pe fiecare pauză. Nu e cochetărie: un interval
 * perfect constant e el însuși o semnătură de robot, iar unele reguli de
 * firewall se declanșează pe regularitate, nu pe volum.
 *
 * ÎN PRACTICĂ: ~20 de minute pentru 79 de poze dacă serverul e sănătos (ajunge
 * la podea pe la poza 30), ~40 dacă nu accelerează deloc, oricât e nevoie dacă
 * serverul se plânge — dar fără să piardă nicio poză.
 *
 * UN RĂSPUNS HTML LA UN COD DE EROARE E O PAGINĂ DE FIREWALL. API-ul WordPress
 * răspunde întotdeauna JSON; dacă vine `<html>`, am fost tăiați, iar asta se
 * tratează ca blocaj, nu ca eroare de date.
 *
 * TREI BLOCAJE LA RÂND opresc scriptul. Dacă firewall-ul chiar ne-a pus pe
 * listă, insistența doar prelungește interdicția.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * CUM NU SE PIERDE PROGRESUL, ȘI CUM NU SE URCĂ NIMIC DE DOUĂ ORI
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Sunt DOUĂ întrebări diferite, iar versiunea anterioară o punea doar pe prima:
 *
 *   (a) are produsul deja imagine?  ... `produs.images.length`, vine gratis din
 *       cererea pe care o faci oricum ca să găsești produsul după SKU
 *
 *   (b) e fișierul deja în bibliotecă? ... asta lipsea, și asta face rău
 *
 * Dacă scriptul moare ÎNTRE „urcă fișierul" și „leagă de produs", rămâne un
 * orfan în biblioteca media. La rulare nouă îl urci iar, iar WordPress nu
 * refuză: redenumește tăcut în `...-1.webp`, `-2`, `-3`. Se adună fără să vezi.
 *
 * SOLUȚIA E UN MARCAJ SCRIS ÎNAINTE DE FAPTĂ. În `incarca-poze-stare.json`:
 *
 *   inLucru ... SKU-ul la care s-a pornit încărcarea, scris ÎNAINTE de ea
 *   media ..... SKU → id-ul media deja urcat, scris imediat DUPĂ încărcare
 *   gata ...... SKU-urile terminate complet
 *   esuate .... SKU → motivul, ca o rulare nouă să le încerce exact pe alea
 *
 * La repornire:
 *   - `media[sku]` există    → fișierul e sus, se sare peste încărcare
 *   - `inLucru === sku`      → am murit în fereastra dintre încărcare și
 *                              salvarea id-ului; se caută orfanul în bibliotecă
 *   - altfel                 → nicio cerere în plus
 *
 * Deci verificarea în bibliotecă costă o cerere suplimentară DOAR în cazul rar
 * al unei opriri în fereastra aia, nu la fiecare poză.
 *
 * ORFANUL SE CAUTĂ DUPĂ `source_url`, NU DUPĂ SLUG. Ar fi fost mai scurt să
 * ghicim slug-ul din numele fișierului, dar regulile WordPress de curățare nu
 * sunt evidente — `sanitize_title` ȘTERGE punctul, nu îl transformă în liniuță,
 * deci „CS6.2-48TD-460" devine „cs62-48td-460", nu „cs6-2-48td-460". În loc să
 * ne bazăm pe asta, cerem după `search` și comparăm numele real din
 * `source_url`. Comparația exactă are și avantajul că nu se agață de
 * duplicatele `-1`, `-2`: găsește originalul.
 *
 * REÎNCERCAREA RELUĂ DE UNDE A RĂMAS. Fiecare poză se încearcă de până la 4
 * ori, dar `mediaId` se ține minte între încercări: dacă fișierul a ajuns deja
 * sus, a doua încercare doar leagă. Fără asta, o eroare la pasul de legare ar
 * fi lăsat un duplicat în bibliotecă la FIECARE reîncercare.
 *
 * Versiunea anterioară prindea eroarea, o număra și trecea la poza următoare —
 * adică exact comportamentul care lasă găuri fără să te anunțe care.
 *
 * NU SUPRASCRIE NIMIC. Un produs care are deja poză e lăsat în pace. Pozele
 * astea sunt un punct de plecare de calitate modestă — 700×700, ~7 KB; când
 * vine una mai bună de la producător, o pui de mână și rulările următoare n-o
 * vor mai atinge. Pentru înlocuire deliberată există `--forteaza`.
 *
 * ─── OPȚIUNI ─────────────────────────────────────────────────────────────
 *
 *   --proba              nu scrie nimic, doar arată ce ar face
 *   --limita <n>         oprește după n poze (foloseste `--limita 3` la prima
 *                        rulare: cel mai ieftin mod de a afla dacă găzduirea
 *                        blochează în general)
 *   --dir <cale>         directorul cu poze (implicit ../../poze-produse)
 *   --forteaza           înlocuiește și pozele existente
 *   --doar-sigure        doar potrivirile „cod+cifra" din manifest.csv (59 din
 *                        79). Celelalte 20 s-au potrivit doar pe cod, fără o
 *                        cifră de specificație — acolo ajunge poza altui model
 *                        pe produs, ceea ce pe un catalog B2B e mai rău decât
 *                        nicio poză: fotografia e verificarea specificației
 *   --verifica-media     caută orfani în bibliotecă pentru FIECARE poză, nu
 *                        doar pentru cea întreruptă. De folosit o singură dată,
 *                        dacă a rulat înainte o versiune fără marcaje
 *   --pauza <s>          pauza de pornire, în secunde (implicit 30)
 *   --pauza-min <s>      podeaua (implicit 12)
 *   --pauza-max <s>      tavanul (implicit 600)
 *   --de-la-capat        ignoră starea salvată
 */

const fs = require('fs');
const path = require('path');
const { explicaEsecDeAcces } = require('./diagnostic-acces');

/* ── Argumente și credențiale ───────────────────────────────────────────── */

const arg = (nume, implicit) => {
  const i = process.argv.indexOf(nume);
  return i > -1 ? process.argv[i + 1] : implicit;
};
const are = (nume) => process.argv.includes(nume);

/**
 * Citește `.env.local` de lângă script, dacă există.
 *
 * Variabilele deja puse în mediu câștigă, ca să poți suprascrie fișierul la o
 * rulare anume fără să-l editezi.
 */
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
const LIMITA = Number(arg('--limita', '0')) || Infinity;
const PROBA = are('--proba') || are('--dry-run');
const FORTEAZA = are('--forteaza');
const DOAR_SIGURE = are('--doar-sigure');
const VERIFICA_MEDIA = are('--verifica-media');
const DE_LA_CAPAT = are('--de-la-capat');

const PAUZA_PORNIRE = Number(arg('--pauza', '30')) * 1000;
const PAUZA_PODEA_INITIALA = Number(arg('--pauza-min', '12')) * 1000;
const PAUZA_TAVAN = Number(arg('--pauza-max', '600')) * 1000;

const DEVIATIE = 0.35;
const PAS_ACCELERARE = 0.85;
const POZE_PE_TREAPTA = 5;
const FACTOR_FRANARE = 4;
const INCERCARI = 4;
const BLOCAJE_ACCEPTATE = 3;

const FISIER_STARE = path.join(__dirname, 'incarca-poze-stare.json');
const FISIER_JURNAL = path.join(__dirname, 'incarca-poze-jurnal.txt');

/* ── Jurnal ─────────────────────────────────────────────────────────────── */

const ceas = () => new Date().toTimeString().slice(0, 8);

function scrie(text = '') {
  const rand = text ? `[${ceas()}] ${text}` : '';
  console.log(rand);
  try {
    fs.appendFileSync(FISIER_JURNAL, rand + '\n');
  } catch {
    /* Un jurnal care nu se poate scrie n-are voie să oprească încărcarea. */
  }
}

/** „4m 12s", „38s", „1h 05m" — cât să se citească dintr-o privire. */
function durata(ms) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, '0')}s`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
}

/* ── Stare ──────────────────────────────────────────────────────────────── */

let stare = { gata: [], inLucru: null, media: {}, esuate: {} };

if (!DE_LA_CAPAT && fs.existsSync(FISIER_STARE)) {
  try {
    const citit = JSON.parse(fs.readFileSync(FISIER_STARE, 'utf8'));
    stare = {
      gata: citit.gata ?? [],
      inLucru: citit.inLucru ?? null,
      media: citit.media ?? {},
      esuate: citit.esuate ?? {},
    };
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

const AUTH = 'Basic ' + Buffer.from(`${USER}:${PAROLA}`).toString('base64');
const asteapta = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Eroare de la server, cu ce ne trebuie ca s-o clasificăm.
 *
 * `blocaj` înseamnă „serverul ne-a refuzat din motive de ritm sau securitate",
 * deci frânăm și reîncercăm. Fără el e o problemă a datelor, iar încetinirea
 * n-ar rezolva nimic.
 */
class EroareHttp extends Error {
  constructor(status, mesaj, retryAfter, blocaj) {
    super(mesaj);
    this.status = status;
    this.retryAfter = retryAfter;
    this.blocaj = blocaj;
  }
}

/** `Retry-After` vine ori în secunde, ori ca dată HTTP. Le acceptăm pe amândouă. */
function citesteRetryAfter(antet) {
  if (!antet) return null;
  const secunde = Number(antet);
  if (Number.isFinite(secunde)) return secunde * 1000;
  const data = Date.parse(antet);
  return Number.isNaN(data) ? null : Math.max(0, data - Date.now());
}

async function cere(cale, optiuni = {}) {
  let r;
  try {
    r = await fetch(`${URL_WP}${cale}`, {
      ...optiuni,
      headers: { Authorization: AUTH, ...(optiuni.headers || {}) },
    });
  } catch (e) {
    // Rețeaua a căzut sau serverul a închis conexiunea. Se tratează ca blocaj:
    // un firewall care taie conexiunea arată exact așa.
    throw new EroareHttp(0, `rețea: ${e.message}`, null, true);
  }

  const text = await r.text();
  let corp;
  try {
    corp = JSON.parse(text);
  } catch {
    corp = text;
  }

  if (r.ok) return corp;

  // Corp HTML la un cod de eroare = pagină de firewall (mod_security,
  // Cloudflare). API-ul WordPress răspunde întotdeauna JSON.
  const eHtml = typeof corp === 'string' && /^\s*</.test(corp);
  const blocaj =
    r.status === 429 || r.status === 403 || r.status === 406 || r.status >= 500 || eHtml;

  const mesaj = corp && corp.message
    ? corp.message
    : eHtml
      ? 'răspuns HTML (pagină de firewall?)'
      : String(corp).slice(0, 160);

  throw new EroareHttp(
    r.status,
    `${r.status} ${cale.split('?')[0]} — ${mesaj}`,
    citesteRetryAfter(r.headers.get('retry-after')),
    blocaj,
  );
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

function dupaPozaCurata() {
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
  // Serverul spune el cât vrea să aștepte; asta bate orice socoteală de-a noastră.
  const impus = e.retryAfter && e.retryAfter > pauzaBaza ? Math.min(PAUZA_TAVAN, e.retryAfter) : null;
  if (impus) pauzaBaza = impus;
  scrie(
    `        ritm: FRÂNEZ — pauza urcă la ~${Math.round(pauzaBaza / 1000)}s, ` +
    `podeaua la ${Math.round(podea / 1000)}s` +
    (impus ? ' (cerut de server prin Retry-After)' : ''),
  );
}

/* ── Pașii unei poze ────────────────────────────────────────────────────── */

const MIME = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
};

async function gasesteProdus(sku) {
  const gasite = await cere(`/wp-json/wc/v3/products?sku=${encodeURIComponent(sku)}`);
  return Array.isArray(gasite) ? gasite[0] : null;
}

/**
 * Caută în bibliotecă un fișier cu exact numele ăsta.
 *
 * Comparăm numele real din `source_url`, nu un slug ghicit — vezi comentariul
 * din capul fișierului pentru de ce ghicitul nu ține.
 */
async function gasesteMediaExistenta(fisier) {
  const baza = path.basename(fisier, path.extname(fisier));
  const rezultate = await cere(
    `/wp-json/wp/v2/media?search=${encodeURIComponent(baza)}&per_page=20`,
  );
  if (!Array.isArray(rezultate)) return null;
  return rezultate.find((m) => {
    const nume = decodeURIComponent(String(m.source_url || '').split('/').pop() || '');
    return nume === fisier;
  }) || null;
}

async function urcaMedia(fisier) {
  const continut = fs.readFileSync(path.join(DIR, fisier));
  return cere('/wp-json/wp/v2/media', {
    method: 'POST',
    headers: {
      'Content-Disposition': `attachment; filename="${fisier}"`,
      'Content-Type': MIME[path.extname(fisier).toLowerCase()],
    },
    body: continut,
  });
}

/* ── Selecția fișierelor ────────────────────────────────────────────────── */

/**
 * SKU-urile cu potrivire sigură, din manifestul de descărcare.
 *
 * Coloana `verificare` spune cum s-a găsit poza: „cod+cifra" înseamnă că s-au
 * potrivit și codul, și o cifră de specificație (putere, capacitate); „doar
 * cod" înseamnă că s-a potrivit numai codul — acolo poate ajunge poza altui
 * model pe produs.
 */
function skuSigure() {
  const candidati = [
    path.join(DIR, 'manifest.csv'),
    path.resolve(DIR, '../poze-solarone/manifest.csv'),
  ];
  const f = candidati.find((c) => fs.existsSync(c));
  if (!f) return null;

  const set = new Set();
  for (const l of fs.readFileSync(f, 'utf8').split(/\r?\n/).slice(1)) {
    if (!l.trim()) continue;
    const campuri = l.split('","').map((c) => c.replace(/^"|"$/g, ''));
    if (campuri[3] === 'cod+cifra') set.add(campuri[0]);
  }
  return set;
}

/* ── Programul ──────────────────────────────────────────────────────────── */

let intrerupt = false;
process.on('SIGINT', () => {
  if (intrerupt) process.exit(1);   // al doilea Ctrl+C iese imediat
  intrerupt = true;
  scrie('');
  scrie('oprire cerută — termin poza curentă, salvez starea și ies (Ctrl+C din nou = imediat)');
});

async function main() {
  if (!URL_WP || !USER || !PAROLA) {
    console.error(
      'Lipsesc WP_URL, WP_USER sau WP_APP_PASSWORD.\n' +
      'Pune-le în tools/wordpress/.env.local (vezi .env.local.exemplu) sau în mediu.',
    );
    process.exit(1);
  }

  scrie('');
  scrie(`══ încărcare poze · ${new Date().toLocaleString('ro-RO')} ══`);

  let fisiere = fs
    .readdirSync(DIR)
    .filter((f) => MIME[path.extname(f).toLowerCase()])
    .sort();

  if (DOAR_SIGURE) {
    const sigure = skuSigure();
    if (!sigure) {
      console.error('--doar-sigure: nu găsesc manifest.csv nici în directorul de poze, nici în poze-solarone/');
      process.exit(1);
    }
    const inainte = fisiere.length;
    fisiere = fisiere.filter((f) => sigure.has(path.basename(f, path.extname(f))));
    scrie(`--doar-sigure: ${fisiere.length} din ${inainte} (potriviri „cod+cifra")`);
  }

  const deFacut = fisiere
    .filter((f) => !gata.has(path.basename(f, path.extname(f))))
    .slice(0, LIMITA);

  scrie(`${fisiere.length} fișiere în ${DIR}`);
  if (gata.size) scrie(`${gata.size} terminate într-o rulare anterioară — le sar`);
  if (stare.inLucru) scrie(`întreruptă la ${stare.inLucru} — verific dacă fișierul a apucat să urce`);
  if (PROBA) scrie('MOD PROBĂ — nu se scrie nimic în WordPress.');

  // Verificare de acces înainte de orice încărcare: mai bine un mesaj clar
  // acum decât 79 de eșecuri identice peste o oră.
  if (!PROBA) {
    try {
      await cere('/wp-json/wc/v3/products?per_page=1');
      scrie('acces verificat: WooCommerce răspunde');
    } catch (e) {
      console.error('');
      for (const r of await explicaEsecDeAcces(URL_WP, e)) console.error(r);
      // `process.exit` peste o cerere încă deschisă face libuv să tipărească un
      // „Assertion failed" după mesaj, care arată ca o prăbușire. Ieșim curat.
      process.exitCode = 1;
      return;
    }
  }

  const total = deFacut.length;
  if (!total) {
    scrie('nimic de făcut — toate pozele sunt deja urcate.');
    return;
  }

  // Estimarea de pornire pleacă de la media dintre pauza inițială și podea,
  // fiindcă regulatorul coboară treptat spre ea. După primele poze o înlocuiesc
  // cu timpul real măsurat.
  scrie(`de făcut: ${total} · estimat ~${durata((total * (PAUZA_PORNIRE + PAUZA_PODEA_INITIALA)) / 2)}`);
  scrie('');

  let urcate = 0, sarite = 0, negasite = 0, esuate = 0;
  let n = 0;
  const cicluri = [];              // durata ultimelor poze, cu pauză cu tot
  const pornireRulare = Date.now();

  for (const fisier of deFacut) {
    if (intrerupt) break;
    n++;
    const sku = path.basename(fisier, path.extname(fisier));
    const inceputPoza = Date.now();

    const procent = Math.round(((n - 1) / total) * 100);
    const eticheta = `[${String(n).padStart(3)}/${total}] ${String(procent).padStart(3)}%`;

    let produs = null;
    let mediaId = stare.media[sku] ?? null;
    let reusit = false;
    let ultimaEroare = null;
    let pauzaFolosita = 0;

    for (let incercare = 1; incercare <= INCERCARI && !intrerupt; incercare++) {
      try {
        if (!produs) {
          produs = await gasesteProdus(sku);
          if (!produs) {
            scrie(`${eticheta} fără produs   ${sku}`);
            negasite++;
            stare.esuate[sku] = 'niciun produs cu acest SKU';
            break;
          }
          if (produs.images && produs.images.length && !FORTEAZA) {
            scrie(`${eticheta} are deja poză ${sku}`);
            sarite++;
            gata.add(sku);
            reusit = true;
            break;
          }
          if (PROBA) {
            scrie(`${eticheta} ar urca       ${sku}  →  #${produs.id} ${produs.name.slice(0, 38)}`);
            urcate++;
            reusit = true;
            break;
          }
        }

        // Fișierul poate fi deja sus dintr-o rulare oprită la mijloc. Căutarea
        // se face doar când marcajul spune că acolo am rămas — sau la cerere.
        if (!mediaId && (VERIFICA_MEDIA || stare.inLucru === sku)) {
          const existenta = await gasesteMediaExistenta(fisier);
          if (existenta) {
            mediaId = existenta.id;
            scrie(`${eticheta} deja în media ${sku}  →  media #${mediaId}, nu reurc`);
          }
        }

        if (!mediaId) {
          // Marcajul se scrie ÎNAINTE de încărcare: dacă procesul moare în
          // timpul ei, următoarea rulare știe unde să caute orfanul.
          stare.inLucru = sku;
          salveazaStarea();

          mediaId = (await urcaMedia(fisier)).id;

          stare.media[sku] = mediaId;
          salveazaStarea();
        }

        await cere(`/wp-json/wp/v2/media/${mediaId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // `alt` e denumirea reală a produsului, nu numele fișierului: fișierul
          // se cheamă „CS6.2-48TD-460.webp", ceea ce nu spune nimic unui
          // cititor de ecran.
          body: JSON.stringify({ title: produs.name, alt_text: produs.name }),
        });

        await cere(`/wp-json/wc/v3/products/${produs.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: [{ id: mediaId }] }),
        });

        urcate++;
        gata.add(sku);
        delete stare.media[sku];
        delete stare.esuate[sku];
        stare.inLucru = null;
        reusit = true;

        scrie(`${eticheta} urcat         ${sku}  →  #${produs.id}   în ${durata(Date.now() - inceputPoza)}`);
        break;
      } catch (e) {
        ultimaEroare = e;
        scrie(
          `${eticheta} ${e.blocaj ? 'BLOCAJ' : 'eroare'}        ${sku}  ${e.message}` +
          `  (încercarea ${incercare}/${INCERCARI})`,
        );

        if (!e.blocaj) break;   // problemă de date; reîncercarea n-o rezolvă

        dupaBlocaj(e);
        if (blocajeLaRand >= BLOCAJE_ACCEPTATE) break;
        if (incercare < INCERCARI) {
          const p = pauzaUrmatoare();
          pauzaFolosita += p;
          await asteapta(p);
        }
      }
    }

    if (reusit) dupaPozaCurata();
    else if (ultimaEroare) {
      esuate++;
      stare.esuate[sku] = ultimaEroare.message;
    }
    if (!reusit) stare.inLucru = null;
    salveazaStarea();

    if (blocajeLaRand >= BLOCAJE_ACCEPTATE) {
      scrie('');
      scrie(`OPRESC: ${BLOCAJE_ACCEPTATE} blocaje la rând. Serverul ne refuză constant.`);
      scrie('Insistența doar prelungește interdicția. Reia mai târziu — starea e salvată,');
      scrie('deci continuă exact de unde a rămas. Dacă se repetă, mărește pauza: --pauza 120');
      break;
    }

    // Pauza dintre poze, apoi socoteala de progres. Ciclul măsurat include
    // și pauza, ca estimarea să spună timp real de ceas, nu timp de lucru.
    let pauzaAcum = 0;
    if (n < total && !intrerupt) {
      pauzaAcum = pauzaUrmatoare();
      await asteapta(pauzaAcum);
    }

    cicluri.push(Date.now() - inceputPoza);
    if (cicluri.length > 5) cicluri.shift();   // media ultimelor 5, ca să urmeze accelerarea
    const medie = cicluri.reduce((s, c) => s + c, 0) / cicluri.length;
    const ramase = total - n;

    if (ramase > 0) {
      scrie(
        `        ${urcate} urcate · ${sarite} sărite · ${esuate} eșuate  |  ` +
        `${durata(medie)}/poză  |  pauză ${Math.round((pauzaAcum + pauzaFolosita) / 1000)}s  |  ` +
        `mai rămân ${ramase}, ~${durata(ramase * medie)}`,
      );
    }
  }

  stare.inLucru = null;
  salveazaStarea();

  scrie('');
  scrie(`══ gata în ${durata(Date.now() - pornireRulare)} ══`);
  scrie(`urcate ${urcate} · sărite (aveau poză) ${sarite} · fără produs ${negasite} · eșuate ${esuate}`);

  const ramase = Object.keys(stare.esuate);
  if (ramase.length) {
    scrie('');
    scrie('Nerezolvate — pornește scriptul din nou, le încearcă exact pe astea:');
    for (const sku of ramase) scrie(`   ${sku}  ${stare.esuate[sku]}`);
  }

  if (urcate && !PROBA) {
    scrie('');
    scrie('Site-ul se împrospătează singur: plugin-ul cheamă /api/revalidate la salvarea');
    scrie('produsului. Dacă nu e configurat, prima vizită de după o oră aduce pozele.');
    scrie('ATENȚIE: fișele de produs NU vor arăta pozele până nu cere `image` și');
    scrie('GET_PRODUSE_TOATE_QUERY din src/lib/queries.ts — vezi produs.ts:254.');
  }
}

main().catch((e) => {
  scrie(`eroare neprevăzută: ${e.stack || e.message}`);
  stare.inLucru = null;
  salveazaStarea();
  process.exit(1);
});
