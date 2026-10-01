import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { gasesteBrand } from "@/lib/branduri";
import { bani, incarcaMoneda } from "@/lib/moneda";
import { BADGE, BADGE_CARD, BADGE_ECONOMIE, BADGE_LICHIDARE, BADGE_OFERTA } from "./stiluri";
import type { Produs } from "@/lib/produs";

/* ══════════════════════════════════════════════════════════════════════════
   CARDUL DE PRODUS — unul singur, pentru tot site-ul
   ──────────────────────────────────────────────────────────────────────────
   ERAU TREI, ȘI ARĂTAU DIFERIT:

     components/acasa/ProduseCuFile.tsx ... cardul cu trei etaje
     components/oferte/CardOferta.tsx ..... insigne, cifră în loc de poză, bandă
                                            cu brand și SKU, buton „Vezi"
     app/catalog/[...categorie]/page.tsx .. scris direct în pagină: poză pe gri,
                                            nume, SKU, preț. Fără marcă, fără
                                            preț de volum, fără insigne

   Trei rețete pentru același obiect înseamnă trei locuri de reparat la fiecare
   schimbare, și trei feluri în care același produs arată, după pagina pe care
   nimerești. Acum e unul singur, și de-aia rețeta de mai jos s-a putut schimba
   într-un loc pentru tot site-ul.

   ─── DESENUL E CEL DIN PROTOTIPUL SOLARONE ───────────────────────────────

   Preluat din Desktop/Projects/Solarone.ro (`stil-v2.css`, clasele `.p*`), cu
   cifrele lui:

     poza ....... 180px înălțime, lată cât cardul, `object-contain`, în 20px
                  de aer. NU o poză mică centrată într-o casetă — produsul ocupă
                  toată lățimea disponibilă
     rândul de sus  sigla mărcii la stânga, disponibilitatea la dreapta
     denumirea .. 13,6px / 600 / interlinie 1,38, tăiată la trei rânduri
     codul ...... 11,5px, monospațiat, pe un rând
     prețul ..... 21px / 800, cu unitatea într-un corp mic lângă el; sub el,
                  rândul secundar. Deasupra lor, o linie
     acțiunea ... buton lat, cât cardul

   ─── CE AM SCHIMBAT FAȚĂ DE PROTOTIP, ȘI DE CE ───────────────────────────

   1. DENUMIREA N-ARE ÎNĂLȚIME REZERVATĂ. Prototipul îi pune `min-height:56px`,
      adică loc pentru trei rânduri chiar când are unul. Exact golul ăla, între
      denumire și cod, a fost reclamat pe cardul nostru și scos. Aici spațiul
      care prisosește se adună deasupra liniei prețului, unde nu desparte nimic.

   2. SUB POZĂ RĂMÂNE O LINIE. Prototipul n-are; a fost cerută separat, ca să se
      vadă unde se termină fotografia.

   3. PASTILA DE DISPONIBILITATE SE ARATĂ DOAR CÂND EXISTĂ. Prototipul scrie
      „în stoc" pe fiecare card. Noi n-avem datele: în tot catalogul, singura
      valoare reală de disponibilitate e „Lichidare stoc", pe 15 produse. „În
      stoc" apare doar în lista de rezervă scrisă în cod. Un „în stoc" pus pe
      toate cardurile ar fi o promisiune inventată.

   4. FĂRĂ BUTONUL DE COMPARAȚIE. Prototipul are lângă coș un pătrat „⇄". Nu
      există funcția, deci ar fi fost un buton care nu face nimic; butonul de
      acțiune ia toată lățimea.

   5. INSIGNELE RĂMÂN de la cardul de ofertă — „Ofertă", economia la volum,
      „Lichidare". Toate trei vin din date.

   6. CIFRA ÎN LOC DE POZĂ, tot de la cardul de ofertă: când produsul n-are
      fotografie, în locul ei stă specificația care îl identifică („615 Wp",
      „16 kWh"). 93 de produse n-au poză, iar pentru un instalator cifra spune
      cel puțin la fel de mult ca un dreptunghi gol.
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Forma minimă pe care o desenează cardul.
 *
 * O satisfac `Oferta` (lib/oferte.ts) și `Produs` (lib/produs.ts) fără nicio
 * conversie. Nodurile brute de GraphQL se aduc la ea la locul apelului — acolo
 * e și singurul loc unde se știe ce înseamnă câmpurile lor.
 */
export type ArticolCard = {
  slug?: string;
  sku?: string;
  nume: string;
  brand?: string;
  imagine?: { url: string; alt?: string };
  /** Ține locul fotografiei când nu există: „615 Wp", „16 kWh". */
  spec?: { valoare: string; unitate: string };
  pret?: number;
  /** Catalogul scrie „LA CERERE" în locul prețului. Atunci `pret` e 0. */
  pretLaCerere?: boolean;
  pretVolum?: number;
  prag?: string;
  unitate?: string;
  disponibilitate?: string;
  /** Produsul e pe coperta catalogului — `featured` în WooCommerce. */
  laOferta?: boolean;
  /**
   * Categoria produsului — rezerva de link pentru cele fără slug propriu.
   *
   * DOUĂ FORME, INTENȚIONAT. `Oferta` o ține ca slug (`"invertoare"`), `Produs`
   * ca obiect (`{ nume, slug }`). Dacă aș fi ales una, celălalt tip ar fi avut
   * nevoie de o conversie la fiecare loc de apel — adică exact felul de lucru
   * mărunt care se uită într-un colț și lasă un link rupt. Cardul normalizează
   * o dată, aici.
   */
  categorie?: string | { slug: string; nume?: string };
};

/* ══════════════════════════════════════════════════════════════════════════
   PRODUSUL DIN WOOCOMMERCE, ADUS LA FORMA CARDULUI
   ──────────────────────────────────────────────────────────────────────────
   `Oferta` (lib/oferte.ts) e deja croită după cardul ăsta: se dă direct ca
   `a`, fără nicio conversie. `Produs` (lib/produs.ts) nu e — două câmpuri poartă
   alt nume, fiindcă acolo descriu fișa de produs, nu cardul:

     cifra  → spec      cifra care ține locul fotografiei
     oferta → laOferta  produsul e pe coperta catalogului

   STRUCTURAL, TypeScript ACCEPTĂ ȘI `Produs` DIRECT — toate câmpurile care
   lipsesc sunt opționale. De-aia `completeazaRandul` din ProduseCuFile.tsx
   împinge produse brute în cardurile filei „Oferte" fără nicio eroare, și de-aia
   cardurile alea n-au nici cifră, nici insigna „Ofertă", deși datele există.
   Tăcerea compilatorului nu e o confirmare că datele ajung unde trebuie.

   Funcția asta e locul unde cele două nume se întâlnesc, o singură dată.
   Importul e doar de tip, deci cardul nu capătă nicio legătură de execuție cu
   `lib/` — regula e că fișierele care vorbesc cu WordPress nu se ating pentru
   lucrări de aspect, iar un `import type` dispare la compilare.
   ══════════════════════════════════════════════════════════════════════════ */
export function caArticol(p: Produs): ArticolCard {
  return {
    slug: p.slug,
    sku: p.sku,
    nume: p.nume,
    brand: p.brand,
    imagine: p.imagine,
    spec: p.cifra,
    pret: p.pret,
    pretVolum: p.pretVolum,
    prag: p.prag,
    unitate: p.unitate,
    disponibilitate: p.disponibilitate,
    laOferta: p.oferta,
    categorie: p.categorie,
  };
}


/* ══════════════════════════════════════════════════════════════════════════
   CORPUL DENUMIRII, ALES DUPĂ LUNGIME
   ──────────────────────────────────────────────────────────────────────────
   Cutia denumirii are înălțime FIXĂ (două rânduri de la `sm` în sus). Ca un
   nume lung să încapă în ea fără să fie retezat, scade corpul literei.

   ─── PRAGURILE SUNT MĂSURATE, NU ALESE ───────────────────────────────────

   Am pus toate cele 172 de denumiri din catalog într-o cutie de lățimea celui
   mai îngust card din site (226px interior, grila din /catalog) și am numărat
   rândurile, cu fontul real:

     la 13,6px .... 7 nume trec de două rânduri. TOATE au 67 de caractere sau
                    mai mult; cel mai scurt care pică are 67
     la 12,6px .... mai pică două, cele de 82 și 84 de caractere
     la 10,8px .... încap toate

   De aici cele două praguri. Nu sunt rotunjiri frumoase, sunt cifrele la care
   se schimbă comportamentul măsurat.

   DE CE MERGE O REGULĂ PE NUMĂRUL DE CARACTERE, deși lățimea unui text depinde
   de CARE litere sunt: pentru că, la măsurătoare, niciun nume scurt n-a picat.
   Cele care pică sunt toate „Sistem de montaj panouri fotovoltaice …" — lungi
   și cu coduri nedespărțibile la capăt. Dacă vreodată apare un nume scurt cu un
   cuvânt foarte lung, `line-clamp` îl taie: cutia nu se revarsă niciodată,
   indiferent ce intră în ea.

   ─── DE CE NU SE MERGE MAI JOS DE 10,8px ─────────────────────────────────

   Pe cardul de telefon (124px interior) ar fi trebuit 9,4px ca să încapă tot,
   iar acolo textul nu mai e de citit, e de ghicit. Sub prag, numele se taie cu
   trei puncte — pagina produsului îl are întreg. Un nume retezat e mai bun
   decât unul ilizibil.
   ══════════════════════════════════════════════════════════════════════════ */
function corpDenumire(nume: string): string {
  if (nume.length <= 66) return "13.6px";
  if (nume.length <= 80) return "12.6px";
  return "10.8px";
}

export default async function CardProdus({
  a,
  /**
   * Primele carduri dintr-o grilă își încarcă fotografia imediat, nu leneș:
   * primul rând e în primul ecran și conține elementul LCP al paginii. Restul
   * rămân `lazy`, inclusiv cele din filele închise, care nici nu se văd.
   */
  prioritate = false,
}: {
  a: ArticolCard;
  prioritate?: boolean;
}) {
  /* Moneda vine din magazin, nu din cod.
     `incarcaMoneda` e memoizată cu `cache`, deci o grilă de 215 carduri face o
     singură cerere, nu 215. Componenta devine async doar pentru asta — e un
     server component, randat la construcție, deci nu costă nimic la rulare. */
  const m = await incarcaMoneda();
  const slugCategorie = typeof a.categorie === "string" ? a.categorie : a.categorie?.slug;
  const adresa = a.slug
    ? `/catalog/produs/${a.slug}`
    : slugCategorie
      ? `/catalog/${slugCategorie}`
      : "/catalog";
  const sigla = gasesteBrand(a.brand)?.slug;
  const economie =
    typeof a.pret === "number" && typeof a.pretVolum === "number" && a.pretVolum > 0
      ? a.pret - a.pretVolum
      : 0;
  const laLichidare = a.disponibilitate === "Lichidare stoc";
  const arePret = !a.pretLaCerere && typeof a.pret === "number" && a.pret > 0;

  return (
    /* `<article>`, nu `<Link>`, fiindcă are DOUĂ acțiuni: deschide produsul și
       cere ofertă. Un `<a>` înăuntrul altui `<a>` nu e marcaj valid, iar
       browserele îl repară imprevizibil.

       Cardul rămâne apăsabil pe toată suprafața prin linkul de pe denumire, care
       își întinde zona de clic cu `after:absolute after:inset-0`. Butonul de jos
       stă peste el, cu `relative z-10`. Pentru un cititor de ecran sunt două
       linkuri cu nume diferite, exact cât trebuie.

       `card-produs` aduce rama de la hover — contur albastru și halou, fără să
       miște cardul din loc. E în globals.css, lângă explicație.

       `h-full`: învelișul se întinde la înălțimea celui mai înalt card din rând,
       dar articolul dinăuntru ar rămâne cât îi cere conținutul, iar butonul lui
       n-ar mai cădea pe linia vecinilor. */
    <article className="card-produs group relative flex h-full flex-col overflow-hidden rounded-card border border-line-strong bg-surface shadow-[0_1px_2px_rgb(16_24_40/0.04)]">
      {/* ── Fotografia, sau cifra care îi ține locul ──
          Lată cât cardul, nu centrată într-o casetă: la aceeași înălțime,
          produsul iese cu o treime mai mare. */}
      <div className="relative border-b border-line p-3.5 transition-colors duration-150 group-hover:border-avo-600/25 sm:p-5">
        {/* Insignele. Grupul se rupe pe rânduri dacă nu încape: la 145px
            lățime, „Ofertă" plus economia nu intră una lângă alta. */}
        {(a.laOferta || economie > 0 || laLichidare) && (
          <div className="absolute top-2 left-2 z-10 flex flex-wrap gap-1 sm:top-3 sm:left-3">
            {a.laOferta && <span className={`${BADGE} ${BADGE_CARD} ${BADGE_OFERTA}`}>Ofertă</span>}
            {economie > 0 && (
              <span className={`${BADGE} ${BADGE_CARD} ${BADGE_ECONOMIE}`}>
                −{bani(economie, m)} / {a.unitate ?? "buc"}
              </span>
            )}
            {laLichidare && (
              <span className={`${BADGE} ${BADGE_CARD} ${BADGE_LICHIDARE}`}>Lichidare</span>
            )}
          </div>
        )}

        {a.imagine ? (
          <Image
            src={a.imagine.url}
            alt={a.imagine.alt ?? a.nume}
            width={320}
            height={180}
            sizes="(max-width: 640px) 45vw, 300px"
            loading={prioritate ? "eager" : "lazy"}
            fetchPriority={prioritate ? "high" : "auto"}
            className="h-[140px] w-full object-contain transition-transform duration-300 group-hover:scale-105 sm:h-[180px]"
          />
        ) : (
          <div className="flex h-[140px] w-full items-center justify-center sm:h-[180px]">
            {a.spec ? (
              /* Unitatea stă lipită de cifră, ca într-o fișă tehnică, nu ca
                 într-o propoziție. */
              <span className="flex items-baseline gap-0.5 text-muted">
                <span className="text-[34px] leading-none font-extrabold tracking-[-0.03em] text-fg sm:text-[40px]">
                  {a.spec.valoare}
                </span>
                <span className="text-[15px] font-bold sm:text-[17px]">{a.spec.unitate}</span>
              </span>
            ) : (
              <span className="text-xs text-faint">Fără imagine</span>
            )}
          </div>
        )}
      </div>

      {/* ── Corpul ── */}
      <div className="flex flex-1 flex-col px-4 pt-3 pb-4">
        {/* Rândul de sus: sigla mărcii.

            PROTOTIPUL ARE AICI ȘI O PASTILĂ „în stoc", LA DREAPTA. Am pus-o, am
            văzut-o pe pagina randată și am scos-o: apărea pe patru carduri, iar
            valoarea nu venea din catalog, ci din lista de rezervă scrisă de mână
            în lib/oferte.ts, unde cele patru produse au `disponibilitate: "În
            stoc"` bătut în cod. În tot catalogul real, singura valoare de
            disponibilitate e „Lichidare stoc", pe 15 produse — „În stoc" nu
            există nicăieri.

            Un „în stoc" pe un card e o promisiune către cumpărător. Nu se scrie
            din lipsa unei date, se scrie din date. Lichidarea, care CHIAR e în
            catalog, se vede oricum: are insigna ei peste fotografie.

            Înălțimea rămâne rezervată chiar când produsul n-are siglă în set —
            fără ea, cardurile fără siglă își ridică denumirea cu 16px. */}
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
            <span className="truncate text-[10.5px] font-bold tracking-wider text-faint uppercase">
              {a.brand}
            </span>
          ) : null}
        </div>

        {/* ── Denumirea, în cutie de înălțime fixă ──

            ASTA E CE FACE CARDUL SĂ NU-ȘI MAI SCHIMBE ÎNĂLȚIMEA. Înainte,
            denumirea avea doar `line-clamp-3` și creștea cu textul: o filă cu
            nume scurte dădea carduri de 424px, una cu nume lungi de 443px, iar
            trecerea de la o categorie la alta le schimba dimensiunea sub ochi.
            Acum cutia are 38px de la `sm` în sus (două rânduri) și 56px pe
            telefon (trei), indiferent ce scrie în ea.

            `items-end` LIPEȘTE DENUMIREA DE COD. Când numele ocupă un singur
            rând, spațiul rămas trebuie să cadă undeva; aliniat jos, cade
            DEASUPRA denumirii, lângă sigla mărcii, nu între denumire și codul
            ei. Golul dintre două informații despre același produs a fost exact
            reclamația de care am scăpat mai devreme.

            Corpul literei vine din `corpDenumire()` — vezi explicația și
            măsurătorile de mai sus. */}
        <div className="flex h-[75px] items-end sm:h-[38px]">
          <Link
            href={adresa}
            style={{ fontSize: corpDenumire(a.nume) }}
            className="line-clamp-4 leading-[1.38] font-semibold text-fg transition-colors after:absolute after:inset-0 group-hover:text-avo-700 focus-visible:outline-none sm:line-clamp-2"
          >
            {a.nume}
          </Link>
        </div>

        {/* Rândul codului își păstrează înălțimea și când produsul n-are cod:
            fără asta, cardurile fără SKU ar fi cu 16px mai scunde decât
            vecinii, adică exact problema pe care o rezolvă cutia de deasupra. */}
        <span className="mt-1.5 block h-4 truncate font-mono text-[11.5px] leading-4 text-faint">
          {a.sku ?? ""}
        </span>

        {/* ── Prețul ──
            `mt-auto` îl ține lipit de fundul corpului, oricât de scurtă ar fi
            denumirea: acolo se adună spațiul care prisosește. Rândul secundar își
            păstrează înălțimea și când e gol, ca butoanele de pe un rând de
            carduri să cadă toate pe aceeași linie. */}
        <div className="mt-auto border-t border-line pt-2.5 transition-colors duration-150 group-hover:border-avo-600/25">
          {arePret ? (
            <div className="truncate text-[21px] leading-none font-extrabold tracking-[-0.03em] text-fg">
              {bani(a.pret as number, m)}
              {a.unitate ? (
                <span className="ml-1 text-[13px] font-semibold text-muted">{` / ${a.unitate}`}</span>
              ) : null}
            </div>
          ) : (
            <div className="text-[16px] leading-none font-bold text-muted">Preț la cerere</div>
          )}
          <div className="mt-1.5 h-[17px] truncate text-[11.8px] text-faint">
            {arePret && a.pretVolum && a.prag ? `${bani(a.pretVolum, m)} de la ${a.prag}` : null}
          </div>
        </div>

        {/* ── Acțiunea ──
            NU EXISTĂ COȘ ÎNCĂ — magazinul e amânat. Până se deschide, butonul
            duce la cererea de ofertă, singura acțiune care se poate duce la
            capăt, și scrie ce face. Când apare coșul, se schimbă textul și
            `href`-ul.

            `relative z-10` îl scoate de sub zona de clic a denumirii. `aria-label`
            cu numele produsului: într-un rând de cinci carduri, cinci butoane
            numite la fel sunt de nefolosit la cititorul de ecran. */}
        <Link
          href="/cerere-oferta"
          aria-label={`Cere ofertă pentru ${a.nume}`}
          className="relative z-10 mt-3 flex h-10 items-center justify-center gap-2 rounded-control bg-avo-600 text-[13.5px] font-semibold text-white transition-colors hover:bg-avo-700 active:bg-avo-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-avo-600"
        >
          <ShoppingCart size={16} aria-hidden />
          Cere ofertă
        </Link>
      </div>
    </article>
  );
}
