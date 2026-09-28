import type { CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Produs } from "@/lib/produs";
import type { Oferta } from "@/lib/oferte";
import { BRANDURI } from "@/lib/branduri";
import { dimensiuneTitluSectiune } from "../stiluri";

/* ══════════════════════════════════════════════════════════════════════════
   PRODUSE, PE FILE
   ──────────────────────────────────────────────────────────────────────────
   O singură secțiune care ține locul a două: „Oferte" e prima filă, iar
   restul sunt categoriile mari.

   ─── DE CE FĂRĂ JAVASCRIPT ───────────────────────────────────────────────

   Filele sunt `<input type="radio">` ascunse plus `<label>`, iar schimbarea
   panoului se face în CSS, cu `:has()` (vezi app/globals.css, „FILE DE
   PRODUSE"). Componenta se randează pe server și nu trimite nicio linie de
   JavaScript în browser.

   Motivul e același pentru care bara de sus a fost mutată pe server: pe fișa
   de produs, firul principal era ocupat 772 ms cu execuție de JS, iar imaginea
   principală aștepta după el.

   Radio plus label e și navigabil de la tastatură din construcție — săgețile
   schimbă fila, fără să scriem noi nimic.

   ─── CE NU E PE CARD ──────────────────────────────────────────────────────

   Fără stele, fără „în stoc", fără rate lunare — le au magazinele de retail,
   dar noi n-avem datele: zero recenzii, iar coloana de stoc e goală la toate
   cele 845 de produse din export.

   Prototipul are o pastilă verde „în stoc" în colțul de sus al cardului.
   Locul ei e luat de sigla mărcii, care e ce avem și ce chiar deosebește două
   produse la fel de mari pe ecran.
   ══════════════════════════════════════════════════════════════════════════ */

/** Forma minimă pe care o afișează cardul. O satisfac și `Produs`, și `Oferta`. */
type Articol = {
  slug?: string;
  sku: string;
  nume: string;
  brand?: string;
  imagine?: { url: string; alt?: string };
  pret?: number;
  pretVolum?: number;
  prag?: string;
  unitate: string;
};

/** Câte produse arată o filă. Cinci intră pe un rând la 1280px. */
const PE_FILA = 5;

/** Câte categorii devin file, pe lângă „Oferte". */
const FILE_CATEGORII = 5;

const euro = (n: number) =>
  n.toLocaleString("ro-RO", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** Numele mărcii → slug-ul siglei colorate din public/branduri/color/. */
const SIGLA = new Map(BRANDURI.map((b) => [b.nume.toLowerCase(), b.slug]));

/* ══════════════════════════════════════════════════════════════════════════
   CARDUL
   ──────────────────────────────────────────────────────────────────────────
   Patru etaje, fiecare cu treaba lui:

     fotografia ... pe alb, cu aer în jur, ca produsul să nu atingă rama
     identitatea .. sigla mărcii, denumirea, codul
     prețul ....... deasupra lui o linie subțire, singurul loc din card unde
                    ochiul trebuie să se oprească
     acțiunea ..... bandă albastră, lată cât cardul

   ─── RAMA ────────────────────────────────────────────────────────────────

   1px `--line` (#e5eaf0), nu umbră. Pe fundal alb, o umbră difuză nu spune
   unde se termină cardul; o linie spune. Cardurile de dinainte aveau
   `border-gray-200` plus o umbră la hover, iar pe alb rama abia se ghicea.

   La hover rama devine albastră ȘI primește un inel de încă 1px în aceeași
   culoare: se îngroașă fără să se miște nimic, cum s-ar întâmpla dacă am
   schimba grosimea bordurii.

   ─── DOUĂ ÎNĂLȚIMI REZERVATE ─────────────────────────────────────────────

   Denumirea are trei rânduri tăiate și `min-h-14`; rândul de sub preț are
   `h-[18px]` chiar și gol. Fără ele, un nume de un rând sau lipsa prețului
   la volum ridică talpa cardului, iar rândul de cinci se vede ca o scară.
   ══════════════════════════════════════════════════════════════════════════ */

function Card({ a }: { a: Articol }) {
  const adresa = a.slug ? `/catalog/produs/${a.slug}` : "/catalog";
  const sigla = a.brand ? SIGLA.get(a.brand.toLowerCase()) : undefined;

  return (
    <Link
      href={adresa}
      className="group flex flex-col overflow-hidden rounded-card border border-line bg-surface transition-[border-color,box-shadow] duration-150 hover:border-avo-600 hover:shadow-[0_0_0_1px_var(--color-avo-600)]"
    >
      {/* Înălțime fixă: altfel cardurile de pe un rând ies de înălțimi
          diferite, după cât de înaltă e fiecare fotografie. Fondul e alb, nu
          gri: pozele din catalog vin pe alb, iar un gri în spate le-ar desena
          un pătrat în jur. */}
      <div className="flex h-44 items-center justify-center bg-surface p-5">
        {a.imagine ? (
          <Image
            src={a.imagine.url}
            alt={a.imagine.alt ?? a.nume}
            width={200}
            height={140}
            sizes="(max-width: 640px) 45vw, 220px"
            loading="lazy"
            className="max-h-full w-auto object-contain transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="text-xs text-faint">Fără imagine</span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4">
        {/* Sigla mărcii, nu numele scris. La aceeași înălțime de 16px, siglele
            se recunosc dintr-o privire; un nume scris cere citit. Cine n-are
            siglă în set primește numele, la același corp. */}
        <div className="mb-1.5 flex h-4 items-center">
          {sigla ? (
            <Image
              src={`/branduri/color/${sigla}.webp`}
              alt={a.brand ?? ""}
              width={96}
              height={16}
              sizes="96px"
              loading="lazy"
              className="h-4 w-auto max-w-24 object-contain object-left"
            />
          ) : a.brand ? (
            <span className="text-[10.5px] font-bold tracking-wider text-faint uppercase">
              {a.brand}
            </span>
          ) : null}
        </div>

        <span className="line-clamp-3 min-h-14 text-[13.6px] leading-[1.38] font-semibold text-fg">
          {a.nume}
        </span>

        <span className="mt-1 mb-2.5 truncate font-mono text-[11.5px] text-faint">{a.sku}</span>

        {/* `mt-auto` ține prețul lipit de talpa cardului, oricât de scurtă ar
            fi denumirea. */}
        <div className="mt-auto border-t border-line-soft pt-2.5">
          {typeof a.pret === "number" && a.pret > 0 ? (
            <>
              <span className="text-[21px] font-extrabold tracking-[-0.03em] text-fg">
                {euro(a.pret)} €
              </span>
              <span className="ml-1 text-[12px] text-muted">/ {a.unitate}</span>
              <div className="h-[18px] text-[11.8px] text-faint">
                {a.pretVolum && a.prag ? `${euro(a.pretVolum)} € de la ${a.prag}` : null}
              </div>
            </>
          ) : (
            <>
              <span className="text-[16px] font-bold text-muted">Preț la cerere</span>
              <div className="h-[18px]" />
            </>
          )}
        </div>

        {/* Nu e un al doilea link — tot cardul e deja unul. E semnul că se
            poate apăsa, pus acolo unde îl caută ochiul într-un magazin. Un
            `<a>` înăuntrul altui `<a>` n-ar fi nici marcaj valid, nici de
            folos cuiva cu cititor de ecran: ar auzi aceeași țintă de două ori. */}
        <span className="mt-3 flex h-10 items-center justify-center rounded-control bg-avo-600 text-[13.5px] font-semibold text-white transition-colors group-hover:bg-avo-700">
          Vezi produsul
        </span>
      </div>
    </Link>
  );
}

export default function ProduseCuFile({
  oferte = [],
  produse = [],
}: {
  oferte?: Oferta[];
  produse?: Produs[];
}) {
  /* Categoriile, ordonate după câte produse au. Cele mici n-ar umple un rând,
     iar o filă cu două carduri arată a greșeală, nu a alegere. */
  const dupaCategorie = new Map<string, { nume: string; slug: string; produse: Produs[] }>();
  for (const p of produse) {
    if (!p.categorie) continue;
    const intrare = dupaCategorie.get(p.categorie.slug) ?? {
      nume: p.categorie.nume,
      slug: p.categorie.slug,
      produse: [],
    };
    intrare.produse.push(p);
    dupaCategorie.set(p.categorie.slug, intrare);
  }

  const file: { eticheta: string; adresa: string; articole: Articol[] }[] = [];

  if (oferte.length) {
    file.push({ eticheta: "Oferte", adresa: "/catalog", articole: oferte.slice(0, PE_FILA) });
  }

  for (const c of [...dupaCategorie.values()]
    .filter((c) => c.produse.length >= PE_FILA)
    .sort((a, b) => b.produse.length - a.produse.length)
    .slice(0, FILE_CATEGORII)) {
    file.push({
      eticheta: c.nume,
      adresa: `/catalog/${c.slug}`,
      articole: c.produse.slice(0, PE_FILA),
    });
  }

  if (file.length === 0) return null;

  return (
    <section className="bg-white py-10 sm:py-14 lg:py-16">
      {/* `file-produse` cuprinde ACUM ȘI CAPUL SECȚIUNII, nu doar panourile:
          etichetele filelor au urcat lângă titlu, iar `:has()` din globals.css
          le caută înăuntrul aceluiași înveliș ca radio-urile. */}
      <div className="coloana file-produse">
        {/* Radio-urile, ascunse. Ele țin starea; CSS-ul citește care e bifat. */}
        {file.map((f, i) => (
          <input
            key={f.eticheta}
            type="radio"
            name="file-produse"
            id={`fila-${i}`}
            defaultChecked={i === 0}
          />
        ))}

        {/* ── Capul secțiunii: titlul la stânga, filele la dreapta ──

            `@container` STĂ PE TOT RÂNDUL, nu pe coloana titlului. Corpul se
            calculează în `cqi`, adică procent din container; pe coloana
            îngustă de lângă file ar fi ieșit ~31px, iar la „Lichidare de stoc"
            și la „Mărcile din catalog" 42px. Trei titluri de secțiune la trei
            corpuri diferite e exact ce trebuia să împiedice etalonul.

            ERA ȘI MAI RĂU ÎNAINTE: funcția era pusă în `className` fără să fie
            apelată, deci în HTML ajungea, literal,
            `class="function dimensiuneTitluSectiune(plafonPx = 42) {…"`.
            Niciun corp de literă nu se aplica, iar titlul rămânea la 16px, cât
            textul din jurul lui. Aceeași greșeală era în Marci.tsx. */}
        <div
          className="@container flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-8"
          style={{ "--dim-titlu": dimensiuneTitluSectiune() } as CSSProperties}
        >
          <div className="min-w-0 flex-1">
            {/* `titlu-sectiune` aduce Archivo în varianta lată, plus greutatea,
                spațierea și interlinia potrivite ei (vezi globals.css).
                Deocamdată e pusă DOAR AICI, ca să se vadă pe un titlu real
                înainte de a trece tot site-ul pe ea. */}
            <h2 className="titlu-sectiune text-[22px] text-fg sm:text-[length:var(--dim-titlu)]">
              Produse din catalog
            </h2>
            <p className="mt-2 max-w-xl text-[14px] text-muted">
              Ofertele lunii și cele mai mari categorii. Prețurile sunt în euro, fără TVA.
            </p>
          </div>

          {/* Filele, ca pastile. `overflow-x-auto` fiindcă pe telefon șase
              etichete nu încap: acolo se trag cu degetul, nu se rup pe două
              rânduri. `shrink-0` pe grup, ca titlul să cedeze lățime primul. */}
          <div className="fara-bara-derulare -mx-4 overflow-x-auto px-4 lg:mx-0 lg:shrink-0 lg:px-0">
            <div className="inline-flex gap-1.5 rounded-full bg-sunken p-1">
              {file.map((f, i) => (
                <label
                  key={f.eticheta}
                  htmlFor={`fila-${i}`}
                  className="shrink-0 cursor-pointer rounded-full px-4 py-2 text-[13.2px] font-semibold whitespace-nowrap text-muted transition-colors hover:text-fg"
                >
                  {f.eticheta}
                </label>
              ))}
            </div>
          </div>
        </div>

        {file.map((f, i) => (
          <div key={f.eticheta} data-fila={i} className="pt-7">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
              {f.articole.map((a) => (
                <Card key={a.sku} a={a} />
              ))}
            </div>

            <div className="mt-6">
              <Link
                href={f.adresa}
                className="inline-flex h-11 items-center rounded-control border border-line px-5 text-sm font-semibold text-fg transition-colors hover:border-avo-600 hover:text-avo-600"
              >
                Vezi tot {f.eticheta.toLowerCase()}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
