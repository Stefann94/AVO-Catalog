#!/usr/bin/env node
/**
 * Caută pe solarone.ro fotografiile produselor care n-au poză pe site-ul nostru
 * și le descarcă local, pentru revizuire.
 *
 *   node cauta-poze-lipsa.js [optiuni]     sau:   cauta-poze-lipsa.cmd
 *
 * NU URCĂ NIMIC nicăieri. Scrie fișiere într-un director separat
 * (`poze-produse-pas2/`), plus un manifest cu ce a găsit și pe ce bază. Urcarea
 * și legarea rămân pașii următori, făcuți de om după ce se uită peste ele.
 *
 * Nu-i trebuie nicio credențială: lista produselor fără poză se citește prin
 * WPGraphQL, care e public.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * DE CE EXISTĂ, ȘI CE FACE ALTFEL DECÂT PRIMA DESCĂRCARE
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Prima descărcare a adus 79 din 172. Analiza celor 93 rămase a arătat că
 * explicația nu e nici „solarone.ro are mai puține produse" (are 504 pagini de
 * produs față de 172 în catalog), nici „produsele n-au poze acolo" (din 20 de
 * pagini deschise, toate 20 aveau fotografie). Cauza era METODA:
 *
 *   se căuta codul de produs ÎN ADRESA paginii
 *
 * Merge la panouri și invertoare, unde adresa conține modelul:
 *
 *   panou-fotovoltaic-460w-canadian-solar-cs6-2-48td-460-n-type-topcon
 *
 * și eșuează complet acolo unde adresa e o descriere în română, fără cod:
 *
 *   surub-cu-dublu-filet-k2-single-rail     ← codul e 2003274, nicăieri în adresă
 *
 * De-aia lipseau 41 de produse de montaj din 93. Sondaj pe 12 dintre ele,
 * căutate DUPĂ DENUMIRE: 10 există pe solarone.ro.
 *
 * ─── CE FACE ÎN LOC ──────────────────────────────────────────────────────
 *
 * Nu ghicește din adresă. Pentru fiecare produs:
 *
 *   1. caută pe site DUPĂ COD; dacă nu iese nimic, caută DUPĂ DENUMIRE
 *   2. pentru fiecare rezultat, deschide pagina produsului
 *   3. citește codul din datele structurate ale paginii — OpenCart scrie acolo
 *      `"sku": "2003274"`, adică exact codul din catalogul nostru
 *   4. ACCEPTĂ DOAR dacă acel cod se potrivește cu al nostru
 *   5. abia atunci descarcă fotografia
 *
 * Verificarea de la pasul 4 e tot ce desparte unealta asta de prima. Fără ea
 * ies poze greșite, nu doar poze lipsă — și avem dovada în setul urcat deja:
 *
 *   SE-F5 (acumulator) primise fotografia unui INVERTOR Deye
 *   L2200 și L2350 primiseră AMÂNDOUĂ același fișier generic, paravant-lxxx.png
 *
 * Pe un catalog B2B poza greșită e mai rea decât lipsa ei: fotografia e
 * verificarea specificației, iar cine se bazează pe ea comandă altceva.
 *
 * ─── CUM SE COMPARĂ DOUĂ CODURI ──────────────────────────────────────────
 *
 * Nu prin egalitate strictă: magazinul își scrie codurile puțin altfel decât
 * catalogul de parteneri.
 *
 *   catalog „SE-F16"  ↔  magazin „SE-F16 C"           aceeași baterie
 *   catalog „SDM630"  ↔  magazin „SDM630-MODBUS-MID"  același contor
 *
 * Deci: se scot toate caracterele care nu sunt litere sau cifre, se trece la
 * litere mici, și se acceptă dacă unul îl CONȚINE pe celălalt. Cifrele fac
 * treaba grea — „aikoa450mah54mw" nu conține și nu e conținut în
 * „aikoa460mah54mw", deci confuzia dintre panoul de 450 și cel de 460 W, care
 * chiar s-a întâmplat prima dată, nu mai e posibilă.
 *
 * Pragul de 5 caractere ține afară codurile prea scurte, unde „conține" ar
 * însemna orice.
 *
 * ─── RITMUL ──────────────────────────────────────────────────────────────
 *
 * solarone.ro e site-ul altcuiva. `robots.txt` e inaccesibil (403 de la
 * LiteSpeed), deci nu ne putem sprijini pe el, iar în lipsa lui regula pe care
 * o ținem e simplă: cât mai puține cereri, cât mai rar.
 *
 *   o pauză de 2,5s între TOATE cererile, nu doar între produse
 *   cel mult 4 pagini de produs deschise per produs căutat
 *   oprire după 3 blocaje la rând
 *
 * Un produs costă tipic 2–3 cereri, deci ~93 de produse înseamnă ~250 de
 * cereri întinse pe ~12 minute. Cât un om care răsfoiește catalogul.
 *
 * ─── OPȚIUNI ─────────────────────────────────────────────────────────────
 *
 *   --dir <cale>     unde scrie (implicit ../../poze-produse-pas2)
 *   --limita <n>     oprește după n produse (folosește --limita 5 la prima rulare)
 *   --pauza <ms>     între cereri (implicit 2500)
 *   --doar-cauta     nu descarcă fișierele, doar raportează ce ar lua
 *   --de-la-capat    ignoră starea salvată
 */

const fs = require('fs');
const path = require('path');

/* ── Argumente ──────────────────────────────────────────────────────────── */

const arg = (nume, implicit) => {
  const i = process.argv.indexOf(nume);
  return i > -1 ? process.argv[i + 1] : implicit;
};
const are = (nume) => process.argv.includes(nume);

const DIR = path.resolve(__dirname, arg('--dir', '../../poze-produse-pas2'));
const LIMITA = Number(arg('--limita', '0')) || Infinity;
const PAUZA = Number(arg('--pauza', '2500'));
const DOAR_CAUTA = are('--doar-cauta');
const DE_LA_CAPAT = are('--de-la-capat');

const SITE = 'https://www.solarone.ro';
const GRAPHQL = 'https://www.avogrupinvest.ro/graphql';
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' };

const MAX_CANDIDATI = 4;
const BLOCAJE_ACCEPTATE = 3;

const FISIER_STARE = path.join(__dirname, 'cauta-poze-stare.json');
const FISIER_JURNAL = path.join(__dirname, 'cauta-poze-jurnal.txt');
const FISIER_MANIFEST = path.join(DIR, 'manifest.csv');

/* ── Jurnal ─────────────────────────────────────────────────────────────── */

const ceas = () => new Date().toTimeString().slice(0, 8);

function scrie(text = '') {
  const rand = text ? `[${ceas()}] ${text}` : '';
  console.log(rand);
  try { fs.appendFileSync(FISIER_JURNAL, rand + '\n'); } catch { /* nu oprim lucrul */ }
}

function durata(ms) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m ${String(s % 60).padStart(2, '0')}s` : `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
}

/* ── Stare ──────────────────────────────────────────────────────────────── */

let stare = { gata: [], negasite: {} };
if (!DE_LA_CAPAT && fs.existsSync(FISIER_STARE)) {
  try {
    const c = JSON.parse(fs.readFileSync(FISIER_STARE, 'utf8'));
    stare = { gata: c.gata ?? [], negasite: c.negasite ?? {} };
  } catch { scrie('stare coruptă — o iau de la capăt'); }
}
const gata = new Set(stare.gata);

function salveazaStarea() {
  stare.gata = [...gata];
  fs.writeFileSync(FISIER_STARE, JSON.stringify(stare, null, 1));
}

/* ── Cereri, cu o singură pauză comună ──────────────────────────────────── */

const asteapta = (ms) => new Promise((r) => setTimeout(r, ms));
let blocajeLaRand = 0;

/**
 * O cerere, urmată întotdeauna de pauză.
 *
 * Pauza e ÎN funcție, nu la apelant: altfel e prea ușor să adaugi mai târziu o
 * cerere și să uiți pauza, iar ritmul politicos se pierde tăcut.
 */
async function ia(url, binar = false) {
  let r;
  try {
    r = await fetch(url, { headers: UA });
  } catch (e) {
    await asteapta(PAUZA);
    blocajeLaRand++;
    throw new Error(`rețea: ${e.message}`);
  }
  const corp = binar ? Buffer.from(await r.arrayBuffer()) : await r.text();
  await asteapta(PAUZA);
  if (!r.ok) {
    if (r.status === 429 || r.status === 403 || r.status >= 500) blocajeLaRand++;
    throw new Error(`${r.status} ${url.slice(0, 70)}`);
  }
  blocajeLaRand = 0;
  return { corp, tip: r.headers.get('content-type') || '' };
}

/* ── Potrivirea codurilor ───────────────────────────────────────────────── */

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** Vezi comentariul din capul fișierului pentru de ce „conține", nu „egal". */
function coduriSePotrivesc(alNostru, alLor) {
  const a = norm(alNostru), b = norm(alLor);
  if (a.length < 5 || b.length < 5) return false;
  return a.includes(b) || b.includes(a);
}

/* ── A DOUA REGULĂ: jetoanele din titlu ─────────────────────────────────────
   Pragul de 5 caractere de mai sus e necesar, dar taie și produse reale:
   magazinul scrie codul „V5a" pentru ceea ce la noi e „PYTES-V5A-5-12-KWH",
   iar „V5a" are trei caractere. La fel „V5", „V15", sau paravânturile, unde
   magazinul folosește un cod intern (XPF_PB068.5.005A) și pune modelul nostru
   doar în titlu: „Paravant L2350 (2350x304x0,5)".

   Deci: dacă potrivirea pe cod nu reușește, se compară JETOANELE codului
   nostru cu cele din titlul lor. Toate trebuie să apară. „PYTES-V5A-5-12-KWH"
   se sparge în [pytes, v5a, 5, 12, kwh] și toate cinci se regăsesc în
   „Acumulator Pytes Litiu LifePo4 V5a 48V 5.12kWh".

   ─── DE CE SE RESPING PACHETELE ─────────────────────────────────────────

   Fiindcă regula asta, singură, ar accepta un lucru greșit — și avem cazul
   concret: pentru „SUN-5K-SG03LP1-EU" magazinul întoarce „Kit Invertor 5 KW
   DEYE SUN-5K-SG03LP1-EU + 10 x Panou fotovoltaic". Titlul chiar conține
   codul nostru, dar produsul e un kit cu zece panouri, iar fotografia lui
   arată o paletă de panouri, nu un invertor.

   Un titlu care începe cu „Kit" sau „Pachet", sau care leagă componente cu
   „+", descrie un ansamblu. Îl sărim și trecem la rezultatul următor — la
   Pytes V15 exact asta a salvat situația: primul rezultat era un pachet,
   al doilea acumulatorul singur.

   „Set" NU e în listă, deși sună la fel: la noi există „Set Conectori MC4
   EVO2", care e chiar produsul căutat. Cuvântul descrie ambalajul unui
   singur articol, nu o combinație de produse diferite. */

const ESTE_PACHET = /^\s*(kit|pachet|bundle)\b|\s\+\s/i;

function titluSePotriveste(skuNostru, titluLor) {
  if (!titluLor || ESTE_PACHET.test(titluLor)) return false;

  const jetoane = (s) => String(s).toLowerCase().split(/[^a-z0-9]+/i).filter(Boolean);
  const ale = jetoane(skuNostru);
  if (!ale.length) return false;

  // Un singur jeton e prea puțin ca dovadă, decât dacă e un cod în sine —
  // adică amestecă litere și cifre și are cel puțin patru caractere. „L2350"
  // trece; „set" sau „12" nu.
  if (ale.length === 1 && !(ale[0].length >= 4 && /[a-z]/.test(ale[0]) && /\d/.test(ale[0]))) return false;

  const lor = new Set(jetoane(titluLor));
  return ale.every((j) => lor.has(j));
}

/* ── Citirea din pagini ─────────────────────────────────────────────────── */

/** Candidații dintr-o pagină de rezultate: adresa produsului și titlul lui. */
function candidatiDinCautare(html) {
  const out = [];
  const re = /<a\s+href="(https:\/\/www\.solarone\.ro\/[^"?]+)[^"]*"\s+class="product-img[^"]*"[\s\S]{0,2000}?title="([^"]*)"/g;
  let m;
  while ((m = re.exec(html)) && out.length < 20) {
    if (!out.some((c) => c.url === m[1])) out.push({ url: m[1], titlu: m[2].trim() });
  }
  return out;
}

/** Codul scris de magazin în datele structurate ale paginii. */
function codDinPagina(html) {
  const m = html.match(/"sku"\s*:\s*"([^"]+)"/);
  return m ? m[1].trim() : null;
}

/**
 * Fotografia produsului, cât mai mare.
 *
 * Se preferă 1000x1000; dacă lipsește, 800 apoi 500. Se sar siglele și
 * bannerele — stau tot sub /image/cache/ dar au alte dimensiuni.
 */
function pozaDinPagina(html) {
  const toate = [...new Set(
    [...html.matchAll(/https:\/\/www\.solarone\.ro\/image\/cache\/catalog\/[^"'\s]+?\.(?:webp|jpg|jpeg|png)/gi)].map((m) => m[0]),
  )];
  for (const marime of ['1000x1000', '800x800', '500x500']) {
    const gasit = toate.find((u) => u.includes(marime));
    if (gasit) return gasit;
  }
  return null;
}

/* ── Produsele fără poză, din WPGraphQL ─────────────────────────────────── */

const Q_PRODUSE = `query ProduseFaraPoza($after: String) {
  products(first: 100, after: $after) {
    pageInfo { hasNextPage endCursor }
    nodes { ... on SimpleProduct { sku name image { sourceUrl } } }
  }
}`;

async function produseFaraPoza() {
  const out = [];
  let after = null;
  do {
    const r = await fetch(GRAPHQL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...UA },
      body: JSON.stringify({ query: Q_PRODUSE, variables: { after } }),
    });
    const j = await r.json();
    if (j.errors) throw new Error('GraphQL: ' + JSON.stringify(j.errors).slice(0, 200));
    const p = j.data.products;
    for (const n of p.nodes) if (n?.sku && !n.image) out.push({ sku: n.sku.trim(), nume: (n.name || '').trim() });
    after = p.pageInfo.hasNextPage ? p.pageInfo.endCursor : null;
  } while (after);
  return out;
}

/* ── Termenul de căutare după denumire ──────────────────────────────────── */

/**
 * Denumirea din catalog, curățată pentru căutare.
 *
 * Se taie coada cu codul repetat („… - 2003274"), parantezele și tot ce vine
 * după virgulă: căutarea magazinului dă zero rezultate la un șir prea lung,
 * fiindcă le cere pe toate cuvintele.
 */
function termenDinNume(nume) {
  return nume
    .replace(/\s*[-–]\s*[A-Z0-9.\-]{5,}\s*$/i, '')
    .split(/[,(]/)[0]
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
}

/* ── Programul ──────────────────────────────────────────────────────────── */

let intrerupt = false;
process.on('SIGINT', () => {
  if (intrerupt) process.exit(1);
  intrerupt = true;
  scrie('');
  scrie('oprire cerută — termin produsul curent și ies');
});

const EXT = { 'image/webp': '.webp', 'image/jpeg': '.jpg', 'image/png': '.png' };

async function main() {
  fs.mkdirSync(DIR, { recursive: true });

  scrie('');
  scrie(`══ căutare poze lipsă · ${new Date().toLocaleString('ro-RO')} ══`);

  const toate = await produseFaraPoza();
  const deja = new Set(
    fs.readdirSync(DIR).filter((f) => /\.(webp|jpe?g|png)$/i.test(f)).map((f) => f.replace(/\.\w+$/, '')),
  );
  const deFacut = toate.filter((p) => !gata.has(p.sku) && !deja.has(p.sku)).slice(0, LIMITA);

  scrie(`produse fără poză pe site: ${toate.length}`);
  if (deja.size) scrie(`deja descărcate în ${DIR}: ${deja.size}`);
  scrie(`de căutat acum: ${deFacut.length}`);
  scrie(`pauză între cereri: ${PAUZA}ms · estimat ~${durata(deFacut.length * 3 * PAUZA)}`);
  if (DOAR_CAUTA) scrie('MOD --doar-cauta: nu se descarcă fișiere.');
  scrie('');

  const manifest = [];
  let gasite = 0, negasite = 0;
  let n = 0;
  const pornire = Date.now();

  for (const p of deFacut) {
    if (intrerupt) break;
    n++;
    const eticheta = `[${String(n).padStart(3)}/${deFacut.length}]`;

    try {
      // 1. Întâi după cod — e cel mai precis când magazinul îl indexează.
      //    Dacă nu iese nimic, după denumire.
      let candidati = [];
      for (const termen of [p.sku, termenDinNume(p.nume)]) {
        if (!termen || termen.length < 3) continue;
        const { corp } = await ia(`${SITE}/index.php?route=product/search&search=${encodeURIComponent(termen)}`);
        candidati = candidatiDinCautare(corp);
        if (candidati.length) break;
      }

      if (!candidati.length) {
        scrie(`${eticheta} negăsit   ${p.sku}  (căutarea n-a întors nimic)`);
        stare.negasite[p.sku] = 'căutarea n-a întors rezultate';
        negasite++;
        continue;
      }

      // 2. Verificarea: deschidem paginile și comparăm codul scris de magazin.
      let potrivit = null;
      const vazute = [];
      for (const c of candidati.slice(0, MAX_CANDIDATI)) {
        const { corp } = await ia(c.url);
        const codLor = codDinPagina(corp);
        vazute.push(`${c.titlu.slice(0, 30)}=${codLor ?? '?'}`);

        // Întâi codul — e dovada cea mai tare. Apoi titlul, pentru cazurile în
        // care magazinul folosește un cod intern sau prea scurt.
        const prinCod = codLor && coduriSePotrivesc(p.sku, codLor);
        const prinTitlu = !prinCod && titluSePotriveste(p.sku, c.titlu);

        if (prinCod || prinTitlu) {
          potrivit = {
            ...c,
            cod: codLor ?? '(fără cod)',
            cum: prinCod ? `cod magazin: ${codLor}` : `titlu magazin: ${c.titlu.slice(0, 60)}`,
            poza: pozaDinPagina(corp),
          };
          break;
        }
      }

      if (!potrivit) {
        scrie(`${eticheta} necofirm  ${p.sku}  — ${candidati.length} rezultate, niciunul cu codul potrivit`);
        scrie(`             coduri văzute: ${vazute.join(' · ').slice(0, 110)}`);
        stare.negasite[p.sku] = `rezultate fără cod potrivit: ${vazute.join(' | ').slice(0, 200)}`;
        negasite++;
        continue;
      }

      if (!potrivit.poza) {
        scrie(`${eticheta} fără poză ${p.sku}  — pagina se potrivește, dar n-are fotografie`);
        stare.negasite[p.sku] = 'pagina potrivită, fără fotografie';
        negasite++;
        continue;
      }

      if (DOAR_CAUTA) {
        scrie(`${eticheta} ar lua    ${p.sku}  ← ${potrivit.cod}  ${potrivit.poza.split('/').pop().slice(0, 44)}`);
        manifest.push([p.sku, "", potrivit.poza, potrivit.titlu, potrivit.cum]);
        gasite++;
        continue;
      }

      // 3. Descărcarea.
      const { corp, tip } = await ia(potrivit.poza, true);
      const ext = EXT[tip.split(';')[0]] || path.extname(new URL(potrivit.poza).pathname) || '.jpg';
      const fisier = `${p.sku}${ext}`;
      fs.writeFileSync(path.join(DIR, fisier), corp);

      scrie(`${eticheta} luat      ${p.sku}  ← ${potrivit.cod}  ${Math.round(corp.length / 1024)}KB  ${fisier}`);
      manifest.push([p.sku, fisier, potrivit.poza, potrivit.titlu, potrivit.cum]);
      gata.add(p.sku);
      delete stare.negasite[p.sku];
      gasite++;
    } catch (e) {
      scrie(`${eticheta} EROARE    ${p.sku}  ${e.message}`);
      stare.negasite[p.sku] = e.message;
      negasite++;
    }

    salveazaStarea();

    if (blocajeLaRand >= BLOCAJE_ACCEPTATE) {
      scrie('');
      scrie(`OPRESC: ${BLOCAJE_ACCEPTATE} refuzuri la rând de la solarone.ro.`);
      scrie('Reia mai târziu — starea e salvată. Nu insista acum.');
      break;
    }

    if (n % 10 === 0) {
      const medie = (Date.now() - pornire) / n;
      scrie(`        ${gasite} găsite · ${negasite} nu — mai rămân ${deFacut.length - n}, ~${durata((deFacut.length - n) * medie)}`);
    }
  }

  // Manifestul se adaugă la cel existent, ca rulările succesive să nu-l piardă.
  if (manifest.length) {
    const antet = '"sku","fisier","sursa","titlu_magazin","verificare"\n';
    const randuri = manifest.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n') + '\n';
    if (fs.existsSync(FISIER_MANIFEST)) fs.appendFileSync(FISIER_MANIFEST, randuri);
    else fs.writeFileSync(FISIER_MANIFEST, antet + randuri);
  }

  salveazaStarea();
  scrie('');
  scrie(`══ gata în ${durata(Date.now() - pornire)} ══`);
  scrie(`găsite ${gasite} · negăsite ${negasite}`);
  if (gasite && !DOAR_CAUTA) {
    scrie('');
    scrie(`Fișierele sunt în ${DIR}`);
    scrie(`Manifestul, cu ce cod a confirmat fiecare potrivire: ${FISIER_MANIFEST}`);
    scrie('');
    scrie('UITĂ-TE PESTE ELE ÎNAINTE SĂ LE URCI. Codul a fost verificat pe pagina');
    scrie('magazinului, dar o privire peste 50 de miniaturi durează două minute și');
    scrie('prinde ce nicio regulă nu prinde.');
  }
}

main().catch((e) => {
  scrie(`eroare neprevăzută: ${e.stack || e.message}`);
  salveazaStarea();
  process.exitCode = 1;
});
