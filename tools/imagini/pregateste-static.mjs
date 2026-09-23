#!/usr/bin/env node
/**
 * POZELE, PREGĂTITE LA CONSTRUCȚIE — pasul care face site-ul static posibil.
 *
 *   node tools/imagini/pregateste-static.mjs [--out=out] [--paralel=8]
 *
 * ─── CE PROBLEMĂ REZOLVĂ ──────────────────────────────────────────────────
 *
 * `next/image` nu pune în pagină adresa fotografiei, ci o cerere către
 * optimizatorul lui Next:
 *
 *     /_next/image?url=https%3A%2F%2Fadmin...%2FX.webp&w=384&q=60
 *
 * Optimizatorul e un program care rulează pe server: primește cererea,
 * redimensionează fotografia, o convertește în AVIF și o trimite. Pe Vercel
 * există. Într-un site static NU există nimic care să răspundă — măsurat pe
 * prima construcție statică: 20.363 de adrese de poze, toate rupte.
 *
 * Fișierul ăsta face aceeași muncă, o singură dată, la construcție: citește
 * fiecare cerere din paginile deja generate, produce fișierul cerut și
 * înlocuiește adresa cu una adevărată.
 *
 * ─── DE CE DUPĂ CONSTRUCȚIE, ȘI NU PRINTR-UN `loader` ─────────────────────
 *
 * Next permite un `loader` propriu, care ar scrie de la bun început ce adresă
 * vrem. Ar fi părut mai curat, dar cade pe fotografiile importate în cod
 * (`import logo from "public/logo.png"`): numele lor final conține o amprentă
 * a conținutului, cunoscută abia DUPĂ construcție. Un loader n-are de unde s-o
 * știe, deci ar trebui ori să renunțăm la importuri — pierzând dimensiunile
 * citite automat —, ori să ghicim.
 *
 * Aici, după construcție, amprentele sunt scrise pe disc. Nu se atinge nicio
 * componentă, iar ce iese e exact ce ieșea și pe Vercel.
 *
 * ─── DE CE AVIF, ȘI DOAR AVIF ─────────────────────────────────────────────
 *
 * Un fișier pe disc are un singur format; nu putem servi AVIF unora și WebP
 * altora, cum face un server care citește `Accept`. AVIF e susținut de Chrome
 * 85+, Firefox 93+ și Safari 16.4+ — exact lista de browsere pentru care Next
 * construiește oricum (vezi documentația lui, „Supported Browsers"). Cine nu-l
 * susține nu poate rula site-ul nici așa.
 *
 * Calitatea urmează formula lui Next: AVIF cere un număr mai mic pentru
 * aceeași impresie vizuală decât JPEG, iar raportul folosit acolo e 50/80.
 * Deci `q=60` din pagină devine 38 în fișier. Nu e o alegere proprie: e
 * păstrarea a ceea ce vedeai deja pe Vercel.
 *
 * ─── DE CE NU SE MĂREȘTE NICIODATĂ O FOTOGRAFIE ───────────────────────────
 *
 * Pagina cere sigla și la 3840px, deși fișierul are 1490. Next nu mărește
 * niciodată — trimite originalul. Aici la fel, și de-aici vine o economie
 * mare: cele cinci cereri de peste 1490 devin UN singur fișier. Din 3646 de
 * variante cerute rămân mult mai puține de produs.
 */

import { readFile, writeFile, mkdir, readdir, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, extname, dirname } from "node:path";
import sharp from "sharp";

const optiune = (nume, implicit) => {
  const g = process.argv.find((a) => a.startsWith(`--${nume}=`));
  return g ? g.slice(nume.length + 3) : implicit;
};

const DIR_OUT = optiune("out", "out");
const PARALEL = Number(optiune("paralel", 8));
/** Unde ajung fotografiile produse. Scurt, fiindcă adresa se repetă de mii de ori. */
const DIR_POZE = "i";
/** Fișierele în care apar adresele: pagini și încărcăturile de navigare. */
const EXTENSII_TEXT = new Set([".html", ".txt", ".rsc", ".json", ".xml"]);

/** Formula lui Next pentru AVIF: `q` din pagină nu e `q` din fișier. */
const calitateAvif = (q) => Math.round(q * (50 / 80));

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

/** Toate fișierele dintr-un director, recursiv. */
async function fisiere(dir) {
  const gasite = [];
  for (const intrare of await readdir(dir, { withFileTypes: true })) {
    const cale = join(dir, intrare.name);
    if (intrare.isDirectory()) gasite.push(...(await fisiere(cale)));
    else gasite.push(cale);
  }
  return gasite;
}

/**
 * Sursa unei cereri, ca octeți.
 *
 * Adresele locale sunt fișiere deja copiate în `out`. Cele de pe WordPress se
 * descarcă o dată și se țin în memorie: aceeași fotografie e cerută la 6–9
 * lățimi, iar fără asta ar fi descărcată de tot atâtea ori.
 */
const descarcate = new Map();
const asteapta = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Reîncercările nu sunt precauție teoretică.
 *
 * WordPress-ul stă pe găzduire partajată și cedează la sarcină: o construcție
 * cere câteva sute de fotografii în câteva secunde, iar una-două pică. Prima
 * rulare a fișierului ăstuia a eșuat exact așa — un singur `fetch failed` din
 * 3646 de cereri — și a oprit tot, pe bună dreptate.
 *
 * Patru încercări, cu pauze crescătoare: 0,3 s, 0,9 s, 2,7 s. Aceeași rețetă
 * ca în lib/graphql-client.ts, din același motiv.
 */
async function descarca(url) {
  let ultima;
  for (let i = 0; i < 4; i++) {
    if (i) await asteapta(0.3 * 3 ** (i - 1) * 1000);
    try {
      const raspuns = await fetch(url);
      if (!raspuns.ok) throw new Error(`răspuns ${raspuns.status}`);
      return Buffer.from(await raspuns.arrayBuffer());
    } catch (e) {
      ultima = e;
    }
  }
  throw ultima;
}

async function sursa(url) {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    /* Se ține PROMISIUNEA, nu rezultatul. Opt lucrători cer în paralel aceeași
       fotografie la opt lățimi; cu rezultatul, toți opt ar găsi harta goală
       înainte ca primul să termine și ar descărca-o de opt ori — exact
       sarcina care face WordPress-ul să cedeze. Așa, ceilalți șapte așteaptă
       aceeași descărcare. */
    if (!descarcate.has(url)) descarcate.set(url, descarca(url));
    return descarcate.get(url);
  }
  return readFile(join(DIR_OUT, decodeURIComponent(url).replace(/^\//, "")));
}

async function main() {
  const toate = await fisiere(DIR_OUT);
  const text = toate.filter((f) => EXTENSII_TEXT.has(extname(f)));

  /* ── 1. Se adună cererile ──────────────────────────────────────────────
     Aceeași adresă apare în pagină cu `&amp;` și în încărcătura de navigare
     cu `&`. Se caută amândouă formele, dar se reține una singură: ce contează
     e perechea (fotografie, lățime, calitate). */
  const tipar = /\/_next\/image\?url=([^"'\s&\\]+)(?:&|&amp;)w=(\d+)(?:&|&amp;)q=(\d+)/g;
  const cereri = new Map();

  for (const f of text) {
    const continut = await readFile(f, "utf8");
    for (const [, urlCodat, w, q] of continut.matchAll(tipar)) {
      const cheie = `${urlCodat}|${w}|${q}`;
      if (!cereri.has(cheie)) {
        cereri.set(cheie, { url: decodeURIComponent(urlCodat), latime: Number(w), calitate: Number(q) });
      }
    }
  }

  console.log(`${cereri.size} variante cerute, în ${text.length} fișiere.`);
  if (cereri.size === 0) return;

  /* ── 2. Se produc fotografiile ─────────────────────────────────────────
     Numele iese dintr-o amprentă a (fotografie, lățime reală, calitate).
     „Lățime REALĂ" e cheia economiei: o cerere de 3840 pe un fișier de 1490
     produce același rezultat ca una de 2048, deci amândouă primesc același
     nume și fișierul se scrie o dată. */
  await mkdir(join(DIR_OUT, DIR_POZE), { recursive: true });

  const inlocuiri = new Map();
  const scrise = new Set();
  let octetiIesire = 0;
  const esecuri = [];

  const lista = [...cereri.entries()];
  let urmator = 0;

  async function lucreaza() {
    while (urmator < lista.length) {
      const [cheie, { url, latime, calitate }] = lista[urmator++];
      try {
        const octeti = await sursa(url);
        const imagine = sharp(octeti, { animated: false });
        const { width: latimeSursa } = await imagine.metadata();

        const latimeReala = Math.min(latime, latimeSursa ?? latime);
        const amprenta = createHash("sha1")
          .update(`${url}|${latimeReala}|${calitate}`)
          .digest("hex")
          .slice(0, 12);
        const numeFisier = `${amprenta}.avif`;
        const caleNoua = `/${DIR_POZE}/${numeFisier}`;

        if (!scrise.has(numeFisier)) {
          scrise.add(numeFisier);
          const produs = await imagine
            .resize({ width: latimeReala, withoutEnlargement: true })
            .avif({ quality: calitateAvif(calitate), effort: 4 })
            .toBuffer();
          await writeFile(join(DIR_OUT, DIR_POZE, numeFisier), produs);
          octetiIesire += produs.length;
        }

        inlocuiri.set(cheie, caleNoua);
      } catch (e) {
        esecuri.push(`${url} @${latime}: ${e.message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: PARALEL }, lucreaza));

  console.log(`${scrise.size} fișiere scrise (${kb(octetiIesire)}), din ${cereri.size} cereri.`);
  if (esecuri.length) {
    console.error(`\n${esecuri.length} EȘECURI:`);
    for (const e of esecuri.slice(0, 20)) console.error("  " + e);
    /* Un eșec înseamnă o fotografie care lipsește din site. Mai bine se oprește
       construcția decât să publicăm pagini cu poze rupte — exact greșeala pe
       care o face și clientul GraphQL când înghite o eroare. */
    process.exit(1);
  }

  /* ── 3. Se rescriu adresele ────────────────────────────────────────────
     În pagină cu `&amp;`, în încărcătura de navigare cu `&`. Ambele forme
     duc la același fișier. */
  let fisiereAtinse = 0;
  let inlocuiriFacute = 0;

  for (const f of text) {
    const continut = await readFile(f, "utf8");
    let nou = continut;

    nou = nou.replace(tipar, (potrivire, urlCodat, w, q) => {
      const cale = inlocuiri.get(`${urlCodat}|${w}|${q}`);
      if (!cale) return potrivire;
      inlocuiriFacute++;
      return cale;
    });

    if (nou !== continut) {
      await writeFile(f, nou);
      fisiereAtinse++;
    }
  }

  console.log(`${inlocuiriFacute} adrese rescrise, în ${fisiereAtinse} fișiere.`);

  const ramase = [];
  for (const f of text) {
    if ((await readFile(f, "utf8")).includes("/_next/image?url=")) ramase.push(f);
  }
  if (ramase.length) {
    console.error(`\nAu rămas adrese nerezolvate în ${ramase.length} fișiere, de ex. ${ramase[0]}`);
    process.exit(1);
  }
  console.log("Nicio adresă de optimizator nu a rămas în site.");
}

await main();
