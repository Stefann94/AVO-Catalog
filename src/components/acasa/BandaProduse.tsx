import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { dimensiuneTitluSectiune } from "../stiluri";
import CardProdus, { type ArticolCard } from "../CardProdus";

/* ══════════════════════════════════════════════════════════════════════════
   SECȚIUNE DE PRODUSE PE DOUĂ RÂNDURI
   ──────────────────────────────────────────────────────────────────────────
   Forma comună a secțiunilor „Preț mai bun la volum" și „Oferte la container".
   Amândouă au exact aceeași anatomie — titlu, descriere, grilă, link și notă de
   subsol — și diferă doar prin text și prin regula după care își aleg
   produsele. Regula stă în componenta care cheamă, forma stă aici.

   NU E O ABSTRACȚIE PESTE SECȚIUNILE CARE EXISTĂ DEJA. „Produse din catalog"
   are file, „Lichidare de stoc" are ștampila cu perioada și bandă derulabilă;
   nici una nu încape în forma asta fără să i se adauge o opțiune care ar folosi
   o singură dată.

   ─── GRILĂ, NU BANDĂ DERULABILĂ ─────────────────────────────────────────

   Cerut explicit: aici nu sunt săgeți și nu se derulează nimic. Se văd zece
   produse odată — cinci pe rând, două rânduri — și atât.

   Diferența față de benzile de deasupra e intenționată, nu o scăpare de
   consecvență. O bandă cu săgeți spune „lista continuă, umblă prin ea"; astea
   două nu sunt liste de răsfoit, sunt o selecție închisă. Ce urmează după ele
   e linkul din subsol, nu încă un card.

   De-aia lipsesc și `data-banda`, și `data-pista`: nu sunt doar nefolosite,
   prezența lor ar fi pus săgețile din capul altei secțiuni să caute o pistă
   aici (vezi SagetiBanda.tsx, care urcă până la cel mai apropiat `data-banda`).

   ─── CINCI PE RÂND DOAR DE LA `xl`, ȘI O TREAPTĂ LA FIECARE PAS ────

   La 1440, coloana are 1376px: cinci carduri de 262 plus patru spații de 16
   fac 1374. Exact lățimea cardului din toate celelalte grile ale site-ului,
   deci pragurile de corp ale denumirii (vezi CardProdus.tsx) rămân valabile.

   REPERUL E 226px, cea mai îngustă cutie pentru care s-a măsurat că textul
   încape. Sub el, denumirile cad pe treapta cea mai mică pe toată grila.
   Scara e aleasă ca fiecare treaptă să stea peste reper:

     de la 1280 (`xl`) ... 5 coloane ... 230px la 1280, 262 la 1440, 342 la 1840
     1024–1279  (`lg`) ... 4 coloane ... 228px la 1024, 268 la 1180
      768–1023  (`md`) ... 3 coloane ... 229px la 768,  309 la 1024
      sub 768 ............. 2 coloane ... ca pe pagina de categorie

   TREAPTA DE PATRU A FOST ADĂUGATĂ DUPĂ O MĂSURĂTOARE. Fără ea, grila sărea
   de la cinci carduri de 262px la 1280 direct la trei de 361px la 1180 —
   adică, strângând fereastra cu o sută de pixeli, cardurile se făceau mai
   MARI cu o sută. Saltul se vedea ca o schimbare de pagină, nu de lățime.

   Două rânduri e forma de la `xl` în sus; mai jos, cele zece produse ocupă
   trei, patru sau cinci rânduri, după câte coloane încap.   ══════════════════════════════════════════════════════════════════════════ */

/** Câte produse arată o secțiune: cinci pe rând, două rânduri. */
export const PE_SECTIUNE = 10;

export default function BandaProduse({
  titlu,
  descriere,
  articole,
  nota,
  link,
  fundal = "bg-white",
  stampila,
}: {
  titlu: string;
  descriere: ReactNode;
  articole: ArticolCard[];
  nota?: ReactNode;
  link?: { text: string; adresa: string };
  /** Fondul secțiunii. Secțiunile alternează alb / `canvas`. */
  fundal?: string;
  /** Ștampila din dreapta titlului. Opțională. */
  stampila?: ReactNode;
}) {
  // Fără produse nu există secțiune. Un titlu peste o grilă goală anunță ceva
  // ce nu livrează — aceeași regulă ca la „Lichidare de stoc".
  const lista = articole.slice(0, PE_SECTIUNE);
  if (lista.length === 0) return null;

  return (
    <section className={`${fundal} py-10 sm:py-12 lg:py-14`}>
      <div className="coloana">
        {/* ── Capul secțiunii ── */}
        <div className="mb-5 sm:mb-10 lg:mb-12">
          <div className="flex flex-col gap-3 sm:gap-4 xl:flex-row xl:items-center xl:justify-between xl:gap-6">
            <div
              className="@container min-w-0 flex-1"
              /* Corpul vine din etalonul comun, nu din lungimea titlului ăstuia
                 — vezi `dimensiuneTitluSectiune` în components/stiluri.ts. Fără
                 el, un titlu scurt ar ieși mai mare decât vecinii lui. */
              style={{ "--dim-titlu": dimensiuneTitluSectiune() } as CSSProperties}
            >
              <h2 className="text-[22px] leading-tight font-bold text-gray-900 sm:text-[length:var(--dim-titlu)] sm:whitespace-nowrap">
                {titlu}
              </h2>
            </div>

            {stampila ? (
              <div className="flex shrink-0 items-center gap-3 self-start xl:self-auto">
                {stampila}
              </div>
            ) : null}
          </div>

          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-gray-500 sm:text-[14px]">
            {descriere}
          </p>

          <div aria-hidden className="mt-4 h-px w-full bg-gray-200 sm:mt-7" />
        </div>

        {/* ── Grila ──
            `items-stretch` implicit al grilei plus `h-full` de pe card fac ca
            toate cardurile unui rând să aibă aceeași înălțime, chiar dacă unul
            are denumirea pe un rând și altul pe două. */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {lista.map((a) => (
            <CardProdus key={a.sku ?? a.slug} a={a} />
          ))}
        </div>

        {/* ── Subsolul ──
            Linkul la stânga, nota dedesubt. Aceeași așezare ca la „Produse din
            catalog": legătura spre listă în stânga jos, sub produse. */}
        {link || nota ? (
          <div className="mt-5 sm:mt-8">
            {link ? (
              <Link
                href={link.adresa}
                className="group inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-avo-600 transition-colors hover:text-avo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-avo-600"
              >
                {link.text}
                <ArrowRight
                  size={15}
                  aria-hidden
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </Link>
            ) : null}
            {nota ? (
              <p className="mt-3 max-w-2xl text-[11px] leading-relaxed text-gray-500 sm:text-xs">
                {nota}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
