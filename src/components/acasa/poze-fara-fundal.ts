import fs from "node:fs";
import path from "node:path";
import type { Produs } from "@/lib/produs";

/* ══════════════════════════════════════════════════════════════════════════
   FOTOGRAFIA FĂRĂ FUNDAL, DACĂ EXISTĂ
   ──────────────────────────────────────────────────────────────────────────
   Catalogul are fotografiile pe alb: WooCommerce le ține ca WebP opac, cu
   chenar alb de jur împrejur. Pe cardurile albe din site nu se vede nimic — pe
   albastrul închis al hero-ului, fiecare produs stătea într-o cutie albă.

   Soluția NU e în CSS. `mix-blend-mode: multiply` ar scoate albul, dar ar
   întuneca și produsul, care e el însuși aproape alb la invertoare și
   acumulatori; pe fond bleumarin ar fi ieșit o siluetă. Albul trebuie scos din
   pixeli, nu ascuns.

   `tools/imagini/fara-fundal.mjs` îl scoate și scrie rezultatul în
   `public/produse-png/<slug>.png`. Fișierul ăsta e puntea: caută un PNG cu
   numele slug-ului produsului și îl preferă când există.

   ─── DE CE O CĂUTARE ÎN DOSAR, ȘI NU O LISTĂ SCRISĂ ──────────────────────

   Hero-ul nu arată produse alese de mână: își ia câte unul din fiecare
   categorie, pe reguli (vezi `strange` din HeroReclame.tsx). Dacă mâine se
   schimbă catalogul, se schimbă și produsele din hero. O listă scrisă în cod
   ar fi rămas în urmă în tăcere, arătând un PNG pentru un produs care nu mai e
   acolo — sau, mai rău, nimic pentru unul care e.

   Așa, regula e una singură: pui un PNG cu numele slug-ului în dosar și se
   folosește. Nu-l pui, se folosește fotografia din WordPress, ca până acum.
   Nimic nu se strică dacă dosarul e gol.

   Citirea se face O SINGURĂ DATĂ, la încărcarea modulului, adică la build.
   Site-ul e exportat static, deci în browser nu ajunge nicio linie de aici.
   ══════════════════════════════════════════════════════════════════════════ */

const DOSAR = path.join(process.cwd(), "public", "produse-png");

const DECUPATE: ReadonlySet<string> = (() => {
  try {
    return new Set(
      fs
        .readdirSync(DOSAR)
        .filter((f) => f.endsWith(".png"))
        .map((f) => f.slice(0, -4)),
    );
  } catch {
    // Dosarul poate lipsi într-o copie proaspătă a depozitului. Atunci pur și
    // simplu nu există niciun decupaj, iar totul cade pe WordPress.
    return new Set<string>();
  }
})();

export type PozaHero = { url: string; alt: string };

/**
 * Fotografia de folosit în hero: decupajul local, dacă a fost făcut, altfel
 * cea din WooCommerce. `undefined` când produsul n-are nici una, nici alta —
 * 32 din cele 172 de produse n-au fotografie deloc.
 */
export function pozaHero(p: Produs | undefined): PozaHero | undefined {
  if (!p) return undefined;
  const alt = p.imagine?.alt ?? p.nume;
  if (p.slug && DECUPATE.has(p.slug)) return { url: `/produse-png/${p.slug}.png`, alt };
  return p.imagine ? { url: p.imagine.url, alt } : undefined;
}
