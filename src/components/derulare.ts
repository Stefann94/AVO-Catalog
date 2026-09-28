import { ChevronLeft, ChevronRight } from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   BENZI DERULABILE — partea comună
   ──────────────────────────────────────────────────────────────────────────
   În site sunt două feluri de bandă, și diferă doar prin UNDE stau săgețile:

     BandaDerulare ............ săgețile sub pistă, în aceeași componentă cu ea
                                (lichidarea de stoc)
     acasa/SagetiFile ......... săgețile în capul secțiunii, despărțite de pistă
                                de tot restul antetului (filele de produse)

   A doua n-a putut refolosi prima fiindcă filele se schimbă din CSS: fiecare
   filă are pista ei, iar capul secțiunii e unul singur, deasupra tuturor. O
   componentă care ține și pista, și săgețile, n-ar fi avut cum să cuprindă și
   antetul comun, și panoul care se schimbă sub el.

   Ce e identic — matematica pasului, citirea capetelor și rețeta butoanelor —
   stă aici, ca să nu se despartă la prima ajustare.
   ══════════════════════════════════════════════════════════════════════════ */

/** Câte carduri se sar la o apăsare, când încap. */
const PAS = 2;

/**
 * Capetele benzii, citite din poziția reală de derulare.
 *
 * Marja de 1px nu e superstiție: `scrollLeft` e fracționar pe ecrane cu
 * densitate mare, iar o comparație exactă lasă săgeata activă la capăt,
 * apăsabilă fără efect.
 *
 * ÎNTOARCE `null` CÂND BANDA N-ARE LĂȚIME. O pistă dintr-un panou închis
 * (`display: none`) are `clientWidth` și `scrollWidth` zero, iar calculul ar da
 * `0 >= -1`, adică „ești la capăt" — exact defectul care a ținut cinci file din
 * șase cu săgeata dreaptă stinsă, deși aveau 1960px de derulat. Cine primește
 * `null` își păstrează starea, nu o strică.
 */
export function capetele(el: HTMLElement | null) {
  if (!el || el.clientWidth === 0) return null;
  return {
    laInceput: el.scrollLeft <= 1,
    laSfarsit: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1,
  };
}

/**
 * Mută banda cu un pas, în direcția dată.
 *
 * ─── PASUL E DE DOUĂ CARDURI, NU O LĂȚIME DE FEREASTRĂ ────────────────────
 *
 * Un ecran plin la fiecare apăsare înseamnă, pe un monitor lat, patru produse
 * sărite dintr-odată: apeși o dată și nu mai recunoști nimic din ce vedeai.
 * Doi lasă mereu context pe ecran — ce era în dreapta ajunge în stânga.
 *
 * PE ECRANE ÎNGUSTE PASUL SCADE LA CÂTE ÎNCAP. Pe telefon intră un card; un pas
 * de două ar trece complet peste al doilea, fără ca el să fi fost văzut vreodată.
 *
 * ─── `scrollTo` PE MULTIPLU, NU `scrollBy` ────────────────────────────────
 *
 * `scrollBy` adună deplasări relative peste poziția curentă, iar aceea poate fi
 * deja fracționară — dintr-o derulare cu trackpad-ul, dintr-un Tab care a adus
 * un card în cadru, dintr-un ecran cu densitate mare. După câteva apăsări, banda
 * ar sta cu un card tăiat la stânga, iar snap-ul n-ar corecta-o: el acționează
 * la finalul unei derulări cu degetul, nu după o deplasare programatică.
 *
 * Aici se calculează întâi PE AL CÂTELEA CARD suntem, se adună pasul, și se
 * merge la multiplul exact. Orice abatere adunată se pierde la prima apăsare.
 *
 * Lățimea se MĂSOARĂ de pe primul card, nu se scrie ca 278: cardul își are
 * lățimea în componenta care îl randează, iar o constantă duplicată aici ar fi
 * rămas în urmă la prima ajustare — cu efectul cel mai urât cu putință, banda ar
 * fi aterizat aproape pe muchie, dar nu pe ea.
 */
export function gliseaza(el: HTMLElement | null, directie: -1 | 1) {
  if (!el) return;
  const card = el.firstElementChild;
  const w = card ? card.getBoundingClientRect().width : 0;
  if (w <= 0) return;

  const incap = Math.max(1, Math.floor(el.clientWidth / w));
  const pas = Math.min(PAS, incap);
  const acum = Math.round(el.scrollLeft / w);

  el.scrollTo({ left: (acum + directie * pas) * w, behavior: "smooth" });
}

/* ──────────────────────────────────────────────────────────────────────────
   REȚETA SĂGEȚILOR — una plină, una goală

   ÎNAINTE ERAU AMÂNDOUĂ ALBE, pe rețeta cardurilor, cu argumentul că săgețile
   „nu duc nicăieri, doar mută banda, deci sunt comenzi, nu decizii". Ce lipsea
   din argument e că un rând de două butoane albe sub o bandă de carduri albe nu
   se citește deloc. Un control care nu e văzut nu e discret, e absent.

   ÎNAINTE, plină `avo-600`: e direcția în care conținutul chiar continuă, deci
   acțiunea implicită. Aceleași trepte ca `BUTON_PLIN` din stiluri.ts — 600 în
   repaus, 700 la hover, 800 apăsat — fiindcă e același gest, nu unul nou.

   ÎNAPOI, albă: contur de 1px care la hover se colorează și se îngroașă printr-un
   `ring`, desenat în afara cutiei, deci butonul nu se mută cu un pixel.

   Perechea plin/gol e ce le face lizibile ca pereche: una cheamă, cealaltă
   răspunde. Două butoane pline ar fi făcut din navigație un al doilea centru de
   greutate în secțiune.

   ─── LA CAPĂT SE STING, ȘI DOAR ATÂT ──────────────────────────────────────

   Săgeata ajunsă la capăt devine albă cu semnul gri, nu albastră ștearsă: un
   buton albastru dezactivat arată în continuare apăsabil, iar culoarea ar minți
   despre ce se poate face.

   FĂRĂ `cursor-not-allowed`. Acela desenează semnul de interdicție — un simbol
   de eroare pentru ceva ce nu e o eroare: ai ajuns la capătul listei, ceea ce e
   o stare normală. Butonul stins spune deja tot, în tăcere.
   ────────────────────────────────────────────────────────────────────────── */

export const SAGEATA =
  "inline-flex h-11 w-11 items-center justify-center rounded-lg border " +
  "transition-[color,background-color,border-color,box-shadow] duration-200 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-avo-600";

export const SAGEATA_ALBA =
  "border-gray-200 bg-white text-gray-900 hover:border-avo-600 hover:text-avo-700 hover:ring-1 hover:ring-avo-600";

export const SAGEATA_ALBASTRA =
  "border-avo-600 bg-avo-600 text-white hover:border-avo-700 hover:bg-avo-700 active:border-avo-800 active:bg-avo-800";

export const SAGEATA_STINSA = "border-gray-200 bg-white text-gray-300";

export { ChevronLeft, ChevronRight };
