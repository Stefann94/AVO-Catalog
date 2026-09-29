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
 * Comenzile secțiunii de produse: săgețile benzilor și plăcuța care alunecă
 * sub fila deschisă.
 *
 * ─── DE CE AMÂNDOUĂ ÎN ACEEAȘI COMPONENTĂ ─────────────────────────────────
 *
 * Fiindcă au nevoie de exact același semnal — „s-a schimbat fila" — iar el se
 * prinde o singură dată. Două componente ar fi însemnat două ascultătoare de
 * `change` pe aceeași rădăcină, două `ResizeObserver` și încă o intrare în
 * pachetul de JavaScript, pentru douăzeci de rânduri de cod.
 *
 * Plăcuța: fără JavaScript, CSS-ul n-are cum să afle cât e de lată eticheta
 * bifată, deci nici n-o poate muta. Aici se măsoară și se scriu două variabile
 * pe bară; restul face CSS-ul (vezi „PLĂCUȚA CARE ALUNECĂ" în globals.css).
 * Până atunci, fundalul se desenează pe etichetă ca înainte — aspectul e
 * neschimbat, doar nu alunecă.
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
export default function ComenziFile() {
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

  /**
   * Mută plăcuța sub eticheta bifată.
   *
   * `offsetLeft` și `offsetWidth`, nu `getBoundingClientRect`: primele sunt
   * relative la bară (care e `position: relative`), deci nu trebuie scăzută
   * poziția părintelui, și nu sunt afectate de derularea paginii. Sunt tot
   * citiri care forțează așezarea, dar sunt două, o dată per schimbare de filă.
   *
   * `data-pilula` se pune în DOUĂ trepte, și asta contează: întâi fără valoare,
   * ca plăcuța să apară deja la locul ei, apoi `"on"` la cadrul următor, care
   * pornește tranziția. Puse odată, prima așezare s-ar fi animat din colțul din
   * stânga, de la lățime zero, la fiecare încărcare a paginii.
   */
  const asazaPilula = useCallback(() => {
    const radacina = gazda.current?.closest(".file-produse");
    const bara = radacina?.querySelector<HTMLElement>("[data-file-bara]");
    const bifat = radacina?.querySelector<HTMLInputElement>('input[type="radio"]:checked');
    if (!bara || !bifat) return;

    const eticheta = bara.querySelector<HTMLElement>(`label[for="${bifat.id}"]`);
    if (!eticheta || eticheta.offsetWidth === 0) return;

    bara.style.setProperty("--pilula-x", `${eticheta.offsetLeft}px`);
    bara.style.setProperty("--pilula-w", `${eticheta.offsetWidth}px`);
    if (!bara.dataset.pilula) {
      bara.dataset.pilula = "";
      requestAnimationFrame(() => {
        bara.dataset.pilula = "on";
      });
    }
  }, []);

  useEffect(() => {
    const radacina = gazda.current?.closest(".file-produse");
    if (!radacina) return;

    const reasaza = () => {
      masoara();
      asazaPilula();
    };

    reasaza();

    /* A DOUA MĂSURĂTOARE, DUPĂ CE SE ÎNCARCĂ FONTUL. Etichetele sunt măsurate
       la corpul lor real; până vine Libre Franklin, browserul le desenează cu
       fontul de rezervă, care are alte lățimi. Fără asta, plăcuța rămâne
       decalată cu câțiva pixeli până la prima apăsare. */
    document.fonts?.ready.then(asazaPilula).catch(() => {});

    const piste = [...radacina.querySelectorAll<HTMLElement>("[data-pista]")];
    const bara = radacina.querySelector<HTMLElement>("[data-file-bara]");
    const observator = new ResizeObserver(reasaza);
    for (const p of piste) {
      p.addEventListener("scroll", masoara, { passive: true });
      observator.observe(p);
    }
    if (bara) observator.observe(bara);
    radacina.addEventListener("change", reasaza);

    return () => {
      for (const p of piste) p.removeEventListener("scroll", masoara);
      radacina.removeEventListener("change", reasaza);
      observator.disconnect();
    };
  }, [masoara, asazaPilula]);

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
