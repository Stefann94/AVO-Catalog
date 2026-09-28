"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  capetele,
  gliseaza,
  ChevronLeft,
  ChevronRight,
  SAGEATA,
  SAGEATA_ALBA,
  SAGEATA_ALBASTRA,
  SAGEATA_STINSA,
} from "./derulare";

/**
 * Bandă derulabilă pe orizontală, cu săgețile SUB pistă.
 *
 * O folosește lichidarea de stoc de pe prima pagină. Filele de produse au
 * săgețile în capul secțiunii, despărțite de pistă de tot antetul, deci au
 * nevoie de altă componentă — vezi acasa/SagetiFile.tsx. Ce e comun (pasul,
 * capetele, rețeta butoanelor) stă în components/derulare.ts.
 *
 * ─── CE A FOST ÎNAINTE ────────────────────────────────────────────────────
 *
 * Un carusel care se mișca singur, cu pauză la hover și buton de oprire. A căzut
 * pentru că mișcarea permanentă cerea, ca să fie corectă, tot aparatul de
 * accesibilitate din jurul ei — WCAG 2.2.2, `prefers-reduced-motion`, oprire la
 * focus — și pentru că într-o bandă de PREȚURI mișcarea lucrează împotriva
 * conținutului: o cifră care alunecă nu se compară cu alta.
 *
 * Ce a rămas nu are nevoie de niciuna dintre ele: nimic nu se mișcă de la sine.
 *
 * ─── DERULARE NATIVĂ, NU POZIȚIE CALCULATĂ ────────────────────────────────
 *
 * Pista e un container cu `overflow-x-auto`, nu un `transform` mutat dintr-o
 * stare React. Diferența nu e de stil, e de funcționalitate: derularea nativă
 * vine cu degetul pe touch, cu trackpad-ul pe laptop, cu Tab-ul între linkuri și
 * cu săgețile de la tastatură — toate gratis. O pistă mutată din JavaScript ar fi
 * trebuit să le reimplementeze pe rând, prost. Săgețile nu fac decât să cheme
 * `scrollTo`; sunt o comoditate peste ceva ce funcționează și fără ele.
 *
 * `scroll-snap` face ca oprirea să cadă pe marginea unui card, nu la jumătatea
 * lui. Fără el, o derulare cu trackpad-ul lăsa mereu un card tăiat pe dreapta,
 * ceea ce arată a scăpare, nu a „mai e".
 */
export default function BandaDerulare({ children }: { children: React.ReactNode }) {
  const pista = useRef<HTMLDivElement>(null);
  const [laInceput, setLaInceput] = useState(true);
  const [laSfarsit, setLaSfarsit] = useState(false);

  const masoara = useCallback(() => {
    const c = capetele(pista.current);
    if (!c) return;
    setLaInceput(c.laInceput);
    setLaSfarsit(c.laSfarsit);
  }, []);

  /**
   * `ResizeObserver`, NU `window.resize`.
   *
   * Observatorul se uită la element, nu la fereastră, deci prinde și cazurile în
   * care banda își schimbă lățimea fără ca fereastra s-o facă.
   */
  useEffect(() => {
    const el = pista.current;
    masoara();
    if (!el) return;
    const observator = new ResizeObserver(masoara);
    observator.observe(el);
    return () => observator.disconnect();
  }, [masoara]);

  return (
    <div>
      {/* Pista.
          `-mx-4 px-4` și `sm:-mx-6 sm:px-6` o lasă să atingă marginile ecranului
          pe telefon și pe tabletă, unde altfel ar fi rămas un jgheab gol în care
          cardurile se opresc înainte de margine. Padding-ul readuce primul card
          în coloana de text, iar `scroll-px` face ca și oprirea de snap să cadă
          tot acolo.

          DE LA `lg` NU MAI IESE DIN SECȚIUNE: se oprește exact la marginea
          coloanei. Prețul, asumat: la hover, cardul lipit de margine are inelul
          exterior tăiat pe latura dinspre ea. Conturul lui de 1px se colorează
          oricum — acela e în interiorul cutiei — deci starea rămâne vizibilă.
          Pe verticală, `py-1 -my-1` îi face loc fără să strice alinierea. */}
      <div
        ref={pista}
        onScroll={masoara}
        className="fara-bara-derulare -my-1 -mx-4 flex snap-x snap-mandatory scroll-px-4 overflow-x-auto px-4 py-1 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:px-0"
      >
        {children}
      </div>

      {/* Comenzile, în stânga jos, sub carduri.
          ASCUNSE PE TELEFON (sub `sm`): acolo banda se glisează cu degetul, iar
          cardul tăiat din dreapta arată deja că mai e. Două butoane de 44px sub
          carduri ar fi fost doar un rând în plus de parcurs. */}
      <div className="mt-6 hidden items-center gap-2 sm:flex">
        <button
          type="button"
          onClick={() => gliseaza(pista.current, -1)}
          disabled={laInceput}
          aria-label="Ofertele anterioare"
          className={`${SAGEATA} ${laInceput ? SAGEATA_STINSA : SAGEATA_ALBA}`}
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={() => gliseaza(pista.current, 1)}
          disabled={laSfarsit}
          aria-label="Ofertele următoare"
          className={`${SAGEATA} ${laSfarsit ? SAGEATA_STINSA : SAGEATA_ALBASTRA}`}
        >
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
