#!/usr/bin/env node
/**
 * Video-urile din hero: recomprimare + poster.
 *
 *   npm install && node comprima.mjs
 *
 * Din originale/<nume>.mp4 scrie în public/videos/:
 *   hero-<nume>.mp4          H.264, 1280 px, 10 s, fără sunet, faststart
 *   hero-<nume>-poster.jpg   un cadru reprezentativ, sursa pentru next/image (AVIF/WebP)
 *
 * DE CE AȘA
 *   10 s ...... fiecare slide stă 8 s pe ecran, plus 1 s de fade. Restul nu se
 *               vede niciodată: solar.mp4 avea 88 s și 18,9 MB.
 *   1280 px ... video-ul e afișat la 60% opacitate, sub două gradiente închise.
 *               Diferența față de 1920 nu se vede, dar costă de ~2 ori mai mult.
 *   -an ....... rulează mereu `muted`; pista audio era descărcată degeaba.
 *   faststart . indexul MP4 la început: redarea pornește după primii KB, nu
 *               după tot fișierul.
 *   CRF 28 .... sub gradient, artefactele de compresie nu se disting; verificat
 *               vizual pe capturi la 1440 px.
 *
 * ffmpeg vine din npm (ffmpeg-static), deci nu trebuie instalat nimic în sistem.
 */

import { execFileSync } from "node:child_process";
import { readdirSync, statSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import ffmpeg from "ffmpeg-static";

const aici = dirname(fileURLToPath(import.meta.url));
const originale = join(aici, "originale");
const iesire = join(aici, "..", "..", "public", "videos");
mkdirSync(iesire, { recursive: true });

const DURATA = 10;

/**
 * Secunda din care se ia posterul. Toate trei pornesc de pe negru (fade-in),
 * deci primul cadru ar fi un dreptunghi negru — exact ce vede un telefon, care
 * primește doar posterul. Ales pe foi de cadre, secundă cu secundă.
 */
const CADRU_POSTER = { aiko: 7, deye: 3.5, solar: 1.5 };
const LATIME = 1280;
const CRF = 28;

const kb = (f) => Math.round(statSync(f).size / 1024);

for (const f of readdirSync(originale).filter((f) => f.endsWith(".mp4"))) {
  const nume = f.replace(/\.mp4$/, "");
  const sursa = join(originale, f);
  const video = join(iesire, `hero-${nume}.mp4`);
  const poster = join(iesire, `hero-${nume}-poster.jpg`);

  execFileSync(ffmpeg, [
    "-y", "-v", "error", "-i", sursa,
    "-t", String(DURATA),
    "-vf", `scale=${LATIME}:-2:flags=lanczos,fps=25`,
    "-c:v", "libx264", "-preset", "slow", "-crf", String(CRF),
    "-profile:v", "high", "-pix_fmt", "yuv420p",
    "-an", "-movflags", "+faststart",
    video,
  ]);

  execFileSync(ffmpeg, [
    "-y", "-v", "error", "-ss", String(CADRU_POSTER[nume] ?? 2), "-i", sursa,
    "-frames:v", "1", "-vf", `scale=${LATIME}:-2:flags=lanczos`, "-q:v", "2",
    poster,
  ]);

  console.log(`${nume.padEnd(6)} ${String(kb(sursa)).padStart(6)} KB  →  video ${String(kb(video)).padStart(5)} KB, poster ${kb(poster)} KB`);
}
