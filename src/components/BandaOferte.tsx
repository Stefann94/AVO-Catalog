"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Banda cu ofertele lunii — derulare pe orizontală, condusă de utilizator.
 *
 * ─── CE A FOST ÎNAINTE ────────────────────────────────────────────────────
 *
 * Un carusel care se mișca singur, cu pauză la hover și buton de oprire. A
 * căzut pentru că mișcarea permanentă cerea, ca să fie corectă, tot aparatul de
 * accesibilitate din jurul ei — WCAG 2.2.2, `prefers-reduced-motion`, oprire la
 * focus — și pentru că într-o bandă de PREȚURI mișcarea lucrează împotriva
 * conținutului: o cifră care alunecă nu se compară cu alta.
 *
 * Ce a rămas nu are nevoie de niciuna dintre ele: nimic nu se mișcă de la sine,
 * deci nu e nimic de oprit.
 *
 * ─── DERULARE NATIVĂ, NU POZIȚIE CALCULATĂ ────────────────────────────────
 *
 * Pista e un container cu `overflow-x-auto`, nu un `transform` mutat dintr-o
 * stare React. Diferența nu e de stil, e de funcționalitate: derularea nativă
 * vine cu degetul pe touch, cu trackpad-ul pe laptop, cu Tab-ul între linkuri
 * și cu săgețile de la tastatură — toate gratis. O pistă mutată din JavaScript
 * ar fi trebuit să le reimplementeze pe rând, prost.
 *
 * Săgețile nu fac decât să cheme `scrollBy`. Sunt o comoditate peste ceva ce
 * funcționează și fără ele.
 *
 * `scroll-snap` face ca oprirea să cadă pe marginea unui card, nu la jumătatea
 * lui. Fără el, o derulare cu trackpad-ul lăsa mereu un card tăiat pe dreapta,
 * ceea ce arată a scăpare, nu a „mai e".
 *
 * ─── PASUL E DE DOUĂ CARDURI, NU O LĂȚIME DE FEREASTRĂ ────────────────────
 *
 * A FOST `clientWidth`, adică un ecran plin la fiecare apăsare. Pe un monitor
 * lat asta înseamnă patru produse sărite dintr-odată: apeși o dată și nu mai
 * recunoști nimic din ce vedeai, ceea ce e dezorientant într-o listă în care
 * tocmai comparai două prețuri.
 *
 * Doi e cifra care lasă mereu context pe ecran — ce era în dreapta ajunge în
 * stânga — și în același timp mișcă destul cât apăsarea să se simtă.
 *
 * PE ECRANE ÎNGUSTE PASUL SCADE LA CÂTE ÎNCAP. Pe telefon intră un card; un
 * pas de două ar trece complet peste al doilea, fără ca el să fi fost văzut
 * vreodată. `Math.min(2, câte încap)` acoperă cazul fără un prag scris de mână.
 *
 * ─── DE CE `scrollTo` PE MULTIPLU, NU `scrollBy` ──────────────────────────
 *
 * `scrollBy` adună deplasări relative peste poziția curentă, iar poziția
 * curentă poate fi deja fracționară — dintr-o derulare cu trackpad-ul, dintr-un
 * Tab care a adus un card în cadru, dintr-un ecran cu densitate mare unde
 * `scrollLeft` nu e întreg. După câteva apăsări, banda ar sta cu un card tăiat
 * la stânga, iar snap-ul n-ar corecta-o: snap-ul acționează la finalul unei
 * derulări cu degetul, nu după o deplasare programatică.
 *
 * Aici se calculează întâi PE AL CÂTELEA CARD suntem, se adună pasul, și se
 * merge la multiplul exact. Orice abatere adunată până atunci se pierde la
 * prima apăsare, în loc să se acumuleze — deci marginea din stânga cade mereu
 * fix pe muchia unui card, iar pe ecran rămân produse întregi.
 */
export default function BandaOferte({ children }: { children: React.ReactNode }) {
  const pista = useRef<HTMLDivElement>(null);
  const [laInceput, setLaInceput] = useState(true);
  const [laSfarsit, setLaSfarsit] = useState(false);

  /**
   * Recitește capetele din poziția reală de derulare.
   *
   * Marja de 1px nu e superstiție: `scrollLeft` e fracționar pe ecrane cu
   * densitate mare, iar o comparație exactă lasă săgeata activă la capăt,
   * apăsabilă fără efect.
   */
  const masoara = useCallback(() => {
    const el = pista.current;
    if (!el) return;
    setLaInceput(el.scrollLeft <= 1);
    setLaSfarsit(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    masoara();
    window.addEventListener("resize", masoara);
    return () => window.removeEventListener("resize", masoara);
  }, [masoara]);

  /** Câte carduri se sar la o apăsare, când încap. */
  const PAS = 2;

  const gliseaza = (directie: -1 | 1) => {
    const el = pista.current;
    if (!el) return;

    /* Lățimea se MĂSOARĂ de pe primul card, nu se scrie ca 280. Cardul are
       lățimea în componenta părinte (OferteleLunii), iar o constantă duplicată
       aici ar fi rămas în urmă la prima ajustare de lățime — cu efectul cel mai
       urât cu putință: banda ar fi aterizat aproape pe muchie, dar nu pe ea.
       `getBoundingClientRect` întoarce lățimea reală, cu tot cu spațiul dintre
       carduri, fiindcă acela e padding în interiorul cutiei. */
    const card = el.firstElementChild;
    const w = card ? card.getBoundingClientRect().width : 0;
    if (w <= 0) return;

    const incap = Math.max(1, Math.floor(el.clientWidth / w));
    const pas = Math.min(PAS, incap);
    const acum = Math.round(el.scrollLeft / w);

    el.scrollTo({ left: (acum + directie * pas) * w, behavior: "smooth" });
  };

  /**
   * Rețeta săgeților — una plină, una goală.
   *
   * ÎNAINTE ERAU AMÂNDOUĂ ALBE, pe rețeta cardurilor, cu argumentul că săgețile
   * „nu duc nicăieri, doar mută banda, deci sunt comenzi, nu decizii". Ce lipsea
   * din argument e că un rând de două butoane albe sub o bandă de carduri albe
   * nu se citește deloc — nu spune nici că e o comandă, nici că banda se poate
   * derula. Un control care nu e văzut nu e discret, e absent.
   *
   * ÎNAINTE, plină `avo-600`: e direcția în care conținutul chiar continuă,
   * deci acțiunea implicită. Aceleași trepte ca `BUTON_PLIN` din
   * components/stiluri.ts — 600 în repaus, 700 la hover, 800 apăsat — fiindcă e
   * același gest, nu unul nou.
   *
   * ÎNAPOI, albă, pe rețeta `CARD`: contur de 1px care la hover se colorează în
   * `avo-600` și se îngroașă printr-un `ring` (desenat în afara cutiei, deci
   * butonul nu se deplasează cu un pixel la trecerea mouse-ului).
   *
   * Perechea plin/gol e ce le face lizibile ca pereche: una cheamă, cealaltă
   * răspunde. Două butoane pline ar fi făcut din navigație un al doilea centru
   * de greutate, lângă „Vezi" de pe fiecare card.
   *
   * 44px, ca toate țintele de atins cu degetul din site. Raza e 8px, treapta
   * comenzilor din scara de trei raze (12 suprafețe / 8 comenzi / 6 etichete).
   *
   * ─── LA CAPĂT SE STING, ȘI DOAR ATÂT ──────────────────────────────────────
   *
   * Ambele trec pe alb cu iconiță `gray-300` — inclusiv cea albastră, fiindcă
   * un buton albastru dezactivat arată în continuare apăsabil, iar culoarea ar
   * minți despre ce se poate face.
   *
   * FĂRĂ `cursor-not-allowed`. Acela desenează cursorul cu semnul de interdicție
   * — un simbol de eroare pentru ceva ce nu e o eroare: ai ajuns la capătul
   * listei, ceea ce e o stare normală. Butonul stins spune deja tot ce trebuie,
   * în tăcere. Cursorul rămâne cel implicit, iar `disabled` ține apăsarea.
   */
  const SAGEATA =
    "inline-flex h-11 w-11 items-center justify-center rounded-lg border " +
    "transition-[color,background-color,border-color,box-shadow] duration-200 " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-avo-600";
  const ALBA =
    "border-gray-200 bg-white text-gray-900 hover:border-avo-600 hover:text-avo-700 hover:ring-1 hover:ring-avo-600";
  const ALBASTRA =
    "border-avo-600 bg-avo-600 text-white hover:border-avo-700 hover:bg-avo-700 active:border-avo-800 active:bg-avo-800";
  const STINSA = "border-gray-200 bg-white text-gray-300";

  return (
    <div>
      {/* Pista.
          `-mx-4 px-4` (și perechile de la praguri) o lasă să atingă marginile
          ecranului pe telefon, unde altfel ar fi rămas un jgheab gol în care
          cardurile se opresc înainte de margine. Padding-ul readuce primul card
          în coloana de text, iar `scroll-px` face ca și oprirea de snap să cadă
          tot acolo — fără el, primul card s-ar fi lipit de marginea ferestrei
          la prima derulare înapoi. */}
      <div
        ref={pista}
        onScroll={masoara}
        className="fara-bara-derulare -my-1 -mx-4 flex snap-x snap-mandatory scroll-px-4 overflow-x-auto px-4 py-1 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-12 lg:scroll-px-12 lg:px-12"
      >
        {children}
      </div>

      {/* Comenzile, în stânga jos, sub carduri. */}
      <div className="mt-6 flex items-center gap-2">
        <button
          type="button"
          onClick={() => gliseaza(-1)}
          disabled={laInceput}
          aria-label="Ofertele anterioare"
          className={`${SAGEATA} ${laInceput ? STINSA : ALBA}`}
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={() => gliseaza(1)}
          disabled={laSfarsit}
          aria-label="Ofertele următoare"
          className={`${SAGEATA} ${laSfarsit ? STINSA : ALBASTRA}`}
        >
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
