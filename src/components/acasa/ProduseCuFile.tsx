import type { CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShoppingCart } from "lucide-react";
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
   RÂNDUL DE OFERTE, COMPLETAT PÂNĂ LA CINCI
   ──────────────────────────────────────────────────────────────────────────
   Filele de categorie au întotdeauna cinci carduri: categoriile cu mai puțin
   de atâtea produse nici nu devin file. Fila „Oferte" n-avea cum să respecte
   regula — ea arată strict ce a pus furnizorul pe coperta catalogului, iar
   luna asta acolo sunt PATRU produse. Într-o grilă de cinci coloane, al
   cincilea loc rămânea gol și se citea ca un card care nu s-a încărcat.

   Golul se umple din catalog, pe o cascadă care ia întâi ce seamănă cel mai
   bine cu o ofertă:

     1. produsele marcate `oferta` în WooCommerce și neajunse în lista de pe
        copertă (`GET_OFERTE_QUERY` cere doar `featured`; steagul de pe produs
        e aceeași informație, citită din altă parte)
     2. produsele cu preț la volum — a doua coloană de preț din catalog. Nu e
        o promoție, dar e singurul avantaj de preț real pe care îl avem
     3. orice produs, ca să nu rămână golul

   NU INVENTEAZĂ NIMIC. Produsele completate sunt produse reale din catalog,
   arătate cu prețul lor real. Ce se pierde e strict înțelesul strict al filei:
   al cincilea card nu e neapărat de pe copertă. De-aia completarea e ultima
   soluție și pornește doar când lista scurtă chiar e scurtă — dacă furnizorul
   pune cinci sau mai multe pe copertă, funcția nu face nimic.
   ══════════════════════════════════════════════════════════════════════════ */
function completeazaRandul(alese: Articol[], produse: Produs[]): Articol[] {
  if (alese.length >= PE_FILA) return alese;

  const rand = [...alese];
  const luate = new Set(rand.map((a) => a.sku).filter(Boolean));

  const adauga = (candidati: Produs[]) => {
    for (const p of candidati) {
      if (rand.length >= PE_FILA) return;
      if (!p.sku || luate.has(p.sku)) continue;
      luate.add(p.sku);
      rand.push(p);
    }
  };

  adauga(produse.filter((p) => p.oferta));
  adauga(produse.filter((p) => typeof p.pretVolum === "number" && p.pretVolum > 0));
  adauga(produse);

  return rand;
}

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
    /* `<article>`, nu `<Link>`, de când cardul are DOUĂ acțiuni: deschide
       produsul și pune în coș. Un `<a>` înăuntrul altui `<a>` nu e marcaj
       valid, iar browserele îl repară imprevizibil.

       Cardul rămâne apăsabil pe toată suprafața prin linkul de pe denumire,
       care își întinde zona de clic cu `after:absolute after:inset-0`. Butonul
       de coș stă peste el, cu `relative z-10`. Pentru un cititor de ecran sunt
       două linkuri cu nume diferite, exact cât trebuie — nu unul singur, spus
       de două ori. */
    /* `card-produs` aduce rama de la hover — halou, contur albastru și un fileu
       de 1px pe interior, fără să miște cardul din loc. E în globals.css, lângă
       explicație: acolo încap și `:focus-within`, și pseudoelementul care
       desenează fileul peste fondul alb al casetei de poză. */
    <article className="card-produs group relative flex flex-col overflow-hidden rounded-card border border-[#dfe5ee] bg-surface shadow-[0_1px_2px_rgb(16_24_40/0.04)]">
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

        {/* Linkul care face tot cardul apăsabil. `after:inset-0` îi întinde
            zona de clic peste `<article>`, care e `relative`. */}
        <Link
          href={adresa}
          className="line-clamp-3 min-h-14 text-[13.6px] leading-[1.38] font-semibold text-fg after:absolute after:inset-0 focus-visible:outline-none"
        >
          {a.nume}
        </Link>

        <span className="mt-1 mb-2.5 truncate font-mono text-[11.5px] text-faint">{a.sku}</span>

        {/* ── Talpa: prețul la stânga, coșul la dreapta ──
            `mt-auto` o ține lipită de fundul cardului, oricât de scurtă ar fi
            denumirea. `items-end` aliniază butonul cu ultimul rând de preț, nu
            cu primul — altfel, pe cardurile fără preț la volum, butonul s-ar
            ridica cu 18px față de vecinii lui. */}
        {/* `group-hover:border-avo-600/25` duce rama de la hover și în interiorul
            cardului. Fără ea, tot efectul stă pe contur și mijlocul cardului nu
            reacționează deloc. */}
        <div className="mt-auto flex items-end justify-between gap-2 border-t border-line-soft pt-3 transition-colors duration-150 group-hover:border-avo-600/25">
          <div className="min-w-0">
            {typeof a.pret === "number" && a.pret > 0 ? (
              <>
                <div className="truncate">
                  <span className="text-[21px] font-extrabold tracking-[-0.03em] text-fg">
                    {euro(a.pret)} €
                  </span>
                  <span className="ml-1 text-[12px] text-muted">/ {a.unitate}</span>
                </div>
                {/* Înălțime rezervată și când e gol: fără ea, cardurile cu preț
                    la volum sunt cu 18px mai înalte decât celelalte. */}
                <div className="h-[18px] truncate text-[11.8px] text-faint">
                  {a.pretVolum && a.prag ? `${euro(a.pretVolum)} € de la ${a.prag}` : null}
                </div>
              </>
            ) : (
              <>
                <div className="text-[16px] font-bold text-muted">Preț la cerere</div>
                <div className="h-[18px]" />
              </>
            )}
          </div>

          {/* ── Butonul de coș ──
              `relative z-10` îl scoate de sub zona de clic a denumirii; fără
              el, apăsarea ar deschide produsul, nu ar adăuga în coș.

              NU EXISTĂ COȘ ÎNCĂ — magazinul e amânat. Până se deschide, duce
              la cererea de ofertă, singura acțiune care chiar se poate duce la
              capăt. Când apare coșul, se schimbă `href`-ul și atât.

              `aria-label` cu numele produsului: într-o grilă de cinci carduri,
              cinci butoane numite toate „Adaugă în coș" sunt de nefolosit la
              cititorul de ecran. */}
          <Link
            href="/cerere-oferta"
            aria-label={`Cere ofertă pentru ${a.nume}`}
            className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-avo-600 text-white transition-colors hover:bg-avo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-avo-600"
          >
            <ShoppingCart size={18} aria-hidden />
          </Link>
        </div>
      </div>
    </article>
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

  /* `actiune` e textul de pe butonul din josul filei. E scris de mână, nu
     compus din etichetă: „Vezi tot " + eticheta dădea „Vezi tot oferte" și
     „Vezi tot sisteme de montaj", adică dezacord la fiecare filă. */
  const file: { eticheta: string; adresa: string; actiune: string; articole: Articol[] }[] = [];

  if (oferte.length) {
    file.push({
      eticheta: "Oferte",
      adresa: "/catalog",
      actiune: "Vezi toate ofertele",
      articole: completeazaRandul(oferte.slice(0, PE_FILA), produse),
    });
  }

  for (const c of [...dupaCategorie.values()]
    .filter((c) => c.produse.length >= PE_FILA)
    .sort((a, b) => b.produse.length - a.produse.length)
    .slice(0, FILE_CATEGORII)) {
    file.push({
      eticheta: c.nume,
      adresa: `/catalog/${c.slug}`,
      actiune: `Vezi toate produsele din ${c.nume}`,
      articole: c.produse.slice(0, PE_FILA),
    });
  }

  if (file.length === 0) return null;

  return (
    /* FONDUL SECȚIUNII E DESCHIS, NU ALB. Cardurile sunt albe: pe alb, singurul
       lucru care le desparte de pagină e rama de 1px, iar grila se citea ca o
       listă de text cu linii, nu ca un rând de obiecte. Pe `--canvas` (#f7f9fc)
       cardurile ies în față fără să fie nevoie de umbre mari.

       Fotografia dinăuntrul cardului rămâne pe alb — acolo contrastul trebuie
       să fie invers, ca produsul să nu pară lipit pe un fond gri. */
    <section className="bg-canvas py-10 sm:py-14 lg:py-16">
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

        {/* ── Capul secțiunii: titlul sus, filele pe rândul de sub el ──

            FILELE AU COBORÂT PE RÂNDUL LOR. Stăteau la dreapta titlului, și
            mergea cât erau mici. La corpul de acum (14,5px, `px-5`) pilula
            ocupă 968px din cei 1376 ai coloanei, iar titlului îi rămâneau 376 —
            „Produse din catalog" la 42px se rupea pe două rânduri la 1440 și pe
            trei la 1280. Măsurat, nu presupus.

            Pe rândul lui, titlul stă pe o linie, iar pilula are toată lățimea.

            `@container` STĂ PE TOT ÎNVELIȘUL. Corpul titlului se calculează în
            `cqi`, adică procent din container; pe o coloană îngustă ar fi ieșit
            ~31px, iar la „Lichidare de stoc" și la „Mărcile din catalog" 42px.
            Trei titluri de secțiune la trei corpuri diferite e exact ce trebuia
            să împiedice etalonul.

            ERA ȘI MAI RĂU ÎNAINTE: funcția era pusă în `className` fără să fie
            apelată, deci în HTML ajungea, literal,
            `class="function dimensiuneTitluSectiune(plafonPx = 42) {…"`.
            Niciun corp de literă nu se aplica, iar titlul rămânea la 16px, cât
            textul din jurul lui. Aceeași greșeală era în Marci.tsx. */}
        <div
          className="@container"
          style={{ "--dim-titlu": dimensiuneTitluSectiune() } as CSSProperties}
        >
          <div className="min-w-0">
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

          {/* Filele, într-o pilulă. `overflow-x-auto` fiindcă pe telefon șase
              etichete nu încap: acolo se trag cu degetul, nu se rup pe două
              rânduri.

              `relative` pe etichetă e pentru bara de 3px de sub fila deschisă:
              se desenează cu `::after`, din globals.css, și are nevoie de un
              părinte poziționat. `pb-4` îi face loc — fără el, bara ar sta
              lipită de textul de deasupra. */}
          <div className="fara-bara-derulare -mx-4 mt-6 overflow-x-auto px-4 py-1 lg:mx-0 lg:px-0">
            {/* RAMA E `line-strong`, NU `line`. Pe fondul secțiunii (#f7f9fc),
                #e5eaf0 dădea patru puncte de luminozitate — bara arăta ca niște
                cuvinte lăsate pe pagină. Umbra joasă și foarte întinsă
                (`-18px` răspândire negativă) o ridică un milimetru de pe fond,
                cât să se citească drept obiect, fără să pară că plutește. */}
            <div className="inline-flex gap-0.5 rounded-full border border-line-strong bg-surface p-1.5 shadow-[0_1px_2px_rgb(16_24_40/0.04),0_10px_24px_-18px_rgb(16_24_40/0.45)]">
              {file.map((f, i) => (
                <label
                  key={f.eticheta}
                  htmlFor={`fila-${i}`}
                  className="relative shrink-0 cursor-pointer rounded-full px-5 pt-3 pb-4 text-[14.5px] font-semibold whitespace-nowrap text-muted transition-colors hover:bg-avo-50 hover:text-fg"
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

            {/* ── Butonul de închidere a filei ──

                CENTRAT, NU LA STÂNGA. Stătea aliniat cu prima coloană a grilei,
                iar sub cinci carduri egale arăta ca un card care n-a încăput.
                În centru se citește ca sfârșitul secțiunii.

                Aceeași ramă `line-strong` ca bara de file: sunt singurele două
                comenzi din secțiune, deci trebuie să fie din aceeași familie.

                SĂGEATA ALUNECĂ 2px la hover, nu butonul. Mișcarea arată direcția
                („mergi mai departe"), dar fiindcă e a unui element de 17px
                dinăuntru, nu urnește nimic din așezare. */}
            <div className="mt-8 flex justify-center">
              <Link
                href={f.adresa}
                className="group inline-flex h-12 items-center gap-2.5 rounded-control border border-line-strong bg-surface px-7 text-[14.5px] font-semibold text-fg shadow-[0_1px_2px_rgb(16_24_40/0.04)] transition-colors hover:border-avo-600 hover:bg-avo-50 hover:text-avo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-avo-600"
              >
                {f.actiune}
                <ArrowRight
                  size={17}
                  aria-hidden
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
