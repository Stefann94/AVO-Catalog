/**
 * FOTOGRAFIE DE PRODUS FĂRĂ FUNDAL
 * ═════════════════════════════════════════════════════════════════════════
 * Scoate albul din jurul produsului și scrie un PNG cu transparență în
 * `public/produse-png/`. E pentru hero, unde fotografiile stau pe albastru
 * închis: un WebP opac pe alb se vedea acolo ca o cutie albă în jurul
 * produsului.
 *
 * ─── PRAGUL E 254, ȘI CIFRA E MĂSURATĂ ───────────────────────────────────
 *
 * Prima versiune socotea fundal orice pixel peste 244. A mâncat produsele: la
 * brida de montaj (2003274), placa albă a ieșit ferfeniță, fiindcă e la fel de
 * albă ca pagina din jur.
 *
 * Histograma spune unde e granița. Pe brida aia, din 1.000.000 de pixeli:
 *
 *     255 ....... 955.541      <- fundalul, alb pur
 *     254 ......... 2.091      <- inelul de anti-aliasing din jurul lui
 *     253 ........... 877
 *     251 ........... 356      <- de aici in jos e produsul
 *
 * Fundalul catalogului nu e „aproape alb", e alb curat. Între el și cel mai
 * deschis pixel de produs e o prăpastie de trei sute de ori. Pragul stă în
 * prăpastie: 254 în sus e fundal, 253 în jos e produs.
 *
 * ─── UMPLERE DE LA MARGINE, NU „TOT CE E ALB" ────────────────────────────
 *
 * Se pornește DIN MARGINILE imaginii și se înaintează doar prin vecini la fel
 * de albi. Albul dinăuntrul produsului — o etichetă, un panou de comandă — nu
 * e legat de margine, deci rămâne. Contează și cu prag strâns: eticheta albă
 * de pe un acumulator Deye e 255 curat, exact ca fundalul.
 *
 * ─── MARGINEA: ALFA CALCULATĂ, NU O MASCĂ ÎNMUIATĂ ───────────────────────
 *
 * O mască de 0 și 1, oricât ai media-o după aceea, lasă conturul zimțat — se
 * vedea. Dar zimții nu trebuie inventați prin mediere: informația există deja
 * în fotografie. Pixelii de pe muchie sunt un AMESTEC real de produs și alb,
 * iar amestecul se poate desface:
 *
 *     ce se vede = a * produs + (1 - a) * alb
 *     deci   a = (255 - ce se vede) / (255 - produs)
 *
 * Culoarea produsului se ia de la cel mai apropiat pixel sigur de produs. Așa
 * fiecare pixel de contur primește acoperirea LUI, citită din date, nu o medie
 * a vecinilor. Conturul iese exact atât de moale cât e în fotografie.
 *
 * CÂND PRODUSUL E APROAPE ALB, socoteala se oprește. Dacă numitorul scade sub
 * `MIN_CONTRAST`, produsul nu se poate deosebi de fundal la nivel de pixel, iar
 * o împărțire la aproape zero ar da alfa aiurea. Acolo pixelul rămâne opac:
 * greșeala se face în favoarea păstrării produsului, nu a găuririi lui.
 *
 * ─── ALBUL SE SCOATE ȘI DIN CULOARE ──────────────────────────────────────
 *
 * Un pixel de contur e „produs peste alb". Lăsat așa, pe fond închis conturul
 * capătă o aură albicioasă — cel mai vizibil defect cu putință acolo. Se
 * recuperează culoarea curată: c = (c_vazut - 255*(1-a)) / a.
 *
 * ─── NU ATINGE NIMIC DIN WORDPRESS ───────────────────────────────────────
 *
 * Citește fotografia prin HTTP și scrie un fișier nou în `public/`. Biblioteca
 * media rămâne exact cum e; dacă fișierul local lipsește, hero-ul se întoarce
 * singur la fotografia din WordPress (vezi poze-fara-fundal.ts).
 *
 * ─── FOLOSIRE ────────────────────────────────────────────────────────────
 *
 *   node tools/imagini/fara-fundal.mjs <slug> <url> [<slug> <url> ...]
 *
 * Rescrie fișierele existente. Rulează manual, nu la fiecare build: sunt
 * câteva fotografii, iar rezultatul se verifică cu ochiul.
 * ═════════════════════════════════════════════════════════════════════════
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/** De la cât în sus un pixel e fundal. Vezi histograma din capul fișierului. */
const PRAG_FUNDAL = 254;
/** Cât de neutru trebuie să fie: diferența dintre canalul cel mai mare și cel mai mic. */
const PRAG_NEUTRU = 3;
/** Sub atâta alfa, un pixel se socotește deja transparent în fișierul sursă. */
const PRAG_ALFA = 8;
/** Lățimea benzii de contur în care se calculează alfa, în pixeli. */
const BANDA = 2;
/** Cât de departe se caută culoarea produsului pentru un pixel de contur. */
const RAZA_CULOARE = 4;
/** Sub atâta contrast față de alb, produsul nu se poate deosebi de fundal. */
const MIN_CONTRAST = 14;
/** Latura maximă a PNG-ului scris. Hero-ul arată cel mult 300px, deci 2x e destul. */
const LATURA_MAX = 640;

const IESIRE = "public/produse-png";
const VECINI = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

async function decupeaza(url, slug) {
  const raspuns = await fetch(url);
  if (!raspuns.ok) throw new Error(`${raspuns.status} la ${url}`);

  const { data, info } = await sharp(Buffer.from(await raspuns.arrayBuffer()))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const N = W * H;

  const minRGB = new Uint8Array(N);
  const abatere = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const j = i * C;
    const mn = Math.min(data[j], data[j + 1], data[j + 2]);
    minRGB[i] = mn;
    abatere[i] = Math.max(data[j], data[j + 1], data[j + 2]) - mn;
  }
  const albCurat = (i) =>
    data[i * C + 3] <= PRAG_ALFA || (minRGB[i] >= PRAG_FUNDAL && abatere[i] <= PRAG_NEUTRU);

  // ── 1. Umplere în lățime, din cele patru margini ──
  const fundal = new Uint8Array(N);
  const coada = new Int32Array(N);
  let cap = 0;
  let sfarsit = 0;
  const incearca = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = y * W + x;
    if (fundal[i] || !albCurat(i)) return;
    fundal[i] = 1;
    coada[sfarsit++] = i;
  };
  for (let x = 0; x < W; x++) {
    incearca(x, 0);
    incearca(x, H - 1);
  }
  for (let y = 0; y < H; y++) {
    incearca(0, y);
    incearca(W - 1, y);
  }
  while (cap < sfarsit) {
    const i = coada[cap++];
    const x = i % W;
    const y = (i / W) | 0;
    for (const [dx, dy] of VECINI) incearca(x + dx, y + dy);
  }

  // ── 2. Banda de contur: pixelii de produs aflați la cel mult BANDA de fundal ──
  const distanta = new Int16Array(N).fill(-1);
  for (let i = 0; i < N; i++) if (fundal[i]) distanta[i] = 0;
  let val = [];
  for (let i = 0; i < N; i++) {
    if (distanta[i] !== 0) continue;
    const x = i % W;
    const y = (i / W) | 0;
    for (const [dx, dy] of VECINI) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const k = ny * W + nx;
      if (distanta[k] === -1) {
        distanta[k] = 1;
        val.push(k);
      }
    }
  }
  for (let d = 2; d <= BANDA; d++) {
    const urmator = [];
    for (const i of val) {
      const x = i % W;
      const y = (i / W) | 0;
      for (const [dx, dy] of VECINI) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const k = ny * W + nx;
        if (distanta[k] === -1) {
          distanta[k] = d;
          urmator.push(k);
        }
      }
    }
    val = urmator;
  }

  // ── 3. Alfa ──
  const alfa = new Float32Array(N);
  for (let i = 0; i < N; i++) alfa[i] = fundal[i] ? 0 : data[i * C + 3] / 255;

  let calculati = 0;
  for (let i = 0; i < N; i++) {
    if (distanta[i] < 1 || distanta[i] > BANDA) continue;
    const x = i % W;
    const y = (i / W) | 0;

    // Culoarea produsului: cel mai închis pixel sigur din vecinătate.
    let celMaiInchis = 256;
    for (let dy = -RAZA_CULOARE; dy <= RAZA_CULOARE; dy++) {
      const ny = y + dy;
      if (ny < 0 || ny >= H) continue;
      for (let dx = -RAZA_CULOARE; dx <= RAZA_CULOARE; dx++) {
        const nx = x + dx;
        if (nx < 0 || nx >= W) continue;
        const k = ny * W + nx;
        if (distanta[k] !== -1) continue; // e fundal sau tot contur
        if (minRGB[k] < celMaiInchis) celMaiInchis = minRGB[k];
      }
    }
    if (celMaiInchis === 256) continue; // n-are de unde ști: rămâne opac

    const contrast = 255 - celMaiInchis;
    if (contrast < MIN_CONTRAST) continue; // produs aproape alb: se păstrează

    alfa[i] = Math.max(0, Math.min(1, (255 - minRGB[i]) / contrast));
    calculati++;
  }

  // ── 4. Albul scos din culoarea pixelilor pe jumătate transparenți ──
  for (let i = 0; i < N; i++) {
    const a = alfa[i];
    const j = i * C;
    if (a > 0.004 && a < 0.996 && data[j + 3] === 255) {
      for (let k = 0; k < 3; k++) {
        const v = (data[j + k] - 255 * (1 - a)) / a;
        data[j + k] = Math.max(0, Math.min(255, Math.round(v)));
      }
    }
    data[j + 3] = Math.round(a * 255);
  }

  // ── 5. Se taie golul, se aduce la mărimea de folosit, se dă puțină claritate ──
  const iesire = path.join(IESIRE, `${slug}.png`);
  await sharp(data, { raw: { width: W, height: H, channels: C } })
    .trim({ threshold: 0 })
    .resize({
      width: LATURA_MAX,
      height: LATURA_MAX,
      fit: "inside",
      withoutEnlargement: true,
      kernel: "lanczos3",
    })
    .sharpen({ sigma: 0.7, m1: 0.5, m2: 1.2 })
    .png({ compressionLevel: 9 })
    .toFile(iesire);

  const dupa = await sharp(iesire).metadata();
  const scos = fundal.reduce((s, v) => s + v, 0);
  console.log(
    `  ${slug}`.padEnd(54) +
      `${W}x${H} -> ${dupa.width}x${dupa.height}  ` +
      `${((100 * scos) / N).toFixed(0)}% fundal, ${calculati} px de contur, ` +
      `${(fs.statSync(iesire).size / 1024).toFixed(0)} KB`,
  );
}

const argumente = process.argv.slice(2);
if (argumente.length === 0 || argumente.length % 2 !== 0) {
  console.error("folosire: node tools/imagini/fara-fundal.mjs <slug> <url> [...]");
  process.exit(1);
}
fs.mkdirSync(IESIRE, { recursive: true });
console.log(`Scot fundalul de pe ${argumente.length / 2} fotografii:`);
for (let i = 0; i < argumente.length; i += 2) {
  await decupeaza(argumente[i + 1], argumente[i]);
  await new Promise((r) => setTimeout(r, 700)); // rafalele supără Imunify360
}
