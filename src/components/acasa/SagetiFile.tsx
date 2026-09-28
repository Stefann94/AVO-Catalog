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
} from "../derulare";

/**
 * Săgețile benzilor de produse, așezate în capul secțiunii.
 *
 * ─── DE CE NU E `BandaDerulare` ───────────────────────────────────────────
 *
 * Acolo săgețile stau în aceeași componentă cu pista, deci pot ajunge la ea
 * printr-un `ref`. Aici nu se poate: filele se schimbă din CSS (`:has()`, vezi
 * „FILE DE PRODUSE" în globals.css), fiecare filă are pista ei, iar capul
 * secțiunii e unul singur, deasupra tuturor panourilor. O componentă care să
 * cuprindă și antetul comun, și panoul care se schimbă sub el, n-are unde să
 * înceapă.
 *
 * Aici săgețile nu țin o pistă anume: la fiecare apăsare o CAUTĂ pe cea vizibilă.
 *
 * ─── CUM SE GĂSEȘTE PISTA DESCHISĂ ────────────────────────────────────────
 *
 * `offsetParent === null` e testul de „nu e afișat" — adevărat pentru orice
 * element dintr-un strămoș cu `display: none`, care e exact ce sunt panourile
 * închise. E o citire, nu o măsurătoare: nu forțează recalcularea așezării așa
 * cum ar face `getBoundingClientRect` pe fiecare pistă.
 *
 * ─── CÂND SE RECITESC CAPETELE ────────────────────────────────────────────
 *
 * Trei semnale, fiindcă niciunul singur nu acoperă tot:
 *
 *   `change` pe rădăcină ... s-a bifat alt radio, deci s-a schimbat fila.
 *                            Evenimentul urcă de la `<input>`, iar la momentul
 *                            în care ajunge aici, `:has()` a mutat deja
 *                            `display`-ul — deci pista cea nouă e măsurabilă.
 *   `scroll` pe piste ...... derulare cu degetul, cu trackpad-ul, sau după ce
 *                            Tab-ul a adus un card în cadru.
 *   `ResizeObserver` ....... fereastra s-a redimensionat, sau o pistă a trecut
 *                            de la lățime zero (panou închis) la lățimea
 *                            coloanei. A doua e plasa de siguranță pentru
 *                            schimbarea filei, dacă `change` scapă vreodată.
 *
 * ─── STAREA DE PORNIRE E „AMBELE STINSE" ──────────────────────────────────
 *
 * `laSfarsit` pornește `true`, nu `false`. Până la hidratare butoanele nu fac
 * nimic oricum, iar o săgeată albastră, aprinsă, care nu răspunde la apăsare e
 * mai rea decât una stinsă. După prima măsurătoare ajunge la starea adevărată.
 */
export default function SagetiFile() {
  const gazda = useRef<HTMLDivElement>(null);
  const [laInceput, setLaInceput] = useState(true);
  const [laSfarsit, setLaSfarsit] = useState(true);

  const pistaDeschisa = useCallback((): HTMLElement | null => {
    const radacina = gazda.current?.closest(".file-produse");
    if (!radacina) return null;
    const piste = radacina.querySelectorAll<HTMLElement>("[data-pista]");
    for (const p of piste) if (p.offsetParent !== null) return p;
    return null;
  }, []);

  const masoara = useCallback(() => {
    const c = capetele(pistaDeschisa());
    if (!c) return;
    setLaInceput(c.laInceput);
    setLaSfarsit(c.laSfarsit);
  }, [pistaDeschisa]);

  useEffect(() => {
    const radacina = gazda.current?.closest(".file-produse");
    if (!radacina) return;

    masoara();

    const piste = [...radacina.querySelectorAll<HTMLElement>("[data-pista]")];
    const observator = new ResizeObserver(masoara);
    for (const p of piste) {
      p.addEventListener("scroll", masoara, { passive: true });
      observator.observe(p);
    }
    radacina.addEventListener("change", masoara);

    return () => {
      for (const p of piste) p.removeEventListener("scroll", masoara);
      radacina.removeEventListener("change", masoara);
      observator.disconnect();
    };
  }, [masoara]);

  /* ASCUNSE PE TELEFON (sub `sm`): acolo banda se glisează cu degetul, iar
     cardul tăiat din dreapta arată deja că mai e. Două butoane de 44px lângă
     bara de file ar fi înghesuit rândul pe care oricum se trag filele. */
  return (
    <div ref={gazda} className="hidden shrink-0 items-center gap-2 sm:flex">
      <button
        type="button"
        onClick={() => gliseaza(pistaDeschisa(), -1)}
        disabled={laInceput}
        aria-label="Produsele anterioare"
        className={`${SAGEATA} ${laInceput ? SAGEATA_STINSA : SAGEATA_ALBA}`}
      >
        <ChevronLeft size={18} strokeWidth={2.5} />
      </button>
      <button
        type="button"
        onClick={() => gliseaza(pistaDeschisa(), 1)}
        disabled={laSfarsit}
        aria-label="Produsele următoare"
        className={`${SAGEATA} ${laSfarsit ? SAGEATA_STINSA : SAGEATA_ALBASTRA}`}
      >
        <ChevronRight size={18} strokeWidth={2.5} />
      </button>
    </div>
  );
}
