#!/usr/bin/env node
/**
 * Serverul care imită Hostico, pentru verificarea site-ului static.
 *
 *   node tools/static/serveste.mjs [--out=out] [--port=3300]
 *
 * ─── DE CE NU E DE AJUNS ORICE SERVER DE FIȘIERE ──────────────────────────
 *
 * Construcția statică scrie paginile ca fișiere cu extensie:
 *
 *     out/catalog/produs/ul-590m-144adgn.html
 *
 * dar adresa pe care o cere browserul n-are extensie:
 *
 *     /catalog/produs/ul-590m-144adgn
 *
 * Un server obișnuit răspunde 404. Apache-ul de pe Hostico va face legătura
 * printr-o regulă din `.htaccess`, iar fișierul ăsta aplică EXACT aceleași
 * reguli, în aceeași ordine. Altfel verificarea de aici n-ar spune nimic
 * despre ce se întâmplă acolo.
 *
 * ─── CAPCANA CARE FACE ORDINEA IMPORTANTĂ ─────────────────────────────────
 *
 * Lângă fiecare pagină există și un DIRECTOR cu același nume, în care Next
 * ține încărcăturile pentru navigarea din browser:
 *
 *     out/catalog/produs/ul-590m-144adgn.html      ← pagina
 *     out/catalog/produs/ul-590m-144adgn/          ← date de navigare
 *
 * Un server care caută întâi directoare ar găsi directorul și ar răspunde cu
 * o listă de fișiere sau cu 403 — niciodată cu pagina. De aceea regula „există
 * <cale>.html?" se verifică ÎNAINTEA oricărei tratări de director, și aici, și
 * în `.htaccess`.
 */

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
import { gzipSync } from "node:zlib";

const optiune = (nume, implicit) => {
  const g = process.argv.find((a) => a.startsWith(`--${nume}=`));
  return g ? g.slice(nume.length + 3) : implicit;
};

const DIR = optiune("out", "out");
const PORT = Number(optiune("port", 3300));

const TIPURI = {
  ".html": "text/html; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".rsc": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".avif": "image/avif",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".jfif": "image/jpeg",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

/** Ce se comprimă. Fotografiile și fonturile sunt deja comprimate; a doua
    trecere le-ar face mai mari și ar consuma timp degeaba. */
const COMPRIMABILE = new Set([".html", ".css", ".js", ".json", ".xml", ".txt", ".rsc", ".svg"]);

const fisier = async (cale) => {
  try {
    return (await stat(cale)).isFile() ? cale : null;
  } catch {
    return null;
  }
};

createServer(async (cerere, raspuns) => {
  const adresa = new URL(cerere.url, "http://localhost");
  /* `normalize` oprește `../`: fără el, o cerere meșterită ar citi fișiere de
     oriunde de pe disc. Apache face același lucru de la sine. */
  const cale = normalize(decodeURIComponent(adresa.pathname)).replace(/^([/\\])+/, "");

  /* Ordinea e cea din `.htaccess`. Nu există candidat „de rezervă": o adresă
     care nu se potrivește cu niciunul TREBUIE să dea 404. Aici a fost o
     greșeală — `index.html` era ultimul din listă, deci orice adresă
     inexistentă răspundea 200 cu prima pagină. Un 404 fals e mai rău decât
     lipsa paginii: Google indexează adrese inventate și le arată oamenilor. */
  const ordine =
    cale === ""
      ? [join(DIR, "index.html")]
      : [
          join(DIR, cale),               // fișier exact: /i/abc.avif
          join(DIR, `${cale}.html`),     // pagină fără extensie: /contact → contact.html
          join(DIR, cale, "index.html"), // director cu index
        ];

  for (const c of ordine) {
    const gasit = await fisier(c);
    if (!gasit) continue;
    const tip = TIPURI[extname(gasit)] ?? "application/octet-stream";
    const continut = await readFile(gasit);

    /* ── COMPRIMAREA NU E UN AMĂNUNT ──────────────────────────────────────
       Fără ea, o măsurătoare făcută aici minte. Verificat pe propria piele:
       o comparație între două versiuni a dat 67 față de 97 puncte — dar
       versiunea cu mult JavaScript trimitea 493 KB necomprimați, în loc de
       154 KB cât ar trimite orice server adevărat. Diferența măsurată era în
       bună parte lipsa comprimării, nu diferența dintre tehnologii.

       Hostico comprimă prin `mod_deflate`, declarat în public/.htaccess.
       Serverul ăsta trebuie să facă la fel, altfel nu mai imită nimic. */
    const comprimabil = COMPRIMABILE.has(extname(gasit));
    const acceptaGzip = String(cerere.headers["accept-encoding"] ?? "").includes("gzip");

    if (comprimabil && acceptaGzip) {
      const mic = gzipSync(continut, { level: 6 });
      raspuns.writeHead(200, {
        "content-type": tip,
        "content-encoding": "gzip",
        "cache-control": "no-store",
        vary: "accept-encoding",
      });
      raspuns.end(mic);
      return;
    }

    raspuns.writeHead(200, { "content-type": tip, "cache-control": "no-store" });
    raspuns.end(continut);
    return;
  }

  const patruSuteCinci = await fisier(join(DIR, "404.html"));
  raspuns.writeHead(404, { "content-type": "text/html; charset=utf-8" });
  raspuns.end(patruSuteCinci ? await readFile(patruSuteCinci) : "404");
}).listen(PORT, () => console.log(`Site static pe http://localhost:${PORT} (din ${DIR}/)`));
