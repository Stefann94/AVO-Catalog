#!/usr/bin/env node
/**
 * Siglele brandurilor: PNG → WebP, la înălțimea la care sunt afișate.
 *
 *   node tools/imagini/optimizeaza-sigle.mjs
 *
 * Citește public/branduri/**.png și scrie alături <slug>.webp. PNG-urile
 * rămân ca surse; site-ul folosește doar WebP-urile.
 *
 * ÎNĂLȚIMILE, după cea mai mare afișare × 2 (ecrane retina):
 *   albe  (public/branduri) ......... 48px — banda de sub hero le arată la
 *                                      24px, HeroCatalog la 14–20px
 *   color (public/branduri/color) ... 80px — fișa de produs le arată la 40px
 *
 * Calitate 90 cu alfa întreg: la siglele color, PNG-ul fără pierderi ducea
 * degradeuri și umbre la 25–77 KB bucata (Eastron 77 KB). WebP la 90 nu se
 * distinge la mărimea afișată și coboară lotul de la 581 KB la ~190 KB.
 *
 * `sharp` vine cu Next.js, deci nu se instalează nimic în plus.
 */

import sharp from "sharp";
import { readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const radacina = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "public", "branduri");
const SETURI = [
  { dir: radacina, inaltime: 48 },
  { dir: join(radacina, "color"), inaltime: 80 },
];

let inainte = 0, dupa = 0;
for (const { dir, inaltime } of SETURI) {
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".png"))) {
    const sursa = join(dir, f);
    const tinta = sursa.replace(/\.png$/, ".webp");
    const info = await sharp(sursa)
      .resize({ height: inaltime, withoutEnlargement: true })
      .webp({ quality: 90, alphaQuality: 100, effort: 6 })
      .toFile(tinta);
    inainte += statSync(sursa).size;
    dupa += info.size;
  }
}
console.log(`sigle: ${Math.round(inainte / 1024)} KB PNG → ${Math.round(dupa / 1024)} KB WebP`);
