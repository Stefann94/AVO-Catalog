#!/usr/bin/env node
/**
 * Descarcă fotografii de produs de pe pagini indicate explicit, una câte una.
 *
 *   node cauta-poze-tinta.js [--dir ...] [--proba]
 *
 * Ținta fiecărui produs se scrie în `tinte-poze.json`, de lângă script:
 *
 *   { "PYTES-V15-14-34KWH": "https://www.pytesess.com/Low-Voltage-Battery/V15.html" }
 *
 * ══════════════════════════════════════════════════════════════════════════
 * DE CE ADRESE SCRISE DE MÂNĂ, DUPĂ TREI UNELTE AUTOMATE
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Fiindcă restul produselor sunt împrăștiate pe opt site-uri de producător,
 * câte unu-trei pe fiecare, iar site-urile n-au nimic în comun: unul e o
 * aplicație JavaScript, altul răspunde 403 la orice robot, două expiră la
 * prima cerere și merg la a doua, iar structura paginilor diferă complet.
 *
 * Un adaptor pentru fiecare ar fi mai mult cod decât produse. Iar partea grea
 * — să GĂSEȘTI pagina — o face mai bine o căutare, o dată, decât un crawler
 * scris pentru un site care se schimbă peste șase luni.
 *
 * Deci: adresa se află o dată și se scrie în fișier. Unealta face restul, și
 * face partea care chiar trebuie automatizată — verificarea și alegerea
 * imaginii corecte, unde greșelile sunt tăcute.
 *
 * ─── VERIFICAREA ─────────────────────────────────────────────────────────
 *
 * Chiar dacă adresa e scrisă de om, pagina se verifică: un jeton distinctiv
 * din codul nostru trebuie să apară în ea. Un „V15" scris greșit ca „V16" în
 * fișier ar duce altfel la fotografia altui acumulator, fără niciun semn.
 *
 * ─── ALEGEREA IMAGINII, ȘI GREȘEALA DE CARE FERIM ────────────────────────
 *
 * La Deye, regula „cea mai mare imagine de pe pagină" a ales de trei ori
 * același banner de marketing — o casă cu un telefon lângă — pentru trei
 * produse diferite. Greutatea nu deosebește un produs de un banner.
 *
 * Aici ordinea e alta:
 *
 *   1. `og:image`, dacă există. E imaginea pe care site-ul însuși o declară
 *      reprezentativă pentru pagină — cea mai bună dovadă disponibilă.
 *   2. altfel, dintre celelalte: se descarcă, se citesc dimensiunile din
 *      antet și se păstrează doar cele PĂTRATE-ish. Fotografiile de produs
 *      sunt pătrate fiindcă obiectul e decupat pe alb; bannerele sunt late
 *      fiindcă trebuie să încapă un titlu lângă imagine.
 *
 * Se sar iconițele, siglele și fișierele sub 8 KB — la 1000px, un fișier atât
 * de mic nu e o fotografie, e un element de interfață.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/* ══════════════════════════════════════════════════════════════════════════
   RANDARE CU CHROME, CA REZERVĂ
   ──────────────────────────────────────────────────────────────────────────
   Unele pagini n-au NICIO imagine în HTML-ul livrat. Pagina Pytes V15 are
   48 KB de HTML și zero referințe la fișiere imagine: galeria se construiește
   din JavaScript, după încărcare. Un `fetch` vede o pagină goală.

   Nu e un caz izolat — catalogul K2 e la fel. Deci: dacă din HTML nu iese
   niciun candidat, pagina se deschide într-un Chrome fără fereastră și se
   citesc adresele din DOM, după ce s-a randat.

   Chrome e deja pe calculatorul ăsta; se folosește prin protocolul lui de
   depanare, fără nicio bibliotecă instalată. Costă câteva secunde per pagină,
   de aceea e rezervă, nu regulă.
   ══════════════════════════════════════════════════════════════════════════ */

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((c) => fs.existsSync(c));

async function imaginiPrinChrome(url) {
  if (!CHROME) return [];
  const port = 9700 + Math.floor(Math.random() * 200);
  const chrome = spawn(CHROME, [
    `--remote-debugging-port=${port}`, '--headless=new', '--disable-gpu',
    '--no-first-run', '--no-default-browser-check', '--window-size=1400,2000',
    `--user-data-dir=${process.env.TEMP}/cdp-tinta-${port}`, 'about:blank',
  ], { stdio: 'ignore' });

  try {
    let ws;
    for (let i = 0; i < 60; i++) {
      try { ws = (await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()).webSocketDebuggerUrl; break; }
      catch { await asteapta(250); }
    }
    if (!ws) return [];

    const s = new WebSocket(ws);
    await new Promise((r) => (s.onopen = r));
    let id = 0; const asteptate = new Map();
    s.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && asteptate.has(m.id)) { asteptate.get(m.id)(m); asteptate.delete(m.id); } };
    const trimite = (metoda, p = {}, sesiune) => new Promise((res, rej) => {
      const n = ++id;
      asteptate.set(n, (m) => (m.error ? rej(new Error(m.error.message)) : res(m.result)));
      s.send(JSON.stringify({ id: n, method: metoda, params: p, sessionId: sesiune }));
    });

    const { targetId } = await trimite('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await trimite('Target.attachToTarget', { targetId, flatten: true });
    await trimite('Page.enable', {}, sessionId);
    await trimite('Runtime.enable', {}, sessionId);
    await trimite('Page.navigate', { url }, sessionId);
    await asteapta(6000);
    const r = await trimite('Runtime.evaluate', {
      expression: `JSON.stringify([...document.images].map(i => i.currentSrc || i.src).filter(Boolean))`,
      returnByValue: true,
    }, sessionId);
    s.close();
    return JSON.parse(r.result.value || '[]');
  } catch {
    return [];
  } finally {
    chrome.kill();
  }
}

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : d; };
const are = (n) => process.argv.includes(n);

const DIR = path.resolve(__dirname, arg('--dir', '../../poze-produse-pas5'));
const PAUZA = Number(arg('--pauza', '2000'));
const PROBA = are('--proba');
const FISIER_TINTE = path.join(__dirname, 'tinte-poze.json');

const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' };
const RAPORT_MAXIM = 1.45;
const MINIM_OCTETI = 8 * 1024;

const asteapta = (ms) => new Promise((r) => setTimeout(r, ms));

async function ia(url, binar = false) {
  const r = await fetch(url, { headers: UA, redirect: 'follow' });
  const corp = binar ? Buffer.from(await r.arrayBuffer()) : await r.text();
  await asteapta(PAUZA);
  if (!r.ok) throw new Error(`${r.status} ${url.slice(0, 60)}`);
  return { corp, tip: r.headers.get('content-type') || '' };
}

/** Dimensiunile din antetul fișierului, fără nicio bibliotecă. */
function dimensiuni(b) {
  if (b.length > 24 && b.toString('latin1', 1, 4) === 'PNG') return [b.readUInt32BE(16), b.readUInt32BE(20)];
  if (b.toString('latin1', 0, 4) === 'RIFF') {
    const t = b.toString('latin1', 12, 16);
    if (t === 'VP8X') return [1 + (b[24] | (b[25] << 8) | (b[26] << 16)), 1 + (b[27] | (b[28] << 8) | (b[29] << 16))];
    if (t === 'VP8L') { const n = b.readUInt32LE(21); return [(n & 0x3fff) + 1, ((n >> 14) & 0x3fff) + 1]; }
    if (t === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
    return null;
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length - 9) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  return null;
}

const patrataIsh = (d) => !d || (d[0] / d[1] <= RAPORT_MAXIM && d[1] / d[0] <= RAPORT_MAXIM);

/**
 * Jetonul după care se recunoaște produsul în pagină.
 *
 * PRIMA VARIANTĂ LUA CEL MAI LUNG JETON CU CIFRE, și era greșit: pentru
 * „PYTES-V15-14-34KWH" alegea „34KWH", care e o capacitate rotunjită de noi și
 * nu apare nicăieri pe site-ul producătorului. Verificarea respingea atunci
 * pagina corectă.
 *
 * Ce identifică de fapt un produs e CODUL DE MODEL — „V15", „V5A", „A450":
 * una-trei litere urmate de cifre. Alea se caută întâi. Cel mai lung jeton cu
 * cifre rămâne rezervă, pentru codurile care n-au forma asta.
 */
function jetonCheie(sku) {
  const jetoane = sku.split(/[^A-Za-z0-9.]+/).filter(Boolean);
  const model = jetoane.filter((x) => /^[A-Za-z]{1,3}\d+[A-Za-z]?$/.test(x)).sort((a, b) => b.length - a.length)[0];
  if (model) return model;
  return jetoane.filter((x) => /\d/.test(x)).sort((a, b) => b.length - a.length)[0] || sku;
}

const EXT = { 'image/webp': '.webp', 'image/jpeg': '.jpg', 'image/png': '.png' };

async function main() {
  if (!fs.existsSync(FISIER_TINTE)) {
    console.error(`Lipsește ${FISIER_TINTE}. Vezi comentariul din capul scriptului.`);
    process.exitCode = 1; return;
  }
  const tinte = JSON.parse(fs.readFileSync(FISIER_TINTE, 'utf8'));
  fs.mkdirSync(DIR, { recursive: true });
  const deja = new Set(fs.readdirSync(DIR).filter((f) => /\.(webp|jpe?g|png)$/i.test(f)).map((f) => f.replace(/\.\w+$/, '')));

  console.log(`${Object.keys(tinte).length} ținte · ${deja.size} deja luate${PROBA ? ' · MOD PROBĂ' : ''}\n`);
  let luate = 0, sarite = 0;

  for (const [sku, url] of Object.entries(tinte)) {
    if (deja.has(sku)) { sarite++; continue; }
    try {
      const { corp: html } = await ia(url);

      // Verificarea: pagina chiar e despre produsul nostru?
      const cheie = jetonCheie(sku);
      const gol = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

      // Se acceptă și potrivirea pe ADRESĂ, nu doar pe conținut. Pytes își
      // scrie modelul „V5°α" în pagină, cu grade și literă grecească, dar
      // „V5-Plus" în adresă — verificarea pe text singură respingea pagina
      // corectă. Adresa e oricum trecută prin ochi de om înainte să ajungă în
      // tinte-poze.json, deci e o dovadă la fel de bună.
      if (!gol(html).includes(gol(cheie)) && !gol(url).includes(gol(cheie))) {
        console.log(`  ?  ${sku.padEnd(34)} „${cheie}" nu apare nici în pagină, nici în adresă — sar`);
        continue;
      }

      // 1. og:image, dacă site-ul îl declară.
      const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i)
        || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);

      const candidati = og ? [new URL(og[1], url).href] : [];
      for (const m of html.matchAll(/(?:src|data-src|data-original)=["']([^"']+\.(?:jpg|jpeg|png|webp))["']/gi)) {
        // Se sar elementele de interfață. Filtrul pe nume nu ajunge: pe Pytes
        // meniul se cheamă „menu.png" și antetul „tcdl.png", nume care nu
        // conțin niciun cuvânt suspect. Ce le dă de gol e CALEA — grafica
        // șablonului stă sub /template/, conținutul sub /upload/ sau /public/.
        if (/\/template\/|\/static\/|\/assets\/|icon|logo|flag|sprite|placeholder|loading|banner/i.test(m[1])) continue;
        try { candidati.push(new URL(m[1], url).href); } catch { /* adresă stricată */ }
      }

      // Dacă HTML-ul livrat n-are nicio imagine, pagina se construiește din
      // JavaScript. Atunci o randăm. Vezi comentariul de la `imaginiPrinChrome`.
      if (!candidati.length) {
        const dinDom = await imaginiPrinChrome(url);
        for (const u of dinDom) {
          if (/\/template\/|\/static\/|\/assets\/|icon|logo|flag|sprite|placeholder|loading|banner|^data:/i.test(u)) continue;
          candidati.push(u);
        }
        if (candidati.length) console.log(`     (randat cu Chrome: ${candidati.length} imagini)`);
      }

      // 24, nu 8: pe o pagină cu 44 de imagini, primele opt sunt aproape sigur
      // grafica paginii, iar fotografia produsului vine după ea.
      let ales = null;
      for (const c of [...new Set(candidati)].slice(0, 24)) {
        try {
          const { corp: img, tip } = await ia(c, true);
          if (!tip.startsWith('image/') || img.length < MINIM_OCTETI) continue;
          const d = dimensiuni(img);
          if (!patrataIsh(d)) continue;
          if (!ales || img.length > ales.img.length) ales = { url: c, img, tip, d };
          if (og && c === candidati[0]) break;      // og:image e suficient
        } catch { /* sărim imaginea care nu răspunde */ }
      }

      if (!ales) { console.log(`  -  ${sku.padEnd(34)} nicio imagine potrivită`); continue; }

      const ext = EXT[ales.tip.split(';')[0]] || '.jpg';
      if (!PROBA) fs.writeFileSync(path.join(DIR, `${sku}${ext}`), ales.img);
      console.log(`  →  ${sku.padEnd(34)} ${ales.d ? ales.d.join('×').padEnd(11) : ''} ${Math.round(ales.img.length / 1024)}KB`);
      luate++;
    } catch (e) {
      console.log(`  !  ${sku.padEnd(34)} ${e.message}`);
    }
  }

  console.log(`\nluate ${luate} · sărite ${sarite}`);
  if (luate && !PROBA) console.log(`în ${DIR}\nrulează apoi: node optimizeaza-poze.js --dir ${path.relative(__dirname, DIR)}`);
}

main().catch((e) => { console.error(e.stack || e.message); process.exitCode = 1; });
