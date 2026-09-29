import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FIRMA } from "@/lib/site";
import { dimensiuneTitluSectiune } from "../stiluri";

/* ══════════════════════════════════════════════════════════════════════════
   CUM COMANZI — cei patru pași
   ──────────────────────────────────────────────────────────────────────────
   Prima pagină spunea CE se vinde și LA CE PREȚ, dar nu spunea niciodată cum se
   cumpără. Iar coșul e blocat intenționat cât timp magazinul e amânat, deci
   drumul spre comandă nu e un buton, e un proces — și procesul ăsta era scris
   nicăieri. Un instalator care vrea douăzeci de invertoare nu avea de unde să
   afle ce se întâmplă după ce se uită la carduri.

   ─── NIMIC DE AICI NU E INVENTAT ─────────────────────────────────────────

   Fiecare pas repetă ceva ce site-ul promite deja în altă parte:

     1. prețul de catalog și a doua coloană de preț ... ConditiiB2B
     2. formularul deschide e-mailul gata scris ....... FormularOferta.tsx
     3. „prețul aplicabil cantității cerute și
        disponibilitatea din acel moment" ............. /cerere-oferta, cuvânt
                                                        cu cuvânt
     4. transportul se stabilește la ofertă ........... formularul cere „loc de
                                                        livrare"; adresa de
                                                        transport e în site.ts

   ─── CE NU SCRIE, DEȘI AR FI FOST FRUMOS ─────────────────────────────────

   Niciun termen de livrare, niciun „în stoc", nicio garanție. Nu le avem:
   coloana de stoc e goală la toate cele 845 de produse din export, iar despre
   termene și garanții nu ne-a confirmat nimeni nimic. Pasul patru spune ce se
   stabilește la ofertă, nu ce promitem înainte de ea — un pas care ar minți
   aici s-ar afla la prima comandă.

   ─── DE CE PATRU, ȘI DE CE ULTIMUL NU E O LIVRARE ────────────────────────

   Trei pași s-ar fi oprit la „primești oferta", adică exact înainte de
   întrebarea pe care o are omul: și pe urmă? Al patrulea închide bucla fără să
   promită nimic: confirmi, iar transportul și termenul se stabilesc atunci.
   ══════════════════════════════════════════════════════════════════════════ */

type Pas = {
  titlu: string;
  text: string;
  link?: { text: string; adresa: string };
};

const PASI: Pas[] = [
  {
    titlu: "Alegi din catalog",
    text:
      "Fiecare produs are prețul de catalog pe fișa lui, în euro, fără TVA. " +
      "A doua coloană de preț arată cât costă de la pragul de cantitate.",
    link: { text: "Deschide catalogul", adresa: "/catalog" },
  },
  {
    titlu: "Trimiți cererea",
    text:
      "Scrii codurile și cantitățile, datele firmei și o persoană de contact. " +
      "Formularul îți deschide e-mailul cu mesajul gata scris.",
    link: { text: "Cere ofertă", adresa: "/cerere-oferta" },
  },
  {
    titlu: "Primești oferta",
    text:
      "Prețul aplicabil cantității cerute și disponibilitatea din acel moment. " +
      "Dacă ești partener înregistrat, reducerea de statut se aplică peste.",
    link: { text: "Condițiile de partener", adresa: "#conditii-b2b" },
  },
  {
    titlu: "Confirmi comanda",
    text:
      "Transportul și termenul se stabilesc odată cu oferta — scrie locul de " +
      "livrare în cerere. Pentru transport răspundem și direct pe e-mail.",
    link: { text: FIRMA.emailTransport, adresa: `mailto:${FIRMA.emailTransport}` },
  },
];

export default function CumComanzi() {
  return (
    /* `bg-canvas`, fiindcă deasupra e lichidarea pe alb și dedesubt condițiile
       B2B pe închis: secțiunile alternează, ca să se vadă unde se termină una. */
    <section className="bg-canvas py-10 sm:py-12 lg:py-14">
      {/* `@container` pe toată coloana, ca la celelalte secțiuni: corpul
          titlului se calculează în `cqi`, iar pe un container mai îngust ar fi
          ieșit alt corp decât la „Produse din catalog". */}
      <div
        className="@container coloana"
        style={{ "--dim-titlu": dimensiuneTitluSectiune() } as CSSProperties}
      >
        <h2 className="text-[22px] leading-tight font-bold text-fg sm:text-[length:var(--dim-titlu)]">
          Cum comanzi
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Nu există coș: comanda se face prin ofertă, fiindcă prețul depinde de
          cantitate și de statutul de partener. Patru pași.
        </p>

        {/* Patru coloane la `lg`, două la `sm`, una pe telefon — aceeași scară
            ca la grilele de carduri din site.

            ─── DECALAJUL ȘI SĂGEȚILE ───────────────────────────────────────

            La `lg`, cardurile pare coboară cu 40px, iar între ele se desenează
            trei săgeți curbe. Motivul nu e decorativ: patru cartonașe egale,
            aliniate perfect, cu cifră în pătrat și două rânduri de gri, sunt cel
            mai copiat tipar de pe internet — se citesc ca șablon oricât de bun
            ar fi textul. Ritmul inegal și legătura desenată spun că cineva a
            așezat pașii, nu că i-a scos dintr-o rețetă.

            NUMAI DE LA `lg`. Sub ea cardurile stau unul sub altul sau două pe
            rând, iar un decalaj pe verticală n-ar mai însemna nimic — ar fi doar
            un card împins aiurea în jos. Săgețile se ascund și ele: între două
            carduri suprapuse pe verticală, o săgeată care merge spre dreapta ar
            arăta în gol.

            `items-start` e obligatoriu: fără el, grila întinde toate cardurile
            la înălțimea celui mai înalt, iar `mt-10` nu mai decalează nimic —
            cardul ar crește în jos în loc să coboare. */}
        <ol className="relative mt-6 grid grid-cols-1 items-start gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-6">
          {/* Săgețile, desenate peste grilă. `aria-hidden`: ordinea pașilor e
              deja spusă de `<ol>`, iar un cititor de ecran n-are ce face cu trei
              curbe. Stau la 25%, 50% și 75% din lățimea rândului, adică exact în
              golurile dintre cele patru coloane egale. */}
          {[0, 1, 2].map((n) => (
            <span
              key={n}
              aria-hidden
              className={`sageata-pas pointer-events-none absolute top-8 hidden -translate-x-1/2 lg:block ${
                n === 0 ? "left-1/4" : n === 1 ? "left-1/2" : "left-3/4"
              } ${n === 1 ? "-scale-y-100" : ""}`}
            >
              <svg width="56" height="34" viewBox="0 0 56 34" fill="none" aria-hidden>
                {/* Un singur traseu, cu vârful inclus: așa se desenează și el la
                    final, nu apare dintr-odată peste o linie pe jumătate trasă.
                    `pathLength="1"` normalizează lungimea, deci animația din
                    globals.css n-are nevoie să știe cât e de lungă curba. */}
                <path
                  pathLength="1"
                  d="M4 8 C 18 8, 24 26, 40 26 M34 20 L41 26 L34 31"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          ))}

          {PASI.map((p, i) => (
            <li
              key={p.titlu}
              className={`flex flex-col rounded-card border border-line-strong bg-surface p-5 ${
                i % 2 === 1 ? "lg:mt-10" : ""
              }`}
            >
              {/* Cifra pasului. Pătrat cu colț rotunjit, nu cerc: cercul ar fi
                  fost al cincilea fel de colț din pagină, iar `rounded-control`
                  e treapta pe care o poartă deja butoanele. */}
              <span
                aria-hidden
                className="mb-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-avo-600 text-[15px] font-extrabold text-white"
              >
                {i + 1}
              </span>

              <h3 className="text-[15px] font-bold text-fg">{p.titlu}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{p.text}</p>

              {/* `mt-auto` lipește linkul de fundul cardului, oricât de scurt ar
                  fi textul de deasupra: cele patru cad pe aceeași linie. */}
              {p.link ? (
                <Link
                  href={p.link.adresa}
                  className="group mt-auto inline-flex items-center gap-1.5 pt-4 text-[13.5px] font-semibold text-avo-600 transition-colors hover:text-avo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-avo-600"
                >
                  {p.link.text}
                  <ArrowRight
                    size={15}
                    aria-hidden
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </Link>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
