import type { CSSProperties } from "react";
import Image from "next/image";
import { BRANDURI } from "@/lib/branduri";
import { dimensiuneTitluSectiune } from "../stiluri";

/* ══════════════════════════════════════════════════════════════════════════
   MĂRCILE DIN CATALOG
   ──────────────────────────────────────────────────────────────────────────
   Un perete de sigle cu numărul de produse sub fiecare. Structura e preluată
   din prototipul Projects/Solarone.ro; culorile și datele sunt ale noastre.

   ─── DE CE NU SUNT LINKURI ───────────────────────────────────────────────

   Paginile de marcă există, dar sunt PER CATEGORIE:
   /catalog/panouri-fotovoltaice/brand-canadian-solar. Nu există o pagină
   globală pe marcă, deci o siglă n-are o singură țintă firească — Deye are
   produse în trei categorii deodată.

   Am fi putut trimite toate cele 17 către /catalog. N-am făcut-o: 17 linkuri
   care duc în același loc sunt mai rele decât niciunul, și pentru om, și
   pentru Google, care le citește ca navigație fără sens.

   URMĂTORUL PAS FIRESC e o pagină /branduri/<slug> cu toate produsele mărcii,
   indiferent de categorie. Atunci secțiunea asta devine 17 linkuri interne
   reale, iar fiecare marcă primește o pagină pe care o poate indexa.

   ─── CE NU SCRIE AICI ────────────────────────────────────────────────────

   Prototipul are subtitlul „Stoc propriu, garanție și service asigurate de
   noi". Nu l-am copiat: n-avem date de stoc, iar despre garanție și service
   nu ne-a confirmat nimeni nimic. Subtitlul de mai jos spune doar ce se poate
   număra.
   ══════════════════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════════════════════
   CARE MĂRCI SE ARATĂ — zece, alese de mână
   ──────────────────────────────────────────────────────────────────────────
   Secțiunea arăta toate cele 17 mărci, adică patru rânduri de sigle. Acum arată
   două rânduri, cu cele mai cunoscute — și „cunoscute" înseamnă două lucruri
   deodată, cum s-a cerut: cât de mari sunt în catalogul nostru și cât de
   cunoscute sunt în branșă.

   LISTA E SCRISĂ, NU CALCULATĂ. O sortare după numărul de produse ar fi fost
   automată, dar ar fi urcat Eastron (3 contoare) peste Jinko Solar (3 panouri),
   deși Jinko e primul producător de panouri din lume. Faima nu e un câmp în
   date, deci alegerea e editorială — iar lucrurile editoriale se scriu unde se
   văd, nu se ascund într-un `sort`.

   ORDINEA DE AFIȘARE rămâne după numărul de produse, descrescător: fiecare
   dală arată cifra, iar o listă în care cifrele n-ar scădea ar părea stricată.

   CE AM LĂSAT AFARĂ, și de ce — ca să fie ușor de contrazis:

     Eastron ...... 3 produse, dar contoare; recunoscut de electricieni, nu de
                    piața fotovoltaică
     Dyness ....... 2 produse, acumulatori; a pierdut locul 10 în fața lui
                    Stäubli, care face conectorii MC4 — standardul pe care îl
                    știe orice instalator
     Top Cable .... 2 produse, cabluri
     Ulica, Tongwei, PCEnersys, Hailei ... câte un produs fiecare

   Dacă vreuna e greșit judecată, se mută un slug în listă și gata.
   ══════════════════════════════════════════════════════════════════════════ */
const MARCI_ALESE = [
  "deye",
  "k2-systems",
  "growatt",
  "aiko-solar",
  "canadian-solar",
  "pytes",
  "felicity",
  "jinko-solar",
  "solis",
  "staubli",
];

/**
 * Câte dale se văd la fiecare lățime, ca să iasă exact DOUĂ rânduri.
 *
 * Grila are 2 coloane pe telefon, 3 de la `sm`, 5 de la `lg` — deci două
 * rânduri înseamnă altceva la fiecare. Dalele de peste prag nu se scot din
 * marcaj, se ascund cu `hidden`: aceeași listă servește toate trei lățimile,
 * fără nimic randat de două ori.
 */
const PRAG_SM = 4;
const PRAG_LG = 6;

/** Siglele colorate, pentru fundal deschis. Cele albe sunt pentru fundal închis. */
const sigla = (slug: string) => `/branduri/color/${slug}.webp`;

/* „de" se pune de la 20 în sus: 3 produse, 17 produse, 20 DE produse. Regula e
   pe ultimele două cifre, nu pe număr — 101 produse, dar 120 de produse. */
const cuDe = (n: number) => n % 100 >= 20 || n % 100 === 0;

const produse = (n: number) => `${n} ${n === 1 ? "produs" : cuDe(n) ? "de produse" : "produse"}`;

const marciNumar = (n: number) => `${n} ${cuDe(n) ? "de mărci" : "mărci"}`;

export default function Marci() {
  const cuProduse = BRANDURI.filter((b) => b.produse > 0);
  const marci = cuProduse
    .filter((b) => MARCI_ALESE.includes(b.slug))
    .sort((a, b) => b.produse - a.produse);
  if (marci.length === 0) return null;

  return (
    <section className="bg-canvas py-10 sm:py-12 lg:py-14">
      {/* ACELAȘI CORP CA LA CELELALTE SECȚIUNI, din etalonul comun. Corpul se
          calculează în `cqi`, deci are nevoie de `@container` — aici pe toată
          coloana, ca și la „Produse din catalog", altfel cele două ies la
          corpuri diferite.

          Funcția era pusă în `className` fără să fie apelată, deci în HTML
          ajungea `class="function dimensiuneTitluSectiune(plafonPx = 42) {…"`
          — nicio clasă validă, iar titlul rămânea la 16px. */}
      <div
        className="@container coloana"
        style={{ "--dim-titlu": dimensiuneTitluSectiune() } as CSSProperties}
      >
        <h2 className="text-[22px] leading-tight font-bold text-fg sm:text-[length:var(--dim-titlu)]">
          Mărcile din catalog
        </h2>
        {/* SUBTITLUL NUMĂRĂ TOTALUL, NU CE SE VEDE. Câte dale se văd depinde de
            lățimea ferestrei (4, 6 sau 10), deci orice cifră pusă aici ar fi
            fost greșită la două din trei lățimi. Cifra care nu se schimbă e
            câte mărci are catalogul. */}
        <p className="mt-2 text-sm text-muted">
          Cele mai cunoscute dintre cele {marciNumar(cuProduse.length)} din catalogul lunii.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {marci.map((b, i) => (
            <div
              key={b.slug}
              className={`flex-col items-center justify-center gap-3 rounded-card border border-line-strong bg-surface px-4 py-6 ${
                i >= PRAG_LG
                  ? "hidden lg:flex"
                  : i >= PRAG_SM
                    ? "hidden sm:flex"
                    : "flex"
              }`}
            >
              {/*
                `<img>` prin next/image cu înălțime fixă și lățime automată:
                siglele au lățimi foarte diferite la aceeași înălțime — K2 e un
                pătrat, Dyness e un wordmark lung — iar aici contează doar
                înălțimea, ca rândul să arate aliniat.
              */}
              <div className="flex h-8 w-full items-center justify-center">
                <Image
                  src={sigla(b.slug)}
                  alt={b.nume}
                  width={140}
                  height={32}
                  sizes="140px"
                  loading="lazy"
                  className="max-h-8 w-auto max-w-[70%] object-contain"
                />
              </div>
              <span className="text-xs text-faint">{produse(b.produse)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
