#!/usr/bin/env node
/**
 * Aduce fotografiile de produs la o formă unitară, înainte de urcare.
 *
 *   node optimizeaza-poze.js --dir ../../poze-produse-pas4
 *
 * Scrie PESTE fișierele din director, după ce salvează originalele în
 * `<director>/originale/`. Nimic nu se pierde.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * DE CE E NEVOIE
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Fotografiile vin din surse cu standarde foarte diferite:
 *
 *   solarone.ro ...... 700–1000px, 4–11 KB   deja potrivite
 *   deyeinverter.com . 6000px, până la 8 MB  de o mie de ori mai grele
 *
 * Un fișier de 8 MB nu e „o poză mai bună". E aceeași poză, pe care browserul
 * o va reduce oricum la ~300px în card, dar pe care serverul o cară întreagă
 * de fiecare dată când WordPress îi generează miniaturile — cinci-șase
 * reprocesări ale unei imagini de 6000px, la fiecare încărcare.
 *
 * ─── CE FACE, ȘI DE CE ATÂT ──────────────────────────────────────────────
 *
 *   LATURA MAXIMĂ 1000px. E dimensiunea la care ajunseseră deja fotografiile
 *   de pe solarone, deci setul rămâne omogen. Cardurile de categorie afișează
 *   ~300px, fișa de produs ~600px pe ecran obișnuit și ~1200 pe ecran retina;
 *   1000px acoperă tot ce cere `sizes` din componente, cu o marjă.
 *
 *   NU SE MĂREȘTE NIMIC (`withoutEnlargement`). O poză de 700px rămâne 700px:
 *   mărirea n-ar adăuga detaliu, doar octeți.
 *
 *   WEBP, CALITATE 82. Formatul e ales pentru că e singurul pe care îl acceptă
 *   și WordPress, și toate browserele relevante, și pentru că `next/image` îl
 *   reoptimizează oricum în AVIF pentru cine îl suportă. 82 e pragul peste care
 *   diferența nu se mai vede pe un obiect decupat pe alb, iar sub el apar
 *   halouri în jurul muchiilor drepte — și catalogul ăsta e plin de muchii
 *   drepte: șine, dulapuri, invertoare.
 *
 *   FUNDAL ALB LA TRANSPARENȚĂ. PNG-urile Deye au fundal transparent. Lăsat
 *   așa, în WebP, produsul ar apărea pe orice culoare are cardul dedesubt —
 *   inclusiv pe gri, unde un obiect gri dispare. Se compune pe alb, ca restul
 *   setului.
 *
 * ─── CE NU FACE ──────────────────────────────────────────────────────────
 *
 * Nu decupează, nu rotește, nu „îmbunătățește". O fotografie de produs e o
 * dovadă tehnică; orice transformare care schimbă ce se vede e o minciună
 * mică. Se schimbă doar cât cântărește.
 *
 * ─── OPȚIUNI ─────────────────────────────────────────────────────────────
 *
 *   --dir <cale>      directorul de prelucrat (obligatoriu)
 *   --latura <px>     latura maximă (implicit 1000)
 *   --calitate <n>    calitatea WebP (implicit 82)
 *   --proba           arată ce ar face, fără să scrie
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : d; };
const are = (n) => process.argv.includes(n);

const DIR = path.resolve(__dirname, arg('--dir', ''));
const LATURA = Number(arg('--latura', '1000'));
const CALITATE = Number(arg('--calitate', '82'));
const PROBA = are('--proba');

const kb = (n) => `${Math.round(n / 1024)}KB`;

async function main() {
  if (!arg('--dir', '')) {
    console.error('Lipsește --dir. Exemplu: node optimizeaza-poze.js --dir ../../poze-produse-pas4');
    process.exitCode = 1;
    return;
  }
  if (!fs.existsSync(DIR)) {
    console.error(`Directorul nu există: ${DIR}`);
    process.exitCode = 1;
    return;
  }

  const fisiere = fs.readdirSync(DIR).filter((f) => /\.(webp|jpe?g|png)$/i.test(f));
  if (!fisiere.length) { console.log('Niciun fișier de imagine.'); return; }

  const dirOriginale = path.join(DIR, 'originale');
  if (!PROBA) fs.mkdirSync(dirOriginale, { recursive: true });

  console.log(`${fisiere.length} fișiere în ${DIR}`);
  console.log(`latura maximă ${LATURA}px · WebP calitate ${CALITATE}${PROBA ? ' · MOD PROBĂ' : ''}\n`);

  let inainte = 0, dupa = 0, prelucrate = 0, sarite = 0;

  for (const f of fisiere) {
    const caleIn = path.join(DIR, f);
    const brut = fs.readFileSync(caleIn);
    inainte += brut.length;

    try {
      const meta = await sharp(brut).metadata();
      const iesire = await sharp(brut)
        .resize({
          width: LATURA,
          height: LATURA,
          fit: 'inside',
          withoutEnlargement: true,   // vezi comentariul din capul fișierului
        })
        // Transparența se compune pe alb, nu se păstrează.
        .flatten({ background: '#ffffff' })
        .webp({ quality: CALITATE })
        .toBuffer();

      // Dacă „optimizarea" ar face fișierul mai mare, nu e o optimizare.
      // Se întâmplă la cele deja mici de pe solarone, care sunt WebP de 5 KB.
      if (iesire.length >= brut.length && /\.webp$/i.test(f)) {
        dupa += brut.length;
        sarite++;
        console.log(`  =  ${f.padEnd(40)} ${kb(brut.length).padStart(7)}  ${meta.width}×${meta.height}  (deja optim)`);
        continue;
      }

      const numeNou = f.replace(/\.\w+$/, '.webp');
      if (!PROBA) {
        fs.renameSync(caleIn, path.join(dirOriginale, f));
        fs.writeFileSync(path.join(DIR, numeNou), iesire);
      }
      dupa += iesire.length;
      prelucrate++;

      const dimNoua = await sharp(iesire).metadata();
      const procent = Math.round((1 - iesire.length / brut.length) * 100);
      console.log(
        `  →  ${f.padEnd(40)} ${kb(brut.length).padStart(8)} → ${kb(iesire.length).padStart(7)}` +
        `  (−${procent}%)  ${meta.width}×${meta.height} → ${dimNoua.width}×${dimNoua.height}`,
      );
    } catch (e) {
      console.log(`  !  ${f.padEnd(40)} eroare: ${e.message}`);
      dupa += brut.length;
    }
  }

  console.log('');
  console.log(`prelucrate ${prelucrate} · lăsate ca atare ${sarite}`);
  console.log(`total: ${kb(inainte)} → ${kb(dupa)}  (−${Math.round((1 - dupa / inainte) * 100)}%)`);
  if (!PROBA && prelucrate) console.log(`originalele: ${dirOriginale}`);
}

main().catch((e) => { console.error(e.stack || e.message); process.exitCode = 1; });
