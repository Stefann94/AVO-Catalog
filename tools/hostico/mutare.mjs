#!/usr/bin/env node
/**
 * MUTAREA SITE-ULUI LA LOCUL LUI, prin FTP.
 *
 *   node tools/hostico/mutare.mjs --arata     ← doar listează, nu atinge nimic
 *   node tools/hostico/mutare.mjs --muta      ← golește public_html și mută
 *
 * ─── DE CE EXISTĂ ─────────────────────────────────────────────────────────
 *
 * Publicarea urcă site-ul în `/site-nou`, un folder alăturat, ca urcarea de
 * 45 de minute să nu lase site-ul jumătate vechi, jumătate nou. Trecerea la
 * noul site e apoi o mutare de fișiere — instantanee, fiindcă se face pe
 * același disc.
 *
 * Mutarea aceea se făcea de mână, din File Manager. Dar accesul la cPanel
 * intră în buclă la predarea sesiunii dinspre WHM, iar asta nu se repară de
 * aici. Fișierul ăsta face aceeași mutare prin FTP, care funcționează.
 *
 * FTP știe să REDENUMEASCĂ, iar o redenumire pe același disc nu copiază nimic:
 * schimbă doar unde e trecut fișierul. De-aceea toată operațiunea durează
 * secunde, nu zeci de minute.
 *
 * ─── OPRIRILE DE SIGURANȚĂ ────────────────────────────────────────────────
 *
 * Fișierul ȘTERGE lucruri, deci refuză să pornească dacă ceva nu e cum
 * trebuie. Fiecare oprire de mai jos are în spate o întrebare de forma „ce
 * s-ar întâmpla dacă m-aș înșela aici":
 *
 *   1. Cele două foldere sunt scrise în cod, nu primite din afară. Nimeni nu
 *      poate cere din greșeală ștergerea altui folder — nici măcar eu.
 *   2. Nu pornește dacă `/site-nou` n-are `index.html` ȘI `.htaccess`. Fără
 *      ele nu e un site construit, iar mutarea ar goli site-ul degeaba.
 *   3. Nu pornește dacă `/site-nou` are sub 10 intrări. O urcare întreruptă
 *      lasă un folder aproape gol; mutându-l, am înlocui site-ul cu nimic.
 *   4. `--arata` e modul implicit. Ștergerea cere `--muta`, scris anume.
 *
 * WordPress-ul stă în `/wordpress` și nu e atins de niciuna dintre operațiuni.
 */

import { Client } from "basic-ftp";

const SURSA = "/site-nou";
const TINTA = "/public_html";

/**
 * Unde ajunge ce era înainte în `public_html`.
 *
 * ─── DE CE NU SE ȘTERGE ───────────────────────────────────────────────────
 *
 * Prima variantă ștergea. Listarea de dinainte de mutare a arătat de ce era
 * greșit: în `public_html` erau și `!-Backup`, un folder despre care nu știm
 * ce conține, și `.well-known`, folosit la validarea certificatelor SSL.
 *
 * Nu aveam niciun motiv să riscăm. O mutare pe același disc costă la fel de
 * puțin ca o ștergere — amândouă schimbă doar unde e trecut fișierul — dar se
 * poate desface.
 *
 * Folderul rămâne până când cineva se uită în el și decide. Nu e treaba unui
 * script automat să hotărască ce se pierde.
 */
const ARHIVA = "/public_html-vechi";

/**
 * Singurele fișiere care chiar se șterg: jurnalele de erori.
 *
 * `error_log` avea 3,1 GB la listare. E un jurnal de diagnostic scris de
 * WordPress, nu face parte din site, și ocupă o șesime din spațiul contului.
 * Mutat, ar fi rămas să-l ocupe în continuare.
 */
const DE_STERS = /^error_log/;

const MUTA = process.argv.includes("--muta");

const kb = (n) => (n > 1024 * 1024 ? `${(n / 1048576).toFixed(1)} MB` : `${(n / 1024).toFixed(0)} KB`);

const client = new Client(60_000);
client.ftp.verbose = false;

try {
  await client.access({
    host: process.env.FTP_SERVER,
    user: process.env.FTP_USER,
    password: process.env.FTP_PAROLA,
    secure: false,
  });
  console.log(`Conectat la ${process.env.FTP_SERVER}\n`);

  const sursa = await client.list(SURSA);
  const tinta = await client.list(TINTA);

  const nume = (l) => l.map((x) => x.name);
  const arata = (titlu, lista) => {
    console.log(`── ${titlu} (${lista.length} intrări)`);
    for (const x of lista.slice(0, 40)) {
      console.log(`   ${x.isDirectory ? "[dir] " : "      "}${x.name.padEnd(34)} ${x.isDirectory ? "" : kb(x.size)}`);
    }
    if (lista.length > 40) console.log(`   … și încă ${lista.length - 40}`);
    console.log();
  };

  arata(`${SURSA} — site-ul nou, de mutat`, sursa);
  arata(`${TINTA} — ce se pune deoparte în ${ARHIVA}`, tinta);

  const jurnale = tinta.filter((x) => !x.isDirectory && DE_STERS.test(x.name));
  if (jurnale.length) {
    console.log(`── Singurele care se ȘTERG (jurnale de erori, ${jurnale.length}):`);
    for (const x of jurnale) console.log(`   ${x.name.padEnd(34)} ${kb(x.size)}`);
    console.log();
  }

  /* ── Opririle de siguranță ─────────────────────────────────────────── */
  const numeSursa = nume(sursa);
  if (!numeSursa.includes("index.html") || !numeSursa.includes(".htaccess")) {
    console.error("OPRIT: în /site-nou lipsește index.html sau .htaccess. Nu pare un site construit.");
    process.exit(1);
  }
  if (sursa.length < 10) {
    console.error(`OPRIT: /site-nou are doar ${sursa.length} intrări. Urcarea pare neterminată.`);
    process.exit(1);
  }

  if (!MUTA) {
    console.log("Doar am arătat. Nimic nu s-a schimbat.");
    console.log("Pentru mutarea adevărată: --muta");
    process.exit(0);
  }

  /* ── 1. Se eliberează ținta ────────────────────────────────────────── */
  console.log(`Pregătesc ${ARHIVA}…`);
  await client.ensureDir(ARHIVA);
  await client.cd("/");

  console.log(`\nEliberez ${TINTA}…`);
  let mutate = 0;
  let sterse = 0;
  for (const x of tinta) {
    if (!x.isDirectory && DE_STERS.test(x.name)) {
      await client.remove(`${TINTA}/${x.name}`);
      sterse++;
      console.log(`   ȘTERS  ${x.name}  (jurnal de erori)`);
      continue;
    }
    await client.rename(`${TINTA}/${x.name}`, `${ARHIVA}/${x.name}`);
    mutate++;
    console.log(`   pus deoparte  ${x.name}`);
  }
  console.log(`   ${mutate} puse în ${ARHIVA}, ${sterse} jurnale șterse.`);

  /* ── 2. Se mută ────────────────────────────────────────────────────── */
  console.log(`\nMut ${SURSA} → ${TINTA}…`);
  for (const x of sursa) {
    await client.rename(`${SURSA}/${x.name}`, `${TINTA}/${x.name}`);
    console.log(`   mutat ${x.name}`);
  }

  const dupa = await client.list(TINTA);
  console.log(`\nGata. ${TINTA} are acum ${dupa.length} intrări.`);
} finally {
  client.close();
}
