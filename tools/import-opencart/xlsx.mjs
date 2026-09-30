/**
 * CITITOR DE .xlsx, FĂRĂ DEPENDENȚE
 * ═════════════════════════════════════════════════════════════════════════
 * Un .xlsx e o arhivă ZIP cu XML înăuntru. Nodul are deja dezarhivarea
 * (zlib.inflateRawSync), deci un cititor care ne trebuie doar la citit se
 * scrie în o sută de linii, în loc să aducem o bibliotecă de câteva sute de
 * kilobytes într-un proiect care n-o folosește nicăieri altundeva.
 *
 * Stă separat fiindcă îl folosesc două unelte: din-xlsx.mjs (exportul
 * OpenCart) și unifica.mjs (fișierul de labeluri). Importat din scriptul
 * celeilalte, s-ar fi executat și conversia ei.
 * ═════════════════════════════════════════════════════════════════════════
 */

import { readFileSync } from "node:fs";
import { inflateRawSync } from "node:zlib";

/** Fișierele dintr-o arhivă ZIP, ca Map(cale → Buffer). */
function desfaZip(buf) {
  // Sfârșitul directorului central, căutat de la coadă: comentariul arhivei
  // are lungime variabilă, deci semnătura nu e la un offset fix.
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 65558; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd === -1) throw new Error("nu pare arhivă ZIP: lipsește sfârșitul directorului central");

  const nrIntrari = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const fisiere = new Map();

  for (let i = 0; i < nrIntrari; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const metoda = buf.readUInt16LE(p + 10);
    const dimComprimata = buf.readUInt32LE(p + 20);
    const lungNume = buf.readUInt16LE(p + 28);
    const lungExtra = buf.readUInt16LE(p + 30);
    const lungComentariu = buf.readUInt16LE(p + 32);
    const offsetLocal = buf.readUInt32LE(p + 42);
    const nume = buf.toString("utf8", p + 46, p + 46 + lungNume);

    // Antetul local are propriile lungimi pentru nume și extra; ale lui
    // contează, nu cele din directorul central — pot diferi.
    const lnNume = buf.readUInt16LE(offsetLocal + 26);
    const lnExtra = buf.readUInt16LE(offsetLocal + 28);
    const inceput = offsetLocal + 30 + lnNume + lnExtra;
    const brut = buf.subarray(inceput, inceput + dimComprimata);
    fisiere.set(nume, metoda === 8 ? inflateRawSync(brut) : Buffer.from(brut));

    p += 46 + lungNume + lungExtra + lungComentariu;
  }
  return fisiere;
}

/* ══════════════════════ XLSX ══════════════════════ */

const dez = (s) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, "&");

const coloanaDinRef = (ref) => {
  let n = 0;
  for (const c of ref.replace(/\d+/g, "")) n = n * 26 + (c.charCodeAt(0) - 64);
  return n - 1;
};

/** Un registru .xlsx, ca Map(numeFoaie → tablou de obiecte după antet).
 *  Exportată: unifica.mjs citește cu ea fișierul de labeluri. */
export function citesteRegistru(cale) {
  const z = desfaZip(readFileSync(cale));
  const text = (n) => (z.has(n) ? z.get(n).toString("utf8") : null);

  const siruri = [];
  const ss = text("xl/sharedStrings.xml");
  if (ss) {
    for (const m of ss.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
      let t = "";
      for (const r of m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)) t += r[1];
      siruri.push(dez(t));
    }
  }

  const rels = text("xl/_rels/workbook.xml.rels") ?? "";
  const tinte = new Map();
  for (const m of rels.matchAll(/<Relationship [^>]*>/g)) {
    const id = /Id="([^"]+)"/.exec(m[0])?.[1];
    const t = /Target="([^"]+)"/.exec(m[0])?.[1];
    if (id && t) tinte.set(id, t.replace(/^\/?xl\//, ""));
  }

  const wb = text("xl/workbook.xml") ?? "";
  const foi = new Map();
  for (const m of wb.matchAll(/<sheet [^>]*name="([^"]*)"[^>]*r:id="([^"]+)"/g)) {
    const cale = tinte.get(m[2]);
    if (!cale) continue;
    const xml = text("xl/" + cale);
    if (!xml) continue;

    const randuri = [];
    for (const r of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
      const cel = [];
      for (const c of r[1].matchAll(/<c ([^>]*?)\/>|<c ([^>]*?)>([\s\S]*?)<\/c>/g)) {
        const atr = c[1] ?? c[2];
        const corp = c[3] ?? "";
        const ref = /r="([A-Z]+\d+)"/.exec(atr)?.[1];
        const tip = /t="([^"]+)"/.exec(atr)?.[1];
        let v = "";
        if (tip === "inlineStr") {
          for (const t of corp.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)) v += dez(t[1]);
        } else {
          const vv = /<v>([\s\S]*?)<\/v>/.exec(corp)?.[1] ?? "";
          v = tip === "s" ? (siruri[+vv] ?? "") : dez(vv);
        }
        cel[ref ? coloanaDinRef(ref) : cel.length] = v;
      }
      randuri.push(Array.from(cel, (v) => v ?? ""));
    }
    const cap = randuri[0] ?? [];
    foi.set(
      dez(m[1]),
      randuri.slice(1).map((r) => Object.fromEntries(cap.map((k, i) => [k, r[i] ?? ""]))),
    );
  }
  return foi;
}
