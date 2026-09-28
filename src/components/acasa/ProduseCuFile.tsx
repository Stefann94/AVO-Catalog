import type { CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShoppingCart } from "lucide-react";
import type { Produs } from "@/lib/produs";
import type { Oferta } from "@/lib/oferte";
import { gasesteBrand } from "@/lib/branduri";
import { dimensiuneTitluSectiune } from "../stiluri";
import SagetiFile from "./SagetiFile";

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

/**
 * Câte produse intră în banda unei file.
 *
 * DE CE 12, CÂND SE VĂD 5. Filele sunt benzi derulabile, nu rânduri: cele cinci
 * carduri de pe ecran sunt o fereastră, nu tot conținutul. 12 înseamnă puțin
 * peste două ferestre — destul cât săgețile să aibă ce face, destul de puțin cât
 * fila să rămână un rezumat al categoriei, nu categoria însăși. Pentru ea există
 * butonul din dreapta jos.
 */
const PE_BANDA = 12;

/**
 * Câte carduri se văd deodată, și minimul ca o categorie să merite o filă.
 *
 * Aceeași cifră pentru două lucruri, fiindcă sunt același lucru: o filă care
 * n-ar umple măcar fereastra ar arăta a greșeală, nu a alegere.
 */
const PE_RAND = 5;

/** Câte categorii devin file, pe lângă „Oferte". */
const FILE_CATEGORII = 5;

const euro = (n: number) =>
  n.toLocaleString("ro-RO", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/* Sigla mărcii se caută cu `gasesteBrand`, nu cu o hartă proprie.

   AICI A FOST O HARTĂ `nume → slug`, cheiată după numele din lista noastră de
   branduri, iar pe FELICITY se vedea defectul: în listă marca e „Felicity
   Solar", pe produs scrie „FELICITY", deci cheia nu se potrivea și cardul cădea
   pe varianta de rezervă — numele scris cu majuscule, lângă patru siglei.

   Sigla exista în proiect tot timpul (`public/branduri/color/felicity.webp`);
   nu se ajungea la ea.

   `gasesteBrand` din lib/branduri.ts face exact potrivirea asta, pe trei
   încercări în ordinea încrederii: nume identic, slug identic, apoi unul prefix
   al celuilalt. Rezolvă și „Staubli" pe produs vs „Stäubli" în listă. E deja
   folosită pe fișa de produs, în meniul de categorii și în hero-ul de catalog —
   cardul de pe prima pagină era singurul cu rețeta lui. */

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
  if (alese.length >= PE_RAND) return alese;

  const rand = [...alese];
  const luate = new Set(rand.map((a) => a.sku).filter(Boolean));

  const adauga = (candidati: Produs[]) => {
    for (const p of candidati) {
      if (rand.length >= PE_RAND) return;
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
   TREI ETAJE, DESPĂRȚITE DE DOUĂ LINII care merg de la o margine la cealaltă:

     fotografia ... pe alb, cu aer în jur, ca produsul să nu atingă rama.
                    144px sub `sm`, 176 peste
     ─────────────
     identitatea .. sigla mărcii, denumirea, codul. Etajul care se întinde:
                    `flex-1` îi dă toată înălțimea rămasă
     ─────────────
     talpa ........ prețul la stânga, coșul la dreapta

   Cele două linii sunt frați, nu copii ai zonei din mijloc: dacă ar sta
   înăuntrul unei zone cu padding, s-ar opri la 16px de margine și s-ar citi ca
   o subliniere, nu ca o despărțire.

   ─── UNDE SE ADUNĂ SPAȚIUL CARE PRISOSEȘTE ───────────────────────────────

   Cardurile dintr-o bandă au toate înălțimea celui mai înalt, deci unele au
   spațiu în plus de pus undeva. Se pune la capătul de jos al etajului din
   mijloc, chiar deasupra liniei tălpii — singurul loc din card unde un gol nu
   desparte două informații care țin împreună.

   A FOST ALTFEL, ȘI SE VEDEA. Denumirea avea `min-h-14`, adică loc rezervat
   pentru trei rânduri chiar când avea unul: pe „Deye SE-F16 C" rămâneau 37px de
   nimic ÎNTRE denumire și cod. Două informații despre același produs, despărțite
   de un gol cât un rând de text.

   ─── RAMA ────────────────────────────────────────────────────────────────

   1px `--line-strong` (#cbd6e4), nu umbră. Pe fundal alb, o umbră difuză nu
   spune unde se termină cardul; o linie spune.

   A FOST #dfe5ee, ȘI ERA PREA PUȚIN. Pe fondul secțiunii (#f7f9fc) rămâneau vreo
   șase puncte de luminozitate: cardul se ghicea, nu se vedea, iar rândul de cinci
   arăta ca text așezat pe pagină, nu ca cinci obiecte. #cbd6e4 dă vreo
   paisprezece — o linie care se citește de la distanță, fără să devină chenar.

   E ACEEAȘI RAMĂ CA A COMENZILOR din secțiune: bara de file, butonul „Vezi toate
   produsele", săgețile. În site, 1px de #cbd6e4 înseamnă „obiect", indiferent
   dacă obiectul e un card sau un buton.

   La hover rama devine albastră și primește un halou de 3px: se întărește fără
   să se miște nimic, cum s-ar întâmpla dacă am schimba grosimea bordurii.

   ─── CE A RĂMAS REZERVAT, ȘI DE CE ───────────────────────────────────────

   Două înălțimi, amândouă în interiorul unui etaj, nu între etaje:

     sigla ......... `h-4` chiar când produsul n-are siglă în set. Fără ea,
                     cardurile fără siglă își ridică denumirea cu 16px
     prețul volum .. `h-[18px]` chiar și gol. Talpa trebuie să aibă aceeași
                     înălțime la toate cardurile, ca linia de deasupra ei să
                     cadă pe aceeași poziție pe tot rândul

   Rezervarea de pe denumire a fost scoasă: acolo golul cădea între două
   informații, nu la capătul unui etaj.
   ══════════════════════════════════════════════════════════════════════════ */

function Card({ a }: { a: Articol }) {
  const adresa = a.slug ? `/catalog/produs/${a.slug}` : "/catalog";
  const sigla = gasesteBrand(a.brand)?.slug;

  return (
    /* `<article>`, nu `<Link>`, de când cardul are DOUĂ acțiuni: deschide
       produsul și pune în coș. Un `<a>` înăuntrul altui `<a>` nu e marcaj
       valid, iar browserele îl repară imprevizibil.

       Cardul rămâne apăsabil pe toată suprafața prin linkul de pe denumire,
       care își întinde zona de clic cu `after:absolute after:inset-0`. Butonul
       de coș stă peste el, cu `relative z-10`. Pentru un cititor de ecran sunt
       două linkuri cu nume diferite, exact cât trebuie — nu unul singur, spus
       de două ori. */
    /* `card-produs` aduce rama de la hover — contur albastru și halou, fără să
       miște cardul din loc. E în globals.css, lângă explicație.

       `h-full` E OBLIGATORIU, nu decor. Cardurile stau într-o bandă `flex`, deci
       învelișurile lor se întind toate la înălțimea celui mai înalt. Fără
       `h-full`, articolul dinăuntru rămâne cât îi cere conținutul și talpa lui
       nu mai cade pe aceeași linie cu a vecinilor. Cu el, articolul umple
       învelișul, iar zona din mijloc (`flex-1`) înghite diferența. */
    <article className="card-produs group relative flex h-full flex-col overflow-hidden rounded-card border border-line-strong bg-surface shadow-[0_1px_2px_rgb(16_24_40/0.04)]">
      {/* ── 1. Fotografia ──
          Închisă cu o linie proprie, ca să se vadă unde se termină. Fondul e
          alb, nu gri: pozele din catalog vin decupate pe alb, iar un gri în
          spate le-ar desena un pătrat în jur.

          ÎNĂLȚIMEA E RESPONSIVĂ. Era 176px fix la orice lățime, iar pe telefon,
          unde cardul are vreo 145px, poza ieșea mai înaltă decât lată — o
          fotografie mică pierdută într-o casetă lungă. Acum 144 sub `sm`, 176
          peste. */}
      <div className="flex h-36 items-center justify-center border-b border-line bg-surface p-4 transition-colors duration-150 group-hover:border-avo-600/25 sm:h-44 sm:p-5">
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

      {/* ── 2. Identitatea: marca, denumirea, codul ──

          AICI A FOST GOLUL. Denumirea avea `min-h-14`, adică loc rezervat pentru
          trei rânduri chiar când avea unul singur. Pe „Deye SE-F16 C" rămâneau
          37px de nimic între denumire și cod, iar cele două se citeau ca două
          informații fără legătură.

          Rezervarea a plecat cu totul. Codul stă acum imediat sub denumire,
          indiferent de câte rânduri are ea, iar spațiul care prisosește se adună
          într-un singur loc — jos, deasupra liniei tălpii, unde nu desparte
          nimic. Asta face `flex-1`. */}
      <div className="flex flex-1 flex-col px-4 pt-3 pb-3">
        {/* Sigla mărcii, nu numele scris. La aceeași înălțime de 16px, siglele
            se recunosc dintr-o privire; un nume scris cere citit. Cine n-are
            siglă în set primește numele, la același corp. Înălțimea rămâne
            rezervată: fără ea, cardurile fără siglă își ridică denumirea cu
            16px față de vecini. */}
        <div className="mb-2 flex h-4 items-center">
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
          className="line-clamp-3 text-[13.6px] leading-[1.38] font-semibold text-fg after:absolute after:inset-0 focus-visible:outline-none"
        >
          {a.nume}
        </Link>

        <span className="mt-1.5 truncate font-mono text-[11.5px] text-faint">{a.sku}</span>
      </div>

      {/* ── 3. Talpa: prețul la stânga, coșul la dreapta ──

          E FRATE CU CELELALTE DOUĂ ZONE, nu copil al celei din mijloc. Așa linia
          ei merge de la o margine a cardului la cealaltă, ca aceea de sub poză.
          Înainte stătea înăuntrul zonei cu padding, deci linia se oprea la 16px
          de fiecare margine și arăta a subliniere, nu a despărțire.

          Cardul are acum trei etaje și două linii între ele — fiecare lucru în
          caseta lui.

          `items-end` aliniază butonul cu ultimul rând de preț, nu cu primul:
          altfel, pe cardurile fără preț la volum, butonul s-ar ridica cu 18px
          față de vecinii lui.

          `group-hover:border-avo-600/25` duce rama de la hover și în interiorul
          cardului. Fără ea, tot efectul stă pe contur și mijlocul nu reacționează
          deloc. */}
      <div className="flex items-end justify-between gap-2 border-t border-line px-4 py-3 transition-colors duration-150 group-hover:border-avo-600/25">
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
                  la volum sunt cu 18px mai înalte decât celelalte. Aici
                  rezervarea are sens — talpa trebuie să fie de aceeași înălțime
                  la toate cardurile, ca linia ei să cadă pe aceeași poziție. */}
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
            `relative z-10` îl scoate de sub zona de clic a denumirii; fără el,
            apăsarea ar deschide produsul, nu ar adăuga în coș.

            NU EXISTĂ COȘ ÎNCĂ — magazinul e amânat. Până se deschide, duce la
            cererea de ofertă, singura acțiune care chiar se poate duce la capăt.
            Când apare coșul, se schimbă `href`-ul și atât.

            `aria-label` cu numele produsului: într-o bandă de cinci carduri,
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

  const file: { eticheta: string; adresa: string; articole: Articol[] }[] = [];

  if (oferte.length) {
    file.push({
      eticheta: "Oferte",
      adresa: "/catalog",
      articole: completeazaRandul(oferte.slice(0, PE_BANDA), produse),
    });
  }

  for (const c of [...dupaCategorie.values()]
    .filter((c) => c.produse.length >= PE_RAND)
    .sort((a, b) => b.produse.length - a.produse.length)
    .slice(0, FILE_CATEGORII)) {
    file.push({
      eticheta: c.nume,
      adresa: `/catalog/${c.slug}`,
      articole: c.produse.slice(0, PE_BANDA),
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
          {/* Rândul de comandă al secțiunii: bara de file la stânga, săgețile
              benzii la dreapta. `flex-1 min-w-0` pe pista filelor înseamnă că
              ea cedează lățime prima, iar săgețile rămân lipite de marginea
              dreaptă a coloanei — aceeași muchie pe care se termină ultimul card
              de sub ele. */}
          <div className="mt-6 flex items-center gap-4">
          <div className="fara-bara-derulare -mx-4 min-w-0 flex-1 overflow-x-auto px-4 py-1 lg:mx-0 lg:px-0">
            {/* ── Comutator segmentat, fără fond propriu ──

                ȘINA N-ARE CULOARE, doar conturul rotund de `line-strong`. Fondul
                care se vede prin ea e al secțiunii. A fost o tură cu șina
                colorată (#e9eff6) ca plăcuța albă să se desprindă de ea, dar pata
                aia de gri-albăstrui n-avea rudă nicăieri în pagină: toate
                celelalte suprafețe din site sunt ori albe, ori `--canvas`.

                CE ȚINE PLĂCUȚA LIZIBILĂ ACUM, când și ea, și fondul sunt aproape
                albe: conturul. Fila deschisă primește exact aceeași ramă de 1px
                `line-strong` ca bara din jur, ca butonul „Vezi toate produsele" și
                ca fiecare card de dedesubt. Nu se vede fiindcă e mai deschisă
                decât fondul — nu e, sunt două puncte între ele — ci fiindcă e
                singurul lucru din bară care are margini.

                Rama e desenată ca `box-shadow`, nu ca `border`: un `border` ar fi
                adăugat 2px la cutie, deci eticheta s-ar fi lărgit la fiecare
                schimbare de filă și restul barei s-ar fi mutat.

                FILELE ÎNCHISE NU PRIMESC FUNDAL SUB MOUSE, doar textul li se
                închide. Un fond pe hover ar fi pus în bară un al doilea
                dreptunghi, iar cel de sub mouse s-ar fi bătut cu cel deschis. */}
            <div className="inline-flex gap-0.5 rounded-full border border-line-strong p-1.5">
              {file.map((f, i) => (
                <label
                  key={f.eticheta}
                  htmlFor={`fila-${i}`}
                  className="shrink-0 cursor-pointer rounded-full px-5 py-3 text-[14.5px] font-semibold whitespace-nowrap text-muted transition-colors hover:text-fg"
                >
                  {f.eticheta}
                </label>
              ))}
            </div>
          </div>

            <SagetiFile />
          </div>
        </div>

        {file.map((f, i) => (
          <div key={f.eticheta} data-fila={i} className="pt-7">
            {/* ── Banda ──

                A FOST O GRILĂ DE CINCI. Grila arăta exact atâtea produse câte
                încăpeau pe un rând, deci fila era un rând, nu o categorie. Banda
                ține 12 și arată 5: restul se aduc cu săgețile, fără să crească
                secțiunea pe verticală.

                LĂȚIMEA CARDULUI E SCRISĂ AICI, nu în bandă. 278px include cei
                16px de spațiu din dreapta (`pr-4`), deci cardul rămâne la 262 —
                exact cât avea în grila de cinci: (1376 − 4 × 16) / 5. Banda nu
                introduce o a doua dimensiune de card, o poartă pe aceeași.

                La 1440 intră patru carduri întregi și 95% din al cincilea. Bucata
                tăiată e intenționată: e singurul lucru care spune, înainte de
                orice săgeată, că lista continuă.

                PE TELEFON cardul e o fracțiune din ecran — lățimea vizibilă
                împărțită la 2,4, ca la banda de lichidare. Se văd două carduri
                întregi și o bucată din al treilea.

                PISTA E MARCAJ DE SERVER CURAT, fără nicio componentă de client.
                Derularea nativă merge cu degetul, cu trackpad-ul și cu Tab-ul,
                fără o linie de JavaScript; `data-pista` e cârligul prin care
                săgețile din capul secțiunii o găsesc pe cea deschisă (vezi
                SagetiFile.tsx). Așa, cele șase file încarcă un singur control,
                nu șase componente de client. */}
            <div
              data-pista
              className="fara-bara-derulare -my-1 -mx-4 flex snap-x snap-mandatory scroll-px-4 overflow-x-auto px-4 py-1 lg:mx-0 lg:scroll-px-0 lg:px-0"
            >
              {f.articole.map((a) => (
                <div
                  key={a.sku}
                  /* ULTIMUL CARD N-ARE SPAȚIU DUPĂ EL: 262px lățime, zero padding.
                     Cele cinci carduri ale filei „Oferte" ieșeau altfel 1390px
                     într-o pistă de 1376 — 14px de derulat, adică săgeata se
                     aprindea, muta banda cu 14px și se stingea. Arăta a defect.
                     Acum fac 4 × 278 + 262 = 1374, deci banda chiar nu se
                     derulează, iar ambele săgeți sunt stinse pe bună dreptate.

                     LĂȚIMEA SE SCHIMBĂ, NU DOAR PADDING-UL. Cu `pr-0` singur,
                     cutia rămânea la 278 — padding-ul e în interiorul lățimii —
                     deci ultimul card se lățea la 278, cu 16px mai mult decât
                     vecinii lui, și cei 14px de derulat rămâneau pe loc.

                     Pe telefon nu se aplică: acolo nu există săgeți, iar banda se
                     trage cu degetul, deci un spațiu la capăt nu deranjează. */
                  className="w-[calc((100vw-var(--coloana-pad))/2.4)] shrink-0 snap-start pr-3 sm:w-[278px] sm:pr-4 sm:last:w-[262px] sm:last:pr-0"
                >
                  <Card a={a} />
                </div>
              ))}
            </div>

            {/* ── Butonul de închidere a filei, în stânga jos ──

                Aliniat cu prima coloană a benzii și cu titlul secțiunii. Navigarea
                prin fereastră a urcat sus, lângă file; aici rămâne doar ieșirea
                din ea, iar coloana din stânga e locul unde începe orice rând din
                pagina asta.

                Aceeași ramă `line-strong` ca bara de file — sunt comenzile
                secțiunii, deci aceeași familie.

                ACELAȘI TEXT PE TOATE FILELE. A fost compus din etichetă — „Vezi
                tot " + numele filei — și ieșea „Vezi tot oferte", „Vezi tot
                sisteme de montaj". Adresa diferă de la o filă la alta, dar pentru
                cititorul de ecran fiecare panou are deja numele lui, deci un text
                identic nu pierde nimic.

                SĂGEATA ALUNECĂ 2px la hover, nu butonul. */}
            <div className="mt-6">
              <Link
                href={f.adresa}
                className="group inline-flex h-11 items-center gap-2.5 rounded-control border border-line-strong bg-surface px-6 text-[14.5px] font-semibold text-fg shadow-[0_1px_2px_rgb(16_24_40/0.04)] transition-colors hover:border-avo-600 hover:bg-avo-50 hover:text-avo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-avo-600"
              >
                Vezi toate produsele
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
